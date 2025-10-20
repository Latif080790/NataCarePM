/**
 * ML Model Persistence Utility
 * NataCarePM - Phase 4: AI & Analytics
 * 
 * Save and load TensorFlow.js models to/from IndexedDB
 * for persistent storage across browser sessions
 */

import * as tf from '@tensorflow/tfjs';

// ============================================================================
// Constants
// ============================================================================

const ML_MODELS_DB_NAME = 'NataCarePM_ML_Models';
const ML_MODELS_DB_VERSION = 1;
const MODELS_STORE = 'models';
const METADATA_STORE = 'metadata';

// ============================================================================
// Types
// ============================================================================

export interface ModelMetadata {
  modelId: string;
  modelType: string;
  version: string;
  trainedAt: Date;
  accuracy?: number;
  modelPath: string;
  config: Record<string, any>;
}

// ============================================================================
// IndexedDB Initialization
// ============================================================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ML_MODELS_DB_NAME, ML_MODELS_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(MODELS_STORE)) {
        db.createObjectStore(MODELS_STORE, { keyPath: 'modelId' });
      }

      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'modelId' });
      }
    };
  });
}

// ============================================================================
// Model Persistence Functions
// ============================================================================

/**
 * Save TensorFlow.js Model to IndexedDB
 */
export async function saveModelToIndexedDB(
  modelId: string,
  model: tf.LayersModel,
  metadata: Omit<ModelMetadata, 'modelPath'>
): Promise<void> {
  try {
    // Save model using TensorFlow.js IndexedDB IO handler
    const modelPath = `indexeddb://${modelId}`;
    await model.save(modelPath);

    // Save metadata
    const db = await openDB();
    const transaction = db.transaction([METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);

    const metadataWithPath: ModelMetadata = {
      ...metadata,
      modelPath,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(metadataWithPath);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    console.log(`Model ${modelId} saved to IndexedDB successfully`);
  } catch (error) {
    console.error('Error saving model to IndexedDB:', error);
    throw error;
  }
}

/**
 * Load TensorFlow.js Model from IndexedDB
 */
export async function loadModelFromIndexedDB(modelId: string): Promise<{
  model: tf.LayersModel;
  metadata: ModelMetadata;
} | null> {
  try {
    // Load metadata
    const db = await openDB();
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);

    const metadata = await new Promise<ModelMetadata | null>((resolve, reject) => {
      const request = store.get(modelId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (!metadata) {
      console.log(`Model ${modelId} not found in IndexedDB`);
      return null;
    }

    // Load model using TensorFlow.js
    const model = await tf.loadLayersModel(metadata.modelPath);

    console.log(`Model ${modelId} loaded from IndexedDB successfully`);

    return { model, metadata };
  } catch (error) {
    console.error('Error loading model from IndexedDB:', error);
    return null;
  }
}

/**
 * Delete Model from IndexedDB
 */
export async function deleteModelFromIndexedDB(modelId: string): Promise<void> {
  try {
    // Delete metadata
    const db = await openDB();
    const transaction = db.transaction([METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(modelId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    // Delete model data (TensorFlow.js handles this)
    const modelPath = `indexeddb://${modelId}`;
    await tf.io.removeModel(modelPath);

    console.log(`Model ${modelId} deleted from IndexedDB successfully`);
  } catch (error) {
    console.error('Error deleting model from IndexedDB:', error);
    throw error;
  }
}

/**
 * List All Saved Models
 */
export async function listSavedModels(): Promise<ModelMetadata[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);

    const models = await new Promise<ModelMetadata[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();

    return models;
  } catch (error) {
    console.error('Error listing saved models:', error);
    return [];
  }
}

/**
 * Check if Model Exists
 */
export async function modelExists(modelId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);

    const exists = await new Promise<boolean>((resolve, reject) => {
      const request = store.get(modelId);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    return exists;
  } catch (error) {
    console.error('Error checking model existence:', error);
    return false;
  }
}

/**
 * Update Model Metadata
 */
export async function updateModelMetadata(
  modelId: string,
  updates: Partial<Omit<ModelMetadata, 'modelId' | 'modelPath'>>
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);

    // Get existing metadata
    const existingMetadata = await new Promise<ModelMetadata | null>((resolve, reject) => {
      const request = store.get(modelId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (!existingMetadata) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Update metadata
    const updatedMetadata = {
      ...existingMetadata,
      ...updates,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(updatedMetadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    console.log(`Model ${modelId} metadata updated successfully`);
  } catch (error) {
    console.error('Error updating model metadata:', error);
    throw error;
  }
}

/**
 * Clear All Models
 */
export async function clearAllModels(): Promise<void> {
  try {
    const models = await listSavedModels();

    for (const model of models) {
      await deleteModelFromIndexedDB(model.modelId);
    }

    console.log('All models cleared from IndexedDB');
  } catch (error) {
    console.error('Error clearing all models:', error);
    throw error;
  }
}

/**
 * Get Storage Usage
 */
export async function getStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentUsed };
    }

    return { usage: 0, quota: 0, percentUsed: 0 };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { usage: 0, quota: 0, percentUsed: 0 };
  }
}
