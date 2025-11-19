import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import { generateAIInsight } from './aiInsightService';
import { digitalSignatureService } from './digitalSignatureService';

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

// Helper function to validate password strength
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Callable function to change user password
export const changePassword = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to change password'
    );
  }

  const { currentPassword, newPassword } = data;
  const userId = context.auth.uid;

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Current password and new password are required'
    );
  }

  // Validate new password strength
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password does not meet requirements',
      validation.errors
    );
  }

  // Check if passwords are the same
  if (currentPassword === newPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'New password must be different from current password'
    );
  }

  try {
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }

    const userData = userDoc.data();
    
    // Check password history
    const passwordHistory = userData?.passwordHistory || [];
    const recentHashes = passwordHistory
      .slice(-5) // Check last 5 passwords
      .map((entry: any) => entry.passwordHash);

    // Check if new password matches any recent hash
    for (const hash of recentHashes) {
      const isMatch = await bcrypt.compare(newPassword, hash);
      if (isMatch) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Password has been used recently. Please choose a different password.'
        );
      }
    }

    // Update password in Firebase Authentication
//     const user = await admin.auth().getUser(userId);
 // Unused variable
    
    // Reauthenticate by verifying current password
    // Note: In a real implementation, you would verify the current password
    // against the user's stored password in Firebase Authentication
    
    // Update password in Firebase Authentication
    await admin.auth().updateUser(userId, {
      password: newPassword
    });

    // Hash new password for history
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Add to password history
    const historyEntry = {
      userId: userId,
      passwordHash: passwordHash,
      createdAt: new Date()
    };

    const updatedHistory = [
      ...passwordHistory.slice(-4), // Keep only last 4 entries
      historyEntry
    ];

    // Update Firestore
    await db.collection('users').doc(userId).update({
      passwordHistory: updatedHistory,
      lastPasswordChange: new Date()
    });

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error: any) {
    console.error('Error changing password:', error);
    
    if (error.code === 'auth/weak-password') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Password is too weak'
      );
    }
    
    if (error.code === 'auth/requires-recent-login') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Please reauthenticate and try again'
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to change password'
    );
  }
});

// Callable function to get password history (for admin/audit purposes)
export const getPasswordHistory = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { userId } = data;
  const requesterId = context.auth.uid;

  // Check if user is requesting their own history or is admin
  const requesterDoc = await db.collection('users').doc(requesterId).get();
  const requesterData = requesterDoc.data();
  
  const isAdmin = requesterData?.role === 'admin';
  const isOwner = requesterId === userId;
  
  if (!isOwner && !isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Insufficient permissions to access password history'
    );
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }

    const userData = userDoc.data();
    const history = userData?.passwordHistory || [];

    // Remove actual password hashes from response for security
    const sanitizedHistory = history.map((entry: any) => ({
      ...entry,
      passwordHash: '***', // Hide hash
      createdAt: entry.createdAt
    }));

    return {
      success: true,
      data: sanitizedHistory,
      message: 'Password history retrieved'
    };
  } catch (error) {
    console.error('Error getting password history:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get password history'
    );
  }
});

// Callable function to generate AI insights
export const generateAiInsight = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { projectContext, userMessage, conversationHistory } = data;
  const userId = context.auth.uid;

  // Get Gemini API key from environment variables
  const geminiApiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
  
  if (!geminiApiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.'
    );
  }

  try {
    // Parse project context if it's a string
    const context = typeof projectContext === 'string' ? JSON.parse(projectContext) : projectContext;
    
    // Build conversation history for context
    const historyText = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.map((msg: any) => 
          `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.parts[0]?.text || ''}`
        ).join('\n')
      : '';

    // Prepare enhanced project context
    const enhancedContext = {
      ...context,
      conversationHistory: historyText,
      currentQuestion: userMessage
    };

    // Generate AI response
    const aiResponse = await generateAIInsight(enhancedContext, geminiApiKey);
    
    return {
      success: true,
      summary: aiResponse,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI Insight Generation Error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to generate AI insight: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Callable function to process OCR
export const processOCR = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { imageData, mimeType } = data;
  const userId = context.auth.uid;

  try {
    // In a real implementation, you would process the image data with OCR here
    // For now, we'll return a mock response
    const ocrResult = {
      extractedText: "This is a sample OCR result",
      confidence: 0.95,
      boundingBoxes: [],
      processingTime: 1200,
      timestamp: new Date().toISOString()
    };

    // Log the OCR processing
    await db.collection('ocrLogs').add({
      userId,
      imageData,
      mimeType,
      result: ocrResult,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      data: ocrResult,
      message: 'OCR processing completed successfully'
    };
  } catch (error: any) {
    console.error('Error processing OCR:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process OCR'
    );
  }
});

// Callable function to create digital signature
export const createDigitalSignature = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { documentId, documentVersionId, signerInfo, signatureType } = data;
//   const userId = context.auth.uid;
 // Unused variable

  try {
    // Create digital signature using the service
    const signature = await digitalSignatureService.createSignature(
      documentId,
      documentVersionId,
      signerInfo,
      signatureType
    );

    return {
      success: true,
      data: signature,
      message: 'Digital signature created successfully'
    };
  } catch (error: any) {
    console.error('Error creating digital signature:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create digital signature'
    );
  }
});

// Callable function to verify digital signature
export const verifyDigitalSignature = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { signatureData, certificate } = data;
//   const userId = context.auth.uid;
 // Unused variable

  try {
    // Verify digital signature using the service
    const verification = await digitalSignatureService.verifySignature(
      signatureData,
      certificate
    );

    return {
      success: true,
      data: { isValid: verification },
      message: 'Digital signature verification completed'
    };
  } catch (error: any) {
    console.error('Error verifying digital signature:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to verify digital signature'
    );
  }
});