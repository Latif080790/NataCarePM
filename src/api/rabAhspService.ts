import { db } from '@/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { 
  RabItem, 
  EnhancedRabItem, 
  AhspData, 
  CostBreakdown, 
  PriceHistory, 
  VarianceAnalysis, 
  SensitivityFactor, 
  RegionalPriceFactor,
  MarketFactor,
  PriceEscalation
} from '@/types';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { withRetry } from '@/utils/retryWrapper';
import { validators } from '@/utils/validators';
import { logger } from '@/utils/logger.enhanced';
import { EnhancedRabService } from './enhancedRabService';

/**
 * Validate RAB Item ID
 */
const validateRabItemId = (rabItemId: number, context: string): void => {
  if (!Number.isInteger(rabItemId) || rabItemId <= 0) {
    logger.warn(`Invalid RAB Item ID in ${context}`, { rabItemId });
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid RAB Item ID: "${rabItemId}". RAB Item ID must be a positive integer.`,
      400,
      {
        rabItemId,
        suggestion: 'Use a valid positive integer for RAB Item ID',
      }
    );
  }
};

/**
 * Validate AHSP ID
 */
const validateAhspId = (ahspId: string, context: string): void => {
  if (!validators.isValidId(ahspId)) {
    logger.warn(`Invalid AHSP ID in ${context}`, { ahspId });
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid AHSP ID: "${ahspId}". AHSP ID must be a non-empty string with alphanumeric characters and underscores only.`,
      400,
      {
        ahspId,
        suggestion: 'Use a valid format for AHSP ID',
      }
    );
  }
};

// RAB & AHSP Service
export class RabAhspService {
  private RAB_COLLECTION = 'rabItems';
  private AHSP_COLLECTION = 'ahspData';
  private PRICE_HISTORY_COLLECTION = 'priceHistory';
  private PRICE_ESCALATION_COLLECTION = 'priceEscalations';

  /**
   * Create a new RAB item
   */
  async createRabItem(
    projectId: string,
    rabItemData: Omit<RabItem, 'id'>
  ): Promise<APIResponse<RabItem>> {
    return await safeAsync(async () => {
      logger.info('Creating RAB item', { projectId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      // Validate required fields
      if (!validators.isNonEmptyString(rabItemData.uraian)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'RAB item description is required', 400);
      }

      if (!validators.isPositiveNumber(rabItemData.volume)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Volume must be a positive number', 400);
      }

      if (!validators.isPositiveNumber(rabItemData.hargaSatuan)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Unit price must be a positive number', 400);
      }

      if (!validators.isValidId(rabItemData.ahspId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'AHSP ID is required', 400);
      }

      // Generate RAB item ID
      const newRabItemId = await this.generateRabItemId(projectId);

      const newRabItem: RabItem = {
        id: newRabItemId,
        no: rabItemData.no,
        uraian: rabItemData.uraian,
        volume: rabItemData.volume,
        satuan: rabItemData.satuan,
        hargaSatuan: rabItemData.hargaSatuan,
        kategori: rabItemData.kategori,
        ahspId: rabItemData.ahspId,
        duration: rabItemData.duration,
        dependsOn: rabItemData.dependsOn,
        wbsElementId: rabItemData.wbsElementId,
      };

      // Save to Firestore
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, `projects/${projectId}/${this.RAB_COLLECTION}`), {
            ...newRabItem,
          }),
        { maxAttempts: 3 }
      );

      logger.info('RAB item created successfully', {
        rabItemId: newRabItemId,
        projectId,
      });

      return newRabItem;
    }, 'rabAhspService.createRabItem');
  }

  /**
   * Get RAB item by ID
   */
  async getRabItemById(
    projectId: string,
    rabItemId: number
  ): Promise<APIResponse<RabItem>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'getRabItemById');
      logger.info('Fetching RAB item', { projectId, rabItemId });

      const docRef = doc(db, `projects/${projectId}/${this.RAB_COLLECTION}`, rabItemId.toString());
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });

      if (!docSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RAB item not found', 404, { rabItemId });
      }

      const rabItem = { id: rabItemId, ...docSnap.data() } as RabItem;

      logger.info('RAB item fetched successfully', { projectId, rabItemId });
      return rabItem;
    }, 'rabAhspService.getRabItemById');
  }

  /**
   * Get all RAB items for a project
   */
  async getRabItemsByProject(
    projectId: string
  ): Promise<APIResponse<RabItem[]>> {
    return await safeAsync(async () => {
      logger.info('Fetching RAB items for project', { projectId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      const q = query(
        collection(db, `projects/${projectId}/${this.RAB_COLLECTION}`),
        orderBy('no', 'asc')
      );

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      const rabItems = snapshot.docs.map((doc) => ({ id: parseInt(doc.id), ...doc.data() } as RabItem));

      logger.info('RAB items fetched successfully', {
        projectId,
        count: rabItems.length,
      });

      return rabItems;
    }, 'rabAhspService.getRabItemsByProject');
  }

  /**
   * Update RAB item
   */
  async updateRabItem(
    projectId: string,
    rabItemId: number,
    updates: Partial<RabItem>
  ): Promise<APIResponse<RabItem>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'updateRabItem');
      logger.info('Updating RAB item', { projectId, rabItemId });

      const docRef = doc(db, `projects/${projectId}/${this.RAB_COLLECTION}`, rabItemId.toString());
      
      await withRetry(() => updateDoc(docRef, updates), { maxAttempts: 3 });

      // Fetch updated RAB item
      const updatedRabItem = await this.getRabItemById(projectId, rabItemId);

      logger.info('RAB item updated successfully', { projectId, rabItemId });
      return updatedRabItem.data!;
    }, 'rabAhspService.updateRabItem');
  }

  /**
   * Delete RAB item
   */
  async deleteRabItem(
    projectId: string,
    rabItemId: number
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'deleteRabItem');
      logger.info('Deleting RAB item', { projectId, rabItemId });

      const docRef = doc(db, `projects/${projectId}/${this.RAB_COLLECTION}`, rabItemId.toString());
      await withRetry(() => deleteDoc(docRef), { maxAttempts: 3 });

      logger.info('RAB item deleted successfully', { projectId, rabItemId });
    }, 'rabAhspService.deleteRabItem');
  }

  /**
   * Get AHSP data by ID
   */
  async getAhspData(ahspId: string): Promise<APIResponse<AhspData>> {
    return await safeAsync(async () => {
      validateAhspId(ahspId, 'getAhspData');
      logger.info('Fetching AHSP data', { ahspId });

      const docRef = doc(db, this.AHSP_COLLECTION, ahspId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });

      if (!docSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'AHSP data not found', 404, { ahspId });
      }

      const ahspData = { id: docSnap.id, ...docSnap.data() } as any as AhspData;

      logger.info('AHSP data fetched successfully', { ahspId });
      return ahspData;
    }, 'rabAhspService.getAhspData');
  }

  /**
   * Get all AHSP data
   */
  async getAllAhspData(): Promise<APIResponse<AhspData[]>> {
    return await safeAsync(async () => {
      logger.info('Fetching all AHSP data');

      const q = query(
        collection(db, this.AHSP_COLLECTION),
        orderBy('category', 'asc')
      );

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      const ahspDataList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any as AhspData));

      logger.info('All AHSP data fetched successfully', {
        count: ahspDataList.length,
      });

      return ahspDataList;
    }, 'rabAhspService.getAllAhspData');
  }

  /**
   * Create or update AHSP data
   */
  async upsertAhspData(
    ahspId: string,
    ahspData: Omit<AhspData, 'id'>
  ): Promise<APIResponse<AhspData>> {
    return await safeAsync(async () => {
      validateAhspId(ahspId, 'upsertAhspData');
      logger.info('Upserting AHSP data', { ahspId });

      const docRef = doc(db, this.AHSP_COLLECTION, ahspId);
      
      await withRetry(() => updateDoc(docRef, ahspData), { maxAttempts: 3 });

      // Fetch updated AHSP data
      const updatedAhspData = await this.getAhspData(ahspId);

      logger.info('AHSP data upserted successfully', { ahspId });
      return updatedAhspData.data!;
    }, 'rabAhspService.upsertAhspData');
  }

  /**
   * Calculate enhanced RAB item with detailed cost analysis
   */
  async calculateEnhancedRabItem(
    projectId: string,
    rabItemId: number
  ): Promise<APIResponse<EnhancedRabItem>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'calculateEnhancedRabItem');
      logger.info('Calculating enhanced RAB item', { projectId, rabItemId });

      // Get base RAB item
      const rabItemResult = await this.getRabItemById(projectId, rabItemId);
      if (!rabItemResult.success || !rabItemResult.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RAB item not found', 404, { rabItemId });
      }

      const rabItem = rabItemResult.data;

      // Get AHSP data for this item
      const ahspResult = await this.getAhspData(rabItem.ahspId);
      if (!ahspResult.success || !ahspResult.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'AHSP data not found', 404, { ahspId: rabItem.ahspId });
      }

      // Calculate cost breakdown using existing service
      const costBreakdown = EnhancedRabService.calculateCostBreakdown(
        rabItem.hargaSatuan,
        35, // labor percentage
        45, // material percentage
        15, // equipment percentage
        3,  // overhead percentage
        2   // profit percentage
      );

      // Get price history for this item
      const priceHistory = await this.getPriceHistory(projectId, rabItemId);

      // Create enhanced RAB item
      const enhancedRabItem: EnhancedRabItem = {
        ...rabItem,
        costBreakdown,
        priceHistory: priceHistory.data || [],
        escalationRate: 0, // Default to 0, can be updated later
        budgetVariance: {
          budgetedCost: 0,
          actualCost: 0,
          costVariance: 0,
          costVariancePercentage: 0,
          timeVariance: 0,
          timeVariancePercentage: 0,
          performanceIndex: 1,
          trend: 'stable',
          riskLevel: 'low',
        },
        sensitivityFactors: [],
        regionalFactors: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system',
        dataSource: 'calculated',
      };

      logger.info('Enhanced RAB item calculated successfully', { projectId, rabItemId });
      return enhancedRabItem;
    }, 'rabAhspService.calculateEnhancedRabItem');
  }

  /**
   * Get price history for a RAB item
   */
  async getPriceHistory(
    projectId: string,
    rabItemId: number
  ): Promise<APIResponse<PriceHistory[]>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'getPriceHistory');
      logger.info('Fetching price history', { projectId, rabItemId });

      const q = query(
        collection(db, `projects/${projectId}/${this.PRICE_HISTORY_COLLECTION}`),
        where('rabItemId', '==', rabItemId),
        orderBy('date', 'desc')
      );

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      const priceHistory = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PriceHistory));

      logger.info('Price history fetched successfully', { projectId, rabItemId });
      return priceHistory;
    }, 'rabAhspService.getPriceHistory');
  }

  /**
   * Add price history entry
   */
  async addPriceHistory(
    projectId: string,
    rabItemId: number,
    priceHistory: Omit<PriceHistory, 'id'>
  ): Promise<APIResponse<PriceHistory>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'addPriceHistory');
      logger.info('Adding price history entry', { projectId, rabItemId });

      const newPriceHistory: PriceHistory = {
        id: this.generateId(),
        ...priceHistory,
      };

      // Save to Firestore
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, `projects/${projectId}/${this.PRICE_HISTORY_COLLECTION}`), {
            ...newPriceHistory,
            rabItemId,
          }),
        { maxAttempts: 3 }
      );

      logger.info('Price history entry added successfully', { projectId, rabItemId });
      return newPriceHistory;
    }, 'rabAhspService.addPriceHistory');
  }

  /**
   * Calculate price escalation
   */
  async calculatePriceEscalation(
    projectId: string,
    rabItemId: number,
    escalationData: Omit<PriceEscalation, 'id' | 'rabItemId' | 'lastCalculated'>
  ): Promise<APIResponse<PriceEscalation>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'calculatePriceEscalation');
      logger.info('Calculating price escalation', { projectId, rabItemId });

      // Get base RAB item
      const rabItemResult = await this.getRabItemById(projectId, rabItemId);
      if (!rabItemResult.success || !rabItemResult.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RAB item not found', 404, { rabItemId });
      }

      const rabItem = rabItemResult.data;
      const basePrice = rabItem.hargaSatuan;

      // Calculate projected price using existing service
      const projectedPrice = EnhancedRabService.calculatePriceEscalation(
        basePrice,
        escalationData.escalationRate,
        12, // 12 months by default
        escalationData.marketFactors
      );

      const priceEscalation: PriceEscalation = {
        id: this.generateId(),
        rabItemId,
        escalationType: escalationData.escalationType,
        basePrice,
        currentPrice: basePrice,
        escalationRate: escalationData.escalationRate,
        projectedPrice,
        effectiveDate: escalationData.effectiveDate,
        projectionDate: escalationData.projectionDate,
        marketFactors: escalationData.marketFactors,
        escalationTriggers: escalationData.escalationTriggers,
        isActive: escalationData.isActive,
        lastCalculated: new Date().toISOString(),
      };

      // Save to Firestore
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, `projects/${projectId}/${this.PRICE_ESCALATION_COLLECTION}`), {
            ...priceEscalation,
          }),
        { maxAttempts: 3 }
      );

      logger.info('Price escalation calculated and saved successfully', { projectId, rabItemId });
      return priceEscalation;
    }, 'rabAhspService.calculatePriceEscalation');
  }

  /**
   * Get price escalations for a RAB item
   */
  async getPriceEscalations(
    projectId: string,
    rabItemId: number
  ): Promise<APIResponse<PriceEscalation[]>> {
    return await safeAsync(async () => {
      validateRabItemId(rabItemId, 'getPriceEscalations');
      logger.info('Fetching price escalations', { projectId, rabItemId });

      const q = query(
        collection(db, `projects/${projectId}/${this.PRICE_ESCALATION_COLLECTION}`),
        where('rabItemId', '==', rabItemId),
        orderBy('effectiveDate', 'desc')
      );

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      const priceEscalations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PriceEscalation));

      logger.info('Price escalations fetched successfully', { projectId, rabItemId });
      return priceEscalations;
    }, 'rabAhspService.getPriceEscalations');
  }

  /**
   * Calculate total project cost from RAB items
   */
  async calculateProjectTotal(
    projectId: string
  ): Promise<APIResponse<number>> {
    return await safeAsync(async () => {
      logger.info('Calculating project total cost', { projectId });

      const rabItemsResult = await this.getRabItemsByProject(projectId);
      if (!rabItemsResult.success || !rabItemsResult.data) {
        throw new APIError(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch RAB items', 500);
      }

      const totalCost = rabItemsResult.data.reduce(
        (sum, item) => sum + (item.hargaSatuan * item.volume),
        0
      );

      logger.info('Project total cost calculated successfully', { projectId, totalCost });
      return totalCost;
    }, 'rabAhspService.calculateProjectTotal');
  }

  /**
   * Generate RAB item ID
   */
  private async generateRabItemId(projectId: string): Promise<number> {
    // In a real implementation, you would query the database to find the next available number
    // For this example, we'll generate a simple number
    const timestamp = Date.now();
    return parseInt(timestamp.toString().slice(-8));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `rab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const rabAhspService = new RabAhspService();