"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDigitalSignature = exports.createDigitalSignature = exports.processOCR = exports.generateAiInsight = exports.getPasswordHistory = exports.changePassword = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const aiInsightService_1 = require("./aiInsightService");
const digitalSignatureService_1 = require("./digitalSignatureService");
// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
// Helper function to validate password strength
const validatePassword = (password) => {
    const errors = [];
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
exports.changePassword = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to change password');
    }
    const { currentPassword, newPassword } = data;
    const userId = context.auth.uid;
    // Validate input
    if (!currentPassword || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'Current password and new password are required');
    }
    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
        throw new functions.https.HttpsError('invalid-argument', 'Password does not meet requirements', validation.errors);
    }
    // Check if passwords are the same
    if (currentPassword === newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'New password must be different from current password');
    }
    try {
        // Get user document
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        // Check password history
        const passwordHistory = (userData === null || userData === void 0 ? void 0 : userData.passwordHistory) || [];
        const recentHashes = passwordHistory
            .slice(-5) // Check last 5 passwords
            .map((entry) => entry.passwordHash);
        // Check if new password matches any recent hash
        for (const hash of recentHashes) {
            const isMatch = await bcryptjs_1.default.compare(newPassword, hash);
            if (isMatch) {
                throw new functions.https.HttpsError('invalid-argument', 'Password has been used recently. Please choose a different password.');
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
        const passwordHash = await bcryptjs_1.default.hash(newPassword, saltRounds);
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
    }
    catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/weak-password') {
            throw new functions.https.HttpsError('invalid-argument', 'Password is too weak');
        }
        if (error.code === 'auth/requires-recent-login') {
            throw new functions.https.HttpsError('failed-precondition', 'Please reauthenticate and try again');
        }
        throw new functions.https.HttpsError('internal', 'Failed to change password');
    }
});
// Callable function to get password history (for admin/audit purposes)
exports.getPasswordHistory = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId } = data;
    const requesterId = context.auth.uid;
    // Check if user is requesting their own history or is admin
    const requesterDoc = await db.collection('users').doc(requesterId).get();
    const requesterData = requesterDoc.data();
    const isAdmin = (requesterData === null || requesterData === void 0 ? void 0 : requesterData.role) === 'admin';
    const isOwner = requesterId === userId;
    if (!isOwner && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to access password history');
    }
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const history = (userData === null || userData === void 0 ? void 0 : userData.passwordHistory) || [];
        // Remove actual password hashes from response for security
        const sanitizedHistory = history.map((entry) => (Object.assign(Object.assign({}, entry), { passwordHash: '***', createdAt: entry.createdAt })));
        return {
            success: true,
            data: sanitizedHistory,
            message: 'Password history retrieved'
        };
    }
    catch (error) {
        console.error('Error getting password history:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get password history');
    }
});
// Callable function to generate AI insights
exports.generateAiInsight = functions.https.onCall(async (data, context) => {
    var _a;
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { projectContext, userMessage, conversationHistory } = data;
    // const userId = context.auth.uid;
    // Get Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY || ((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key);
    if (!geminiApiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
    }
    try {
        // Parse project context if it's a string
        const context = typeof projectContext === 'string' ? JSON.parse(projectContext) : projectContext;
        // Build conversation history for context
        const historyText = conversationHistory && conversationHistory.length > 0
            ? conversationHistory.map((msg) => { var _a; return `${msg.role === 'user' ? 'User' : 'AI'}: ${((_a = msg.parts[0]) === null || _a === void 0 ? void 0 : _a.text) || ''}`; }).join('\n')
            : '';
        // Prepare enhanced project context
        const enhancedContext = Object.assign(Object.assign({}, context), { conversationHistory: historyText, currentQuestion: userMessage });
        // Generate AI response
        const aiResponse = await (0, aiInsightService_1.generateAIInsight)(enhancedContext, geminiApiKey);
        return {
            success: true,
            summary: aiResponse,
            generatedAt: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('AI Insight Generation Error:', error);
        throw new functions.https.HttpsError('internal', `Failed to generate AI insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
// Callable function to process OCR
exports.processOCR = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
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
    }
    catch (error) {
        console.error('Error processing OCR:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process OCR');
    }
});
// Callable function to create digital signature
exports.createDigitalSignature = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { documentId, documentVersionId, signerInfo, signatureType } = data;
    //   const userId = context.auth.uid;
    // Unused variable
    try {
        // Create digital signature using the service
        const signature = await digitalSignatureService_1.digitalSignatureService.createSignature(documentId, documentVersionId, signerInfo, signatureType);
        return {
            success: true,
            data: signature,
            message: 'Digital signature created successfully'
        };
    }
    catch (error) {
        console.error('Error creating digital signature:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create digital signature');
    }
});
// Callable function to verify digital signature
exports.verifyDigitalSignature = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { signatureData, certificate } = data;
    //   const userId = context.auth.uid;
    // Unused variable
    try {
        // Verify digital signature using the service
        const verification = await digitalSignatureService_1.digitalSignatureService.verifySignature(signatureData, certificate);
        return {
            success: true,
            data: { isValid: verification },
            message: 'Digital signature verification completed'
        };
    }
    catch (error) {
        console.error('Error verifying digital signature:', error);
        throw new functions.https.HttpsError('internal', 'Failed to verify digital signature');
    }
});
//# sourceMappingURL=index.js.map