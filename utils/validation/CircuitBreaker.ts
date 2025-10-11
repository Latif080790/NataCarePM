/**
 * 🔄 CIRCUIT BREAKER PATTERN FOR FIREBASE OPERATIONS
 * Prevents cascading failures and provides fallback mechanisms
 */

export interface CircuitBreakerOptions {
    failureThreshold: number;     // Number of failures before opening circuit
    recoveryTimeout: number;      // Time to wait before attempting recovery (ms)
    successThreshold: number;     // Number of successes needed to close circuit
    monitoringInterval: number;   // Interval for health checks (ms)
}

export enum CircuitState {
    CLOSED = 'CLOSED',       // Normal operation
    OPEN = 'OPEN',           // Circuit is open, failing fast
    HALF_OPEN = 'HALF_OPEN'  // Testing if service has recovered
}

export interface CircuitBreakerStats {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime?: Date;
    lastSuccessTime?: Date;
    totalRequests: number;
    failedRequests: number;
}

/**
 * Circuit Breaker implementation for Firebase operations
 */
export class FirebaseCircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failures: number = 0;
    private successes: number = 0;
    private lastFailureTime?: Date;
    private lastSuccessTime?: Date;
    private totalRequests: number = 0;
    private failedRequests: number = 0;
    private nextRetryTime: number = 0;

    constructor(
        private readonly name: string,
        private readonly options: CircuitBreakerOptions = {
            failureThreshold: 5,
            recoveryTimeout: 60000, // 1 minute
            successThreshold: 3,
            monitoringInterval: 30000 // 30 seconds
        }
    ) {
        // Start health monitoring
        this.startHealthMonitoring();
    }

    /**
     * Execute operation with circuit breaker protection
     */
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        this.totalRequests++;

        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextRetryTime) {
                throw new Error(`Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`);
            } else {
                // Transition to half-open state
                this.state = CircuitState.HALF_OPEN;
                this.successes = 0;
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    /**
     * Handle successful operation
     */
    private onSuccess(): void {
        this.lastSuccessTime = new Date();
        this.successes++;

        if (this.state === CircuitState.HALF_OPEN) {
            // Check if we have enough successes to close the circuit
            if (this.successes >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.failures = 0;
                console.log(`Circuit breaker CLOSED for ${this.name} - service recovered`);
            }
        } else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on success
            this.failures = 0;
        }
    }

    /**
     * Handle failed operation
     */
    private onFailure(): void {
        this.lastFailureTime = new Date();
        this.failures++;
        this.failedRequests++;

        if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
            if (this.failures >= this.options.failureThreshold) {
                this.state = CircuitState.OPEN;
                this.nextRetryTime = Date.now() + this.options.recoveryTimeout;
                console.warn(`Circuit breaker OPENED for ${this.name} - service appears to be failing`);
            }
        }
    }

    /**
     * Get current circuit breaker statistics
     */
    getStats(): CircuitBreakerStats {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime,
            lastSuccessTime: this.lastSuccessTime,
            totalRequests: this.totalRequests,
            failedRequests: this.failedRequests
        };
    }

    /**
     * Force circuit state (for testing)
     */
    setState(state: CircuitState): void {
        this.state = state;
        if (state === CircuitState.CLOSED) {
            this.failures = 0;
            this.successes = 0;
        }
    }

    /**
     * Check if circuit allows requests
     */
    isAvailable(): boolean {
        return this.state === CircuitState.CLOSED || 
               (this.state === CircuitState.HALF_OPEN) ||
               (this.state === CircuitState.OPEN && Date.now() >= this.nextRetryTime);
    }

    /**
     * Start health monitoring
     */
    private startHealthMonitoring(): void {
        setInterval(() => {
            const stats = this.getStats();
            const failureRate = stats.totalRequests > 0 ? 
                (stats.failedRequests / stats.totalRequests) * 100 : 0;

            console.log(`Circuit Breaker ${this.name} Health:`, {
                state: stats.state,
                failureRate: `${failureRate.toFixed(2)}%`,
                totalRequests: stats.totalRequests,
                failures: stats.failures,
                successes: stats.successes
            });

            // Reset counters periodically to prevent overflow
            if (stats.totalRequests > 10000) {
                this.totalRequests = Math.floor(this.totalRequests / 2);
                this.failedRequests = Math.floor(this.failedRequests / 2);
            }
        }, this.options.monitoringInterval);
    }
}

/**
 * Circuit Breaker Manager for Firebase services
 */
export class CircuitBreakerManager {
    private static instance: CircuitBreakerManager;
    private breakers: Map<string, FirebaseCircuitBreaker> = new Map();

    private constructor() {}

    static getInstance(): CircuitBreakerManager {
        if (!CircuitBreakerManager.instance) {
            CircuitBreakerManager.instance = new CircuitBreakerManager();
        }
        return CircuitBreakerManager.instance;
    }

    /**
     * Get or create circuit breaker for service
     */
    getCircuitBreaker(serviceName: string, options?: Partial<CircuitBreakerOptions>): FirebaseCircuitBreaker {
        if (!this.breakers.has(serviceName)) {
            const defaultOptions: CircuitBreakerOptions = {
                failureThreshold: 5,
                recoveryTimeout: 60000,
                successThreshold: 3,
                monitoringInterval: 30000
            };

            this.breakers.set(
                serviceName, 
                new FirebaseCircuitBreaker(serviceName, { ...defaultOptions, ...options })
            );
        }

        return this.breakers.get(serviceName)!;
    }

    /**
     * Get all circuit breaker statistics
     */
    getAllStats(): Record<string, CircuitBreakerStats> {
        const stats: Record<string, CircuitBreakerStats> = {};
        
        for (const [name, breaker] of this.breakers) {
            stats[name] = breaker.getStats();
        }
        
        return stats;
    }

    /**
     * Check overall system health
     */
    getSystemHealth(): {
        healthy: boolean;
        openCircuits: string[];
        totalCircuits: number;
        healthScore: number;
    } {
        const allStats = this.getAllStats();
        const circuitNames = Object.keys(allStats);
        const openCircuits = circuitNames.filter(name => 
            allStats[name].state === CircuitState.OPEN
        );

        const healthScore = circuitNames.length > 0 ? 
            ((circuitNames.length - openCircuits.length) / circuitNames.length) * 100 : 100;

        return {
            healthy: openCircuits.length === 0,
            openCircuits,
            totalCircuits: circuitNames.length,
            healthScore
        };
    }
}

// Export circuit breaker utilities
export const circuitBreakerManager = CircuitBreakerManager.getInstance();