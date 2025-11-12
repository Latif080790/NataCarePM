/**
 * Digital Signatures Service (Firebase Functions Implementation)
 * Handles digital signatures through Firebase Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { APIResponse } from '@/utils/responseWrapper';

// ========================================
// TYPES
// ========================================

export interface SignerInfo {
  userId: string;
  name: string;
  email: string;
  role?: string;
  organization?: string;
  location?: string;
  authMethod?: string;
}

export interface SignatureData {
  type: 'digital' | 'electronic' | 'biometric';
  data: string;
  algorithm: string;
  hashValue: string;
}

export interface SignatureCertificate {
  id: string;
  issuer: string;
  subject: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  algorithm: string;
  publicKey: string;
  certificateChain: string[];
  revocationStatus: 'valid' | 'revoked' | 'expired';
  trustLevel: 'high' | 'medium' | 'low';
}

export interface DigitalSignature {
  id: string;
  documentId: string;
  documentVersionId: string;
  signerInfo: SignerInfo;
  signatureData: SignatureData;
  certificate: SignatureCertificate;
  timestamp: Date;
  status: 'pending' | 'signed' | 'revoked';
  metadata?: any;
  verification?: any;
  legalCompliance?: any;
}

export interface CreateSignatureRequest {
  documentId: string;
  documentVersionId: string;
  signerInfo: SignerInfo;
  signatureType: 'digital' | 'electronic' | 'biometric';
}

export interface VerifySignatureRequest {
  signatureData: SignatureData;
  certificate: SignatureCertificate;
}

// ========================================
// DIGITAL SIGNATURES SERVICE
// ========================================

/**
 * Create digital signature using Firebase Function
 */
export const createSignature = async (
  request: CreateSignatureRequest
): Promise<APIResponse<DigitalSignature>> => {
  try {
    // Get Firebase Functions instance
    const functions = getFunctions();
    const createDigitalSignatureFunction = httpsCallable(functions, 'createDigitalSignature');
    
    // Call Firebase Function
    const result = await createDigitalSignatureFunction({
      documentId: request.documentId,
      documentVersionId: request.documentVersionId,
      signerInfo: request.signerInfo,
      signatureType: request.signatureType
    });
    
    return result.data as APIResponse<DigitalSignature>;
  } catch (error: any) {
    logger.error('Error creating digital signature', error as Error);
    
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
        code: 'DIGITAL_SIGNATURE_ERROR',
        message: 'Failed to create digital signature',
        details: error,
      },
    };
  }
};

/**
 * Verify digital signature using Firebase Function
 */
export const verifySignature = async (
  request: VerifySignatureRequest
): Promise<APIResponse<{ isValid: boolean }>> => {
  try {
    // Get Firebase Functions instance
    const functions = getFunctions();
    const verifyDigitalSignatureFunction = httpsCallable(functions, 'verifyDigitalSignature');
    
    // Call Firebase Function
    const result = await verifyDigitalSignatureFunction({
      signatureData: request.signatureData,
      certificate: request.certificate
    });
    
    return result.data as APIResponse<{ isValid: boolean }>;
  } catch (error: any) {
    logger.error('Error verifying digital signature', error as Error);
    
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
        code: 'DIGITAL_SIGNATURE_VERIFICATION_ERROR',
        message: 'Failed to verify digital signature',
        details: error,
      },
    };
  }
};

export default {
  createSignature,
  verifySignature,
};