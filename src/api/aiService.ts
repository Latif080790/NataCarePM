/**
 * AI Service
 * Handles AI operations through Firebase Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { APIResponse } from '@/utils/responseWrapper';
import { db } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// ========================================
// TYPES
// ========================================

export interface AIInsightRequest {
  projectId: string;
  geminiApiKey: string;
}

export interface AIInsightResult {
  summary: string;
  risks: string[];
  predictions: {
    completionDate: string;
    finalCost: number;
    riskLevel: string;
  };
  generatedAt: string;
}

export interface ResourceOptimizationRequest {
  projectIds: string[];
  optimizationGoal: string;
  constraints: any;
}

export interface ResourceOptimizationResult {
  resultId: string;
  recommendations: any[];
  schedulingPlan: any;
  performanceMetrics: any;
  computedAt: Date;
  computationTimeMs: number;
}

// ========================================
// AI SERVICE
// ========================================

/**
 * Generate AI insights using Firebase Function
 */
export const generateAIInsight = async (
  request: AIInsightRequest
): Promise<APIResponse<AIInsightResult>> => {
  try {
    // Get Firebase Functions instance
    const functions = getFunctions();
    const generateAiInsightFunction = httpsCallable(functions, 'generateAiInsight');
    
    // Call Firebase Function
    const result = await generateAiInsightFunction({
      projectId: request.projectId,
      geminiApiKey: request.geminiApiKey
    });
    
    return result.data as APIResponse<AIInsightResult>;
  } catch (error: any) {
    logger.error('Error generating AI insight', error as Error);
    
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
        code: 'AI_INSIGHT_ERROR',
        message: 'Failed to generate AI insight',
        details: error,
      },
    };
  }
};

/**
 * Optimize resource allocation using Firebase Function
 */
export const optimizeResources = async (
  request: ResourceOptimizationRequest
): Promise<APIResponse<ResourceOptimizationResult>> => {
  try {
    // Get Firebase Functions instance
    const functions = getFunctions();
    const optimizeResourcesFunction = httpsCallable(functions, 'optimizeResources');
    
    // Call Firebase Function
    const result = await optimizeResourcesFunction(request);
    
    return result.data as APIResponse<ResourceOptimizationResult>;
  } catch (error: any) {
    logger.error('Error optimizing resources', error as Error);
    
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
        code: 'RESOURCE_OPTIMIZATION_ERROR',
        message: 'Failed to optimize resources',
        details: error,
      },
    };
  }
};

/**
 * Get project context for AI processing
 */
export const getProjectContextForAI = async (projectId: string): Promise<any> => {
  try {
    // Fetch project data
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    
    // Prepare project context for AI
    const { name, location, startDate, items = [], expenses = [], dailyReports = [], inventory = [] } = projectData || {};
    
    const summary = {
      projectName: name,
      location,
      startDate,
      totalBudget: items.reduce((sum: number, i: any) => sum + (i.volume * i.hargaSatuan), 0),
      totalActualCost: expenses.reduce((sum: number, e: any) => sum + e.amount, 0),
      workItems: items.map((i: any) => ({ 
        uraian: i.uraian, 
        volume: i.volume, 
        satuan: i.satuan 
      })),
      recentReports: dailyReports.slice(0, 3).map((r: any) => ({ 
        date: r.date, 
        notes: r.notes 
      })),
      inventoryStatus: inventory.slice(0, 5),
    };

    return summary;
  } catch (error) {
    logger.error('Error getting project context for AI', error as Error);
    throw error;
  }
};

export default {
  generateAIInsight,
  optimizeResources,
  getProjectContextForAI,
};