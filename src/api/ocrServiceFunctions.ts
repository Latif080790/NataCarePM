/**
 * OCR Service (Firebase Functions Implementation)
 * Handles OCR operations through Firebase Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { APIResponse } from '@/utils/responseWrapper';

// ========================================
// TYPES
// ========================================

export interface OCRProcessRequest {
  imageData: string;
  mimeType: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
  fieldType: string;
}

export interface ExtractedData {
  projectName?: string;
  contractNumber?: string;
  dates?: any[];
  amounts?: any[];
  materials?: any[];
  personnel?: any[];
  coordinates?: any[];
  specifications?: any[];
  signatures?: any[];
  tables?: any[];
}

export interface OCRResult {
  id: string;
  documentId: string;
  extractedText: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  extractedData: ExtractedData;
  processingTime: number;
  timestamp: Date;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

// ========================================
// OCR SERVICE
// ========================================

/**
 * Process document using OCR through Firebase Function
 */
export const processDocument = async (
  request: OCRProcessRequest
): Promise<APIResponse<OCRResult>> => {
  try {
    // Get Firebase Functions instance
    const functions = getFunctions();
    const processOCRFunction = httpsCallable(functions, 'processOCR');
    
    // Call Firebase Function
    const result = await processOCRFunction({
      imageData: request.imageData,
      mimeType: request.mimeType
    });
    
    return result.data as APIResponse<OCRResult>;
  } catch (error: any) {
    console.error('Error processing document with OCR:', error);
    
    // Handle Firebase Function errors
    if (error.code === 'functions/invalid-argument') {
      return {
        success: false,
        error: {
          code: 'INVALID_ARGUMENT',
          message: error.message || 'Invalid request',
        },
      };
    }
    
    if (error.code === 'functions/permission-denied') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Permission denied',
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'OCR_PROCESSING_ERROR',
        message: 'Failed to process document with OCR',
        details: error,
      },
    };
  }
};

/**
 * Convert file to base64 string for OCR processing
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default {
  processDocument,
  fileToBase64,
};