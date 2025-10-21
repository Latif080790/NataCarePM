/**
 * Currency Service
 *
 * Manages multi-currency support
 * Supports:
 * - Currency management
 * - Exchange rate tracking
 * - Currency conversion
 * - Forex gain/loss calculation
 * - External API integration for rates
 *
 * @module api/currencyService
 */

import { db } from '@/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import type { Currency, ExchangeRate, ForexGainLoss } from '@/types/accounting';

import { withRetry } from '@/utils/retryWrapper';
import { APIError, ErrorCodes } from '@/utils/responseWrapper';
import { createScopedLogger } from '@/utils/logger';
import { validators } from '@/utils/validators';

const logger = createScopedLogger('currencyService');

const COLLECTIONS = {
  CURRENCIES: 'currencies',
  EXCHANGE_RATES: 'exchange_rates',
  FOREX_GAINS_LOSSES: 'forex_gains_losses',
} as const;

/**
 * Currency Service
 */
export class CurrencyService {
  private baseCurrency: string = 'IDR';
  private rateCache: Map<string, { rate: number; timestamp: Date }> = new Map();
  private cacheTTL: number = 3600000; // 1 hour in milliseconds

  /**
   * Set base currency for conversions
   */
  setBaseCurrency(currency: string): void {
    this.baseCurrency = currency;
    logger.info('setBaseCurrency', `Base currency set to ${currency}`);
  }

  /**
   * Get base currency
   */
  getBaseCurrency(): string {
    return this.baseCurrency;
  }

  /**
   * Create or update currency
   *
   * @param currencyData - Currency data
   * @param userId - User creating/updating the currency
   * @returns Created/updated currency
   *
   * @example
   * ```typescript
   * const usd = await service.saveCurrency({
   *   code: 'USD',
   *   name: 'US Dollar',
   *   symbol: '$',
   *   isActive: true,
   *   decimalPlaces: 2
   * }, 'user_123');
   * ```
   */
  async saveCurrency(
    currencyData: Omit<Currency, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    userId: string
  ): Promise<Currency> {
    try {
      // Validation
      if (!validators.isValidString(currencyData.code, 3, 3).valid) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          'Currency code must be exactly 3 characters',
          400
        );
      }

      const currencyId = `curr_${currencyData.code.toUpperCase()}`;
      const now = new Date();

      // Check if currency exists
      const existingCurrency = await this.getCurrency(currencyData.code);

      if (existingCurrency) {
        // Update existing
        const docRef = doc(db, COLLECTIONS.CURRENCIES, currencyId);
        await updateDoc(docRef, {
          ...currencyData,
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });

        logger.success('saveCurrency', 'Currency updated', { code: currencyData.code });
      } else {
        // Create new
        const currency: Currency = {
          ...currencyData,
          code: currencyData.code.toUpperCase(),
        };

        const docRef = doc(db, COLLECTIONS.CURRENCIES, currencyId);
        await withRetry(
          () =>
            setDoc(docRef, {
              ...currency,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          { maxAttempts: 3 }
        );

        logger.success('saveCurrency', 'Currency created', { code: currency.code });
      }

      return this.getCurrency(currencyData.code) as Promise<Currency>;
    } catch (error) {
      logger.error('saveCurrency', 'Failed to save currency', error as Error);
      throw error;
    }
  }

  /**
   * Get currency by code
   */
  async getCurrency(code: string): Promise<Currency | null> {
    try {
      const currencyId = `curr_${code.toUpperCase()}`;
      const docRef = doc(db, COLLECTIONS.CURRENCIES, currencyId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 2 });

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return data as Currency;
    } catch (error) {
      logger.error('getCurrency', 'Failed to get currency', error as Error, { code });
      return null;
    }
  }

  /**
   * Get all active currencies
   */
  async getAllActiveCurrencies(): Promise<Currency[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CURRENCIES),
        where('isActive', '==', true),
        orderBy('code', 'asc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => doc.data() as Currency);
    } catch (error) {
      logger.error('getAllActiveCurrencies', 'Failed to get active currencies', error as Error);
      return [];
    }
  }

  /**
   * Save exchange rate
   *
   * @param rateData - Exchange rate data
   * @param userId - User saving the rate
   * @returns Saved exchange rate
   */
  async saveExchangeRate(
    rateData: Omit<ExchangeRate, 'id' | 'createdAt' | 'createdBy'>,
    userId: string
  ): Promise<ExchangeRate> {
    try {
      const rateId = `rate_${rateData.fromCurrency}_${rateData.toCurrency}_${Date.now()}`;
      const now = new Date();

      const rate: ExchangeRate = {
        ...rateData,
        id: rateId,
        createdAt: now,
        createdBy: userId,
      };

      const docRef = doc(db, COLLECTIONS.EXCHANGE_RATES, rateId);
      await withRetry(
        () =>
          setDoc(docRef, {
            ...rate,
            effectiveDate: Timestamp.fromDate(rate.effectiveDate),
            expiryDate: rate.expiryDate ? Timestamp.fromDate(rate.expiryDate) : null,
            createdAt: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      // Update cache
      const cacheKey = `${rateData.fromCurrency}_${rateData.toCurrency}`;
      this.rateCache.set(cacheKey, { rate: rateData.rate, timestamp: now });

      logger.success('saveExchangeRate', 'Exchange rate saved', {
        from: rateData.fromCurrency,
        to: rateData.toCurrency,
      });

      return rate;
    } catch (error) {
      logger.error('saveExchangeRate', 'Failed to save exchange rate', error as Error);
      throw error;
    }
  }

  /**
   * Get latest exchange rate
   *
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param date - Date for the rate (default: today)
   * @returns Exchange rate or null
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date = new Date()
  ): Promise<number | null> {
    try {
      // Same currency = 1.0
      if (fromCurrency === toCurrency) {
        return 1.0;
      }

      // Check cache
      const cacheKey = `${fromCurrency}_${toCurrency}`;
      const cached = this.rateCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTTL) {
        return cached.rate;
      }

      // Query Firestore
      const q = query(
        collection(db, COLLECTIONS.EXCHANGE_RATES),
        where('fromCurrency', '==', fromCurrency),
        where('toCurrency', '==', toCurrency),
        where('effectiveDate', '<=', Timestamp.fromDate(date)),
        orderBy('effectiveDate', 'desc')
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const rateDoc = snapshot.docs[0].data() as ExchangeRate;

        // Check if expired
        if (rateDoc.expiryDate && rateDoc.expiryDate < date) {
          logger.warn('getExchangeRate', 'Rate expired, fetching from API', {
            from: fromCurrency,
            to: toCurrency,
          });
          return this.fetchExchangeRateFromAPI(fromCurrency, toCurrency);
        }

        // Update cache
        this.rateCache.set(cacheKey, { rate: rateDoc.rate, timestamp: new Date() });

        return rateDoc.rate;
      }

      // Not found, try external API
      logger.info('getExchangeRate', 'No rate found, fetching from API', {
        from: fromCurrency,
        to: toCurrency,
      });
      return this.fetchExchangeRateFromAPI(fromCurrency, toCurrency);
    } catch (error) {
      logger.error('getExchangeRate', 'Failed to get exchange rate', error as Error);
      return null;
    }
  }

  /**
   * Fetch exchange rate from external API
   *
   * Uses exchangerate-api.io (free tier)
   */
  private async fetchExchangeRateFromAPI(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number | null> {
    try {
      // Free API: https://api.exchangerate-api.io/v4/latest/{fromCurrency}
      const apiUrl = `https://api.exchangerate-api.io/v4/latest/${fromCurrency}`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();

      if (data.rates && data.rates[toCurrency]) {
        const rate = data.rates[toCurrency];

        // Save to database for future use
        await this.saveExchangeRate(
          {
            fromCurrency,
            toCurrency,
            rate,
            effectiveDate: new Date(),
            source: 'api',
            sourceDetails: 'exchangerate-api.io',
            rateType: 'spot',
          },
          'system'
        );

        return rate;
      }

      logger.warn('fetchExchangeRateFromAPI', 'Rate not found in API response', {
        from: fromCurrency,
        to: toCurrency,
      });
      return null;
    } catch (error) {
      logger.error('fetchExchangeRateFromAPI', 'Failed to fetch from API', error as Error);
      return null;
    }
  }

  /**
   * Convert amount from one currency to another
   *
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param date - Date for the conversion (default: today)
   * @returns Converted amount or null
   *
   * @example
   * ```typescript
   * const amountInIDR = await service.convertCurrency(100, 'USD', 'IDR');
   * console.log(`100 USD = ${amountInIDR} IDR`);
   * ```
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date = new Date()
  ): Promise<number | null> {
    try {
      const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);

      if (rate === null) {
        throw new APIError(
          ErrorCodes.NOT_FOUND,
          `Exchange rate not found for ${fromCurrency} to ${toCurrency}`,
          404
        );
      }

      return amount * rate;
    } catch (error) {
      logger.error('convertCurrency', 'Failed to convert currency', error as Error);
      throw error;
    }
  }

  /**
     * Calculate forex gain/loss
     * 
     * @param originalAmount - Original amount in foreign currency
     * @param originalRate - Original exchange rate
     * @param currentRate - Current exchange rate
     * @param foreignCurrency - Foreign currency code
     * @returns Forex gain/loss record
     * 
     * @example
     * ```typescript
     * // Original invoice: 100 USD at rate 15,000 = 1,500,000 IDR
     * // Payment received: 100 USD at rate 15,500 = 1,550,000 IDR
     * // Forex gain = 50,000 IDR
     * const forexResult = service.calculateForexGainLoss(100, 15000, 15500, 'USD');
    calculateForexGainLoss(
        transactionId: string,
        transactionType: 'ap' | 'ar' | 'payment' | 'receipt',
        originalAmount: number,
        originalCurrency: string,
        originalRate: number,
        originalDate: Date,
        settlementAmount: number,
        settlementRate: number,
        settlementDate: Date
    ): ForexGainLoss {
        const originalBaseCurrencyAmount = originalAmount * originalRate;
        const settlementBaseCurrencyAmount = settlementAmount * settlementRate;
        const gainLossBaseCurrency = settlementBaseCurrencyAmount - originalBaseCurrencyAmount;
        
        return {
            id: `forex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transactionId,
            transactionType,
            originalAmount,
            originalCurrency,
            originalExchangeRate: originalRate,
            originalDate,
            settlementAmount,
            settlementCurrency: this.baseCurrency,
            settlementExchangeRate: settlementRate,
            settlementDate,
            gainLossAmount: settlementAmount - originalAmount,
            gainLossBaseCurrency,
            isRealized: true,
            calculatedAt: new Date()
        };
    }       description: `Forex ${gainLossAmount >= 0 ? 'gain' : 'loss'} on ${foreignCurrency} transaction`
        };
    }
    async saveForexGainLoss(
        forexData: Omit<ForexGainLoss, 'id' | 'calculatedAt'>,
        userId: string
    ): Promise<ForexGainLoss> {
        try {
            const forexId = `forex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            
            const forex: ForexGainLoss = {
                ...forexData,
                id: forexId,
                calculatedAt: now
            };
            
            const docRef = doc(db, COLLECTIONS.FOREX_GAINS_LOSSES, forexId);
            await withRetry(
                () => setDoc(docRef, {
                    ...forex,
                    originalDate: Timestamp.fromDate(forex.originalDate),
                    settlementDate: Timestamp.fromDate(forex.settlementDate),
                    calculatedAt: serverTimestamp()
                }),
                { maxAttempts: 3 }
            );
            
            logger.success('saveForexGainLoss', 'Forex gain/loss saved', { 
                isRealized: forex.isRealized,
                amount: forex.gainLossBaseCurrency
            });
            
            return forex;
            
        } catch (error) {
            logger.error('saveForexGainLoss', 'Failed to save forex gain/loss', error as Error);
            throw error;
        }
    }
    
    /**
     * Get forex gains/losses for a period
     * 
     * @param startDate - Period start date
     * @param endDate - Period end date
     * @returns Array of forex records
     */
  async getForexGainLossByPeriod(startDate: Date, endDate: Date): Promise<ForexGainLoss[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.FOREX_GAINS_LOSSES),
        where('calculatedAt', '>=', Timestamp.fromDate(startDate)),
        where('calculatedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('calculatedAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          originalDate: data.originalDate?.toDate?.() || new Date(),
          settlementDate: data.settlementDate?.toDate?.() || new Date(),
          calculatedAt: data.calculatedAt?.toDate?.() || new Date(),
        } as ForexGainLoss;
      });
    } catch (error) {
      logger.error('getForexGainLossByPeriod', 'Failed to get forex records', error as Error);
      return [];
    }
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.rateCache.clear();
    logger.info('clearCache', 'Exchange rate cache cleared');
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();
