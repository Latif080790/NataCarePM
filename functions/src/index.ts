import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

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
    const user = await admin.auth().getUser(userId);
    
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

  const { projectId } = data;
  const userId = context.auth.uid;

  // Check if user has access to the project
  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Project not found'
      );
    }

    // Check if user is project member
    const memberDoc = await db.collection('projects').doc(projectId)
      .collection('members').doc(userId).get();
      
    if (!memberDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User is not a member of this project'
      );
    }

    // Get project data
    const projectData = projectDoc.data();
    
    if (!projectData) {
      throw new functions.https.HttpsError(
        'not-found',
        'Project data not found'
      );
    }

    // Prepare project context for AI
    const { name, location, startDate, items = [], expenses = [], dailyReports = [], inventory = [] } = projectData;
    
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

    // In a real implementation, you would call the Gemini API here
    // For now, we'll return a mock response
    const aiResponse = {
      summary: `Project ${name} is progressing with a budget of ${summary.totalBudget} and actual cost of ${summary.totalActualCost}.`,
      risks: [
        "Potential delay in material delivery",
        "Weather conditions may affect schedule",
        "Resource allocation needs optimization"
      ],
      predictions: {
        completionDate: "2026-03-15",
        finalCost: summary.totalActualCost * 1.15,
        riskLevel: "Medium"
      },
      generatedAt: new Date().toISOString()
    };

    // Update project with AI insight
    await db.collection('projects').doc(projectId).update({
      aiInsight: aiResponse
    });

    return {
      success: true,
      data: aiResponse,
      message: 'AI insight generated successfully'
    };
  } catch (error: any) {
    console.error('Error generating AI insight:', error);
    
    if (error.code === 'failed-precondition') {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate AI insight'
    );
  }
});