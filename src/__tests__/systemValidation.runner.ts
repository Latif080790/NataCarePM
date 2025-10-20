// Simplified System Validation Runner for Intelligent Document System
const { mockServices } = require('./setup');

// Validation interfaces
interface ValidationResult {
    category: string;
    name: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    message: string;
    details?: any;
    executionTime?: number;
}

interface ValidationReport {
    overallStatus: 'PASS' | 'FAIL' | 'WARNING';
    timestamp: Date;
    summary: {
        totalTests: number;
        passed: number;
        failed: number;
        warnings: number;
    };
    categories: ValidationResult[];
    recommendations: string[];
    performanceMetrics: {
        totalExecutionTime: number;
        averageResponseTime: number;
        systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    };
}

class SystemValidator {
    private results: ValidationResult[] = [];
    private startTime: number = 0;

    async runValidation(): Promise<ValidationReport> {
        console.log('🔍 Starting System Validation...');
        this.startTime = Date.now();
        this.results = [];

        // Run all validation categories
        await this.validateCoreSystem();
        await this.validateDataIntegrity();
        await this.validateBusinessLogic();
        await this.validateSecurity();
        await this.validatePerformance();
        await this.validateErrorHandling();

        const totalTime = Date.now() - this.startTime;
        return this.generateReport(totalTime);
    }

    private async validateCoreSystem(): Promise<void> {
        console.log('🔧 Validating Core System...');

        // Test basic document creation
        const startTime = Date.now();
        try {
            const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' });
            const document = await mockServices.intelligentDocumentService.createDocument(
                'Validation Test',
                'System validation test',
                'other',
                'validation_project',
                'validation_user',
                testFile
            );

            if (document && document.id) {
                this.addResult({
                    category: 'Core System',
                    name: 'Document Creation',
                    status: 'PASS',
                    message: 'Document creation successful',
                    executionTime: Date.now() - startTime
                });
            } else {
                throw new Error('Document creation returned invalid result');
            }

            // Cleanup
            await mockServices.intelligentDocumentService.deleteDocument(document.id, 'validation_user');
        } catch (error: any) {
            this.addResult({
                category: 'Core System',
                name: 'Document Creation',
                status: 'FAIL',
                message: `Document creation failed: ${error.message}`,
                executionTime: Date.now() - startTime
            });
        }

        // Test service availability
        const services = [
            'intelligentDocumentService.createDocument',
            'intelligentDocumentService.getDocument',
            'intelligentDocumentService.updateDocument',
            'intelligentDocumentService.deleteDocument',
            'intelligentDocumentService.searchDocuments'
        ];

        for (const service of services) {
            const isAvailable = this.checkServiceAvailability(service);
            this.addResult({
                category: 'Core System',
                name: `Service: ${service}`,
                status: isAvailable ? 'PASS' : 'FAIL',
                message: isAvailable ? 'Service available' : 'Service unavailable'
            });
        }
    }

    private async validateDataIntegrity(): Promise<void> {
        console.log('📊 Validating Data Integrity...');

        const startTime = Date.now();
        try {
            // Create test document
            const testFile = new File(['Data integrity test'], 'integrity.txt', { type: 'text/plain' });
            const document = await mockServices.intelligentDocumentService.createDocument(
                'Integrity Test',
                'Data integrity validation',
                'report',
                'validation_project',
                'validation_user',
                testFile
            );

            // Verify document properties
            const requiredProperties = ['id', 'title', 'createdAt', 'updatedAt', 'status', 'auditTrail'];
            const missingProperties = [];

            for (const prop of requiredProperties) {
                if (!(prop in document) || document[prop] === undefined) {
                    missingProperties.push(prop);
                }
            }

            if (missingProperties.length === 0) {
                this.addResult({
                    category: 'Data Integrity',
                    name: 'Document Schema',
                    status: 'PASS',
                    message: 'All required properties present',
                    executionTime: Date.now() - startTime
                });
            } else {
                this.addResult({
                    category: 'Data Integrity',
                    name: 'Document Schema',
                    status: 'FAIL',
                    message: `Missing properties: ${missingProperties.join(', ')}`,
                    executionTime: Date.now() - startTime
                });
            }

            // Test data consistency after update
            const updatedDocument = await mockServices.intelligentDocumentService.updateDocument(
                document.id,
                { title: 'Updated Title' },
                'validation_user',
                'Validation update'
            );

            if (updatedDocument.title === 'Updated Title' && updatedDocument.id === document.id) {
                this.addResult({
                    category: 'Data Integrity',
                    name: 'Data Consistency',
                    status: 'PASS',
                    message: 'Data remains consistent after update'
                });
            } else {
                this.addResult({
                    category: 'Data Integrity',
                    name: 'Data Consistency',
                    status: 'FAIL',
                    message: 'Data consistency issues detected'
                });
            }

            // Cleanup
            await mockServices.intelligentDocumentService.deleteDocument(document.id, 'validation_user');
        } catch (error: any) {
            this.addResult({
                category: 'Data Integrity',
                name: 'Overall',
                status: 'FAIL',
                message: `Data integrity validation failed: ${error.message}`,
                executionTime: Date.now() - startTime
            });
        }
    }

    private async validateBusinessLogic(): Promise<void> {
        console.log('🔄 Validating Business Logic...');

        // Test document workflow
        const startTime = Date.now();
        try {
            const testFile = new File(['Business logic test'], 'business.txt', { type: 'text/plain' });
            const document = await mockServices.intelligentDocumentService.createDocument(
                'Business Logic Test',
                'Testing business rules',
                'contract',
                'validation_project',
                'validation_user',
                testFile
            );

            // Test status transitions
            const statuses = ['draft', 'published', 'archived'];
            for (let i = 0; i < statuses.length; i++) {
                const updatedDoc = await mockServices.intelligentDocumentService.updateDocumentStatus(
                    document.id,
                    statuses[i],
                    'validation_user',
                    `Status change to ${statuses[i]}`
                );

                if (updatedDoc.status === statuses[i]) {
                    this.addResult({
                        category: 'Business Logic',
                        name: `Status Transition to ${statuses[i]}`,
                        status: 'PASS',
                        message: `Successfully transitioned to ${statuses[i]}`
                    });
                } else {
                    this.addResult({
                        category: 'Business Logic',
                        name: `Status Transition to ${statuses[i]}`,
                        status: 'FAIL',
                        message: `Failed to transition to ${statuses[i]}`
                    });
                }
            }

            // Cleanup
            await mockServices.intelligentDocumentService.deleteDocument(document.id, 'validation_user');
        } catch (error: any) {
            this.addResult({
                category: 'Business Logic',
                name: 'Workflow Validation',
                status: 'FAIL',
                message: `Business logic validation failed: ${error.message}`,
                executionTime: Date.now() - startTime
            });
        }
    }

    private async validateSecurity(): Promise<void> {
        console.log('🔒 Validating Security...');

        // Test access control
        const startTime = Date.now();
        try {
            const testFile = new File(['Security test'], 'security.txt', { type: 'text/plain' });
            const document = await mockServices.intelligentDocumentService.createDocument(
                'Security Test',
                'Testing security features',
                'confidential',
                'validation_project',
                'validation_user',
                testFile
            );

            // Test unauthorized access
            let unauthorizedAccessBlocked = false;
            try {
                await mockServices.intelligentDocumentService.updateDocument(
                    document.id,
                    { title: 'Unauthorized Change' },
                    'unauthorized_user',
                    'Unauthorized attempt'
                );
            } catch (error: any) {
                if (error.message.includes('Unauthorized')) {
                    unauthorizedAccessBlocked = true;
                }
            }

            this.addResult({
                category: 'Security',
                name: 'Access Control',
                status: unauthorizedAccessBlocked ? 'PASS' : 'FAIL',
                message: unauthorizedAccessBlocked ? 'Unauthorized access properly blocked' : 'Security vulnerability detected',
                executionTime: Date.now() - startTime
            });

            // Test encryption
            await mockServices.intelligentDocumentService.encryptDocument(document.id, 'validation_user');
            const encryptedDoc = await mockServices.intelligentDocumentService.getDocument(document.id);

            this.addResult({
                category: 'Security',
                name: 'Encryption',
                status: encryptedDoc.encryptionStatus.isEncrypted ? 'PASS' : 'FAIL',
                message: encryptedDoc.encryptionStatus.isEncrypted ? 'Document encryption successful' : 'Document encryption failed'
            });

            // Cleanup
            await mockServices.intelligentDocumentService.deleteDocument(document.id, 'validation_user');
        } catch (error: any) {
            this.addResult({
                category: 'Security',
                name: 'Overall',
                status: 'FAIL',
                message: `Security validation failed: ${error.message}`,
                executionTime: Date.now() - startTime
            });
        }
    }

    private async validatePerformance(): Promise<void> {
        console.log('⚡ Validating Performance...');

        // Test response times
        const operations = [
            { name: 'Document Creation', operation: this.createTestDocument },
            { name: 'Document Retrieval', operation: this.retrieveTestDocument },
            { name: 'Document Search', operation: this.searchTestDocuments }
        ];

        for (const op of operations) {
            const startTime = Date.now();
            try {
                await op.operation.call(this);
                const executionTime = Date.now() - startTime;
                
                this.addResult({
                    category: 'Performance',
                    name: op.name,
                    status: executionTime < 1000 ? 'PASS' : (executionTime < 3000 ? 'WARNING' : 'FAIL'),
                    message: `Execution time: ${executionTime}ms`,
                    executionTime
                });
            } catch (error: any) {
                this.addResult({
                    category: 'Performance',
                    name: op.name,
                    status: 'FAIL',
                    message: `Operation failed: ${error.message}`,
                    executionTime: Date.now() - startTime
                });
            }
        }
    }

    private async validateErrorHandling(): Promise<void> {
        console.log('🚨 Validating Error Handling...');

        // Test various error scenarios
        const errorTests = [
            {
                name: 'Non-existent Document',
                test: () => mockServices.intelligentDocumentService.getDocument('non-existent-id'),
                expectedError: 'Document not found'
            },
            {
                name: 'Unauthorized Access',
                test: async () => {
                    const testFile = new File(['Test'], 'test.txt', { type: 'text/plain' });
                    const doc = await mockServices.intelligentDocumentService.createDocument(
                        'Test', 'Test', 'other', 'test_project', 'user1', testFile
                    );
                    await mockServices.intelligentDocumentService.updateDocument(
                        doc.id, { title: 'Updated' }, 'user2', 'Unauthorized'
                    );
                },
                expectedError: 'Unauthorized'
            }
        ];

        for (const errorTest of errorTests) {
            try {
                await errorTest.test();
                this.addResult({
                    category: 'Error Handling',
                    name: errorTest.name,
                    status: 'FAIL',
                    message: 'Expected error was not thrown'
                });
            } catch (error: any) {
                const isExpectedError = error.message.includes(errorTest.expectedError);
                this.addResult({
                    category: 'Error Handling',
                    name: errorTest.name,
                    status: isExpectedError ? 'PASS' : 'WARNING',
                    message: isExpectedError ? 'Error handled correctly' : `Unexpected error: ${error.message}`
                });
            }
        }
    }

    // Helper methods
    private async createTestDocument() {
        const testFile = new File(['Performance test'], 'perf.txt', { type: 'text/plain' });
        const doc = await mockServices.intelligentDocumentService.createDocument(
            'Performance Test',
            'Testing performance',
            'other',
            'validation_project',
            'validation_user',
            testFile
        );
        await mockServices.intelligentDocumentService.deleteDocument(doc.id, 'validation_user');
    }

    private async retrieveTestDocument() {
        const testFile = new File(['Retrieval test'], 'retrieve.txt', { type: 'text/plain' });
        const doc = await mockServices.intelligentDocumentService.createDocument(
            'Retrieval Test',
            'Testing retrieval',
            'other',
            'validation_project',
            'validation_user',
            testFile
        );
        await mockServices.intelligentDocumentService.getDocument(doc.id);
        await mockServices.intelligentDocumentService.deleteDocument(doc.id, 'validation_user');
    }

    private async searchTestDocuments() {
        await mockServices.intelligentDocumentService.searchDocuments('test', 'validation_project');
    }

    private checkServiceAvailability(servicePath: string): boolean {
        try {
            const pathParts = servicePath.split('.');
            let obj: any = mockServices;
            
            for (const part of pathParts) {
                if (obj && typeof obj === 'object' && part in obj) {
                    obj = obj[part];
                } else {
                    return false;
                }
            }
            
            return typeof obj === 'function';
        } catch {
            return false;
        }
    }

    private addResult(result: ValidationResult): void {
        this.results.push(result);
    }

    private generateReport(totalExecutionTime: number): ValidationReport {
        const summary = {
            totalTests: this.results.length,
            passed: this.results.filter(r => r.status === 'PASS').length,
            failed: this.results.filter(r => r.status === 'FAIL').length,
            warnings: this.results.filter(r => r.status === 'WARNING').length
        };

        const overallStatus = summary.failed > 0 ? 'FAIL' : (summary.warnings > 0 ? 'WARNING' : 'PASS');
        
        const avgResponseTime = this.results
            .filter(r => r.executionTime)
            .reduce((sum, r) => sum + (r.executionTime || 0), 0) / 
            this.results.filter(r => r.executionTime).length || 0;

        const systemHealth = summary.failed > 5 ? 'CRITICAL' : (summary.failed > 2 || summary.warnings > 5) ? 'DEGRADED' : 'HEALTHY';

        const recommendations = this.generateRecommendations(summary);

        return {
            overallStatus,
            timestamp: new Date(),
            summary,
            categories: this.results,
            recommendations,
            performanceMetrics: {
                totalExecutionTime,
                averageResponseTime: avgResponseTime,
                systemHealth
            }
        };
    }

    private generateRecommendations(summary: any): string[] {
        const recommendations: string[] = [];

        if (summary.failed > 0) {
            recommendations.push('🔴 Address failed validation tests immediately');
            recommendations.push('🔍 Review error logs and system diagnostics');
        }

        if (summary.warnings > 0) {
            recommendations.push('🟡 Investigate warning conditions for potential improvements');
        }

        if (summary.passed === summary.totalTests) {
            recommendations.push('✅ System validation successful - all tests passed');
        }

        recommendations.push('📊 Review performance metrics for optimization opportunities');
        recommendations.push('🔄 Schedule regular validation runs for continuous monitoring');

        return recommendations;
    }
}

// Main execution
async function runSystemValidation() {
    console.log('🚀 Intelligent Document System - Validation Suite');
    console.log('==================================================');
    
    const validator = new SystemValidator();
    const report = await validator.runValidation();
    
    // Display results
    console.log('\n📋 VALIDATION REPORT');
    console.log('====================');
    console.log(`Overall Status: ${report.overallStatus}`);
    console.log(`Timestamp: ${report.timestamp.toISOString()}`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`⏱️  Total Execution Time: ${report.performanceMetrics.totalExecutionTime}ms`);
    console.log(`📊 Average Response Time: ${report.performanceMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`🏥 System Health: ${report.performanceMetrics.systemHealth}`);

    console.log('\n📊 DETAILED RESULTS');
    console.log('===================');
    
    const categories = [...new Set(report.categories.map(r => r.category))];
    for (const category of categories) {
        console.log(`\n${category}:`);
        const categoryResults = report.categories.filter(r => r.category === category);
        for (const result of categoryResults) {
            const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
            const time = result.executionTime ? ` (${result.executionTime}ms)` : '';
            console.log(`  ${status} ${result.name}: ${result.message}${time}`);
        }
    }

    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    for (const recommendation of report.recommendations) {
        console.log(`  ${recommendation}`);
    }

    console.log('\n🎯 VALIDATION COMPLETE');
    console.log('======================');
    
    return report;
}

// Run the validation if this file is executed directly
if (require.main === module) {
    runSystemValidation()
        .then((report) => {
            process.exit(report.overallStatus === 'PASS' ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        });
}

module.exports = { SystemValidator, runSystemValidation };