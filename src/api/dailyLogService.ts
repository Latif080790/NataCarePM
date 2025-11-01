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
  DailyLog, 
  DailyLogEntry, 
  WeatherLog, 
  PersonnelLog, 
  EquipmentLog, 
  MaterialLog,
  ConstructionAttachment,
  ConstructionFilterOptions
} from '@/types/construction.types';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { withRetry } from '@/utils/retryWrapper';
import { validators } from '@/utils/validators';
import { logger } from '@/utils/logger.enhanced';

/**
 * Validate Daily Log ID
 */
const validateDailyLogId = (dailyLogId: string, context: string): void => {
  if (!validators.isValidId(dailyLogId)) {
    logger.warn(`Invalid Daily Log ID in ${context}`, { dailyLogId });
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid Daily Log ID: "${dailyLogId}". Daily Log ID must be a non-empty string with alphanumeric characters and underscores only.`,
      400,
      {
        dailyLogId,
        suggestion: 'Use a valid format like "dl_123" or generate a new ID with generateId()',
      }
    );
  }
};

// Daily Log Service
export class DailyLogService {
  private COLLECTION = 'dailyLogs';

  /**
   * Create a new Daily Log
   */
  async createDailyLog(
    projectId: string,
    dailyLogData: Omit<DailyLog, 'id' | 'logNumber' | 'entries' | 'weatherLogs' | 'personnelLogs' | 'equipmentLogs' | 'materialLogs' | 'createdAt' | 'lastUpdated'>
  ): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      logger.info('Creating Daily Log', { projectId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      // Validate required fields
      if (!validators.isNonEmptyString(dailyLogData.generalContractor)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'General contractor is required', 400);
      }

      if (!validators.isNonEmptyString(dailyLogData.projectManager)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Project manager is required', 400);
      }

      // Generate Daily Log number
      const logNumber = await this.generateDailyLogNumber(projectId);

      const newDailyLog: DailyLog = {
        id: this.generateId(),
        projectId,
        logNumber,
        date: dailyLogData.date,
        generalContractor: dailyLogData.generalContractor,
        projectManager: dailyLogData.projectManager,
        weatherConditions: dailyLogData.weatherConditions,
        entries: [],
        weatherLogs: [],
        personnelLogs: [],
        equipmentLogs: [],
        materialLogs: [],
        workPerformed: dailyLogData.workPerformed || '',
        workPlanned: dailyLogData.workPlanned || '',
        issues: dailyLogData.issues || '',
        safetyNotes: dailyLogData.safetyNotes || '',
        createdBy: dailyLogData.createdBy,
        createdByName: dailyLogData.createdByName,
        createdAt: new Date(),
        lastUpdated: new Date(),
        status: 'draft',
      };

      // Save to Firestore
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, this.COLLECTION), {
            ...newDailyLog,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      // Update with generated ID
      const createdDailyLog = { ...newDailyLog, id: docRef.id };
      await updateDoc(docRef, { id: docRef.id });

      logger.info('Daily Log created successfully', {
        dailyLogId: docRef.id,
        logNumber,
        projectId,
      });

      return createdDailyLog;
    }, 'dailyLogService.createDailyLog');
  }

  /**
   * Get Daily Log by ID
   */
  async getDailyLogById(dailyLogId: string): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'getDailyLogById');
      logger.info('Fetching Daily Log', { dailyLogId });

      const docRef = doc(db, this.COLLECTION, dailyLogId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });

      if (!docSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      const dailyLog = { id: docSnap.id, ...docSnap.data() } as DailyLog;

      logger.info('Daily Log fetched successfully', { dailyLogId });
      return dailyLog;
    }, 'dailyLogService.getDailyLogById');
  }

  /**
   * Get all Daily Logs for a project
   */
  async getDailyLogsByProject(
    projectId: string,
    filters?: ConstructionFilterOptions
  ): Promise<APIResponse<DailyLog[]>> {
    return await safeAsync(async () => {
      logger.info('Fetching Daily Logs for project', { projectId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      let q = query(
        collection(db, this.COLLECTION),
        where('projectId', '==', projectId),
        orderBy('date', 'desc')
      );

      // Apply filters
      if (filters?.dateRange) {
        q = query(
          q,
          where('date', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('date', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }

      if (filters?.searchTerm) {
        // Note: Firestore doesn't support full-text search, this is a simplified implementation
        logger.warn('Full-text search not implemented in this example');
      }

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      const dailyLogs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DailyLog));

      logger.info('Daily Logs fetched successfully', {
        projectId,
        count: dailyLogs.length,
      });

      return dailyLogs;
    }, 'dailyLogService.getDailyLogsByProject');
  }

  /**
   * Update Daily Log
   */
  async updateDailyLog(
    dailyLogId: string,
    updates: Partial<DailyLog>,
    updatedBy: string
  ): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'updateDailyLog');
      logger.info('Updating Daily Log', { dailyLogId });

      const docRef = doc(db, this.COLLECTION, dailyLogId);
      const updateData = {
        ...updates,
        lastUpdated: serverTimestamp(),
        updatedBy,
      };

      await withRetry(() => updateDoc(docRef, updateData), { maxAttempts: 3 });

      // Fetch updated Daily Log
      const updatedDailyLog = await this.getDailyLogById(dailyLogId);

      logger.info('Daily Log updated successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.updateDailyLog');
  }

  /**
   * Submit Daily Log
   */
  async submitDailyLog(dailyLogId: string, submittedBy: string): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'submitDailyLog');
      logger.info('Submitting Daily Log', { dailyLogId });

      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      if (dailyLog.data.status !== 'draft') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Only draft Daily Logs can be submitted',
          400,
          { currentStatus: dailyLog.data.status }
        );
      }

      const updatedDailyLog = await this.updateDailyLog(
        dailyLogId,
        {
          status: 'submitted',
        },
        submittedBy
      );

      logger.info('Daily Log submitted successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.submitDailyLog');
  }

  /**
   * Approve Daily Log
   */
  async approveDailyLog(dailyLogId: string, approvedBy: string, approvedByName: string): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'approveDailyLog');
      logger.info('Approving Daily Log', { dailyLogId });

      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      if (dailyLog.data.status !== 'submitted') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Only submitted Daily Logs can be approved',
          400,
          { currentStatus: dailyLog.data.status }
        );
      }

      const updatedDailyLog = await this.updateDailyLog(
        dailyLogId,
        {
          status: 'approved',
          approvedBy,
          approvedDate: new Date(),
        },
        approvedBy
      );

      logger.info('Daily Log approved successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.approveDailyLog');
  }

  /**
   * Add entry to Daily Log
   */
  async addDailyLogEntry(
    dailyLogId: string,
    entry: Omit<DailyLogEntry, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>,
    createdBy: string,
    createdByName: string
  ): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'addDailyLogEntry');
      logger.info('Adding entry to Daily Log', { dailyLogId });

      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      const newEntry: DailyLogEntry = {
        id: this.generateId(),
        ...entry,
        createdBy,
        createdByName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedEntries = [...dailyLog.data.entries, newEntry];

      const updatedDailyLog = await this.updateDailyLog(
        dailyLogId,
        {
          entries: updatedEntries,
        },
        createdBy
      );

      logger.info('Entry added successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.addDailyLogEntry');
  }

  /**
   * Add weather log to Daily Log
   */
  async addWeatherLog(
    dailyLogId: string,
    weatherLog: Omit<WeatherLog, 'id'>
  ): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'addWeatherLog');
      logger.info('Adding weather log to Daily Log', { dailyLogId });

      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      const newWeatherLog: WeatherLog = {
        id: this.generateId(),
        ...weatherLog,
      };

      const updatedWeatherLogs = [...dailyLog.data.weatherLogs, newWeatherLog];

      const updatedDailyLog = await this.updateDailyLog(
        dailyLogId,
        {
          weatherLogs: updatedWeatherLogs,
        },
        dailyLog.data.createdBy
      );

      logger.info('Weather log added successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.addWeatherLog');
  }

  /**
   * Add personnel log to Daily Log
   */
  async addPersonnelLog(
    dailyLogId: string,
    personnelLog: Omit<PersonnelLog, 'id'>
  ): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'addPersonnelLog');
      logger.info('Adding personnel log to Daily Log', { dailyLogId });

      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      const newPersonnelLog: PersonnelLog = {
        id: this.generateId(),
        ...personnelLog,
      };

      const updatedPersonnelLogs = [...dailyLog.data.personnelLogs, newPersonnelLog];

      const updatedDailyLog = await this.updateDailyLog(
        dailyLogId,
        {
          personnelLogs: updatedPersonnelLogs,
        },
        dailyLog.data.createdBy
      );

      logger.info('Personnel log added successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.addPersonnelLog');
  }

  /**
   * Add equipment log to Daily Log
   */
  async addEquipmentLog(
    dailyLogId: string,
    equipmentLog: Omit<EquipmentLog, 'id'>
  ): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'addEquipmentLog');
      logger.info('Adding equipment log to Daily Log', { dailyLogId });

      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      const newEquipmentLog: EquipmentLog = {
        id: this.generateId(),
        ...equipmentLog,
      };

      const updatedEquipmentLogs = [...dailyLog.data.equipmentLogs, newEquipmentLog];

      const updatedDailyLog = await this.updateDailyLog(
        dailyLogId,
        {
          equipmentLogs: updatedEquipmentLogs,
        },
        dailyLog.data.createdBy
      );

      logger.info('Equipment log added successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.addEquipmentLog');
  }

  /**
   * Add material log to Daily Log
   */
  async addMaterialLog(
    dailyLogId: string,
    materialLog: Omit<MaterialLog, 'id'>
  ): Promise<APIResponse<DailyLog>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'addMaterialLog');
      logger.info('Adding material log to Daily Log', { dailyLogId });

      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      const newMaterialLog: MaterialLog = {
        id: this.generateId(),
        ...materialLog,
      };

      const updatedMaterialLogs = [...dailyLog.data.materialLogs, newMaterialLog];

      const updatedDailyLog = await this.updateDailyLog(
        dailyLogId,
        {
          materialLogs: updatedMaterialLogs,
        },
        dailyLog.data.createdBy
      );

      logger.info('Material log added successfully', { dailyLogId });
      return updatedDailyLog.data!;
    }, 'dailyLogService.addMaterialLog');
  }

  /**
   * Delete Daily Log
   */
  async deleteDailyLog(dailyLogId: string, deletedBy: string): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateDailyLogId(dailyLogId, 'deleteDailyLog');
      logger.info('Deleting Daily Log', { dailyLogId });

      // Check if Daily Log can be deleted (only draft Daily Logs)
      const dailyLog = await this.getDailyLogById(dailyLogId);
      if (!dailyLog.success || !dailyLog.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Daily Log not found', 404, { dailyLogId });
      }

      if (dailyLog.data.status !== 'draft') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Only draft Daily Logs can be deleted',
          400,
          { currentStatus: dailyLog.data.status }
        );
      }

      const docRef = doc(db, this.COLLECTION, dailyLogId);
      await withRetry(() => deleteDoc(docRef), { maxAttempts: 3 });

      logger.info('Daily Log deleted successfully', { dailyLogId, deletedBy });
    }, 'dailyLogService.deleteDailyLog');
  }

  /**
   * Generate Daily Log number
   */
  private async generateDailyLogNumber(projectId: string): Promise<string> {
    // In a real implementation, you would query the database to find the next available number
    // For this example, we'll generate a simple number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `DL-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}-${random.toString().padStart(3, '0')}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const dailyLogService = new DailyLogService();