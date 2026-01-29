import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Define transaction types for strict typing
export interface TransactionData {
    type: 'purchase_order' | 'invoice' | 'payment' | 'sensitive_change';
    documentId: string;
    amount: number;
    approvedBy: string; // User ID
    notes?: string;
    [key: string]: any;
}

/**
 * Validates and commits a sensitive financial transaction.
 * Prevents client-side manipulation of "Approved" status.
 */
export const approveTransactionLogic = async (
    data: TransactionData,
    context: functions.https.CallableContext
): Promise<{ success: boolean; transactionId: string; timestamp: string }> => {
    // 1. Authentication Gate
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to approve transactions.');
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    // 2. Authorization Gate (RBAC validation)
    // Fetch user role - separate from auth token to ensure fresh data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Hardcoded roles for now, eventually check against a permissions matrix
    const allowedRoles = ['admin', 'manager', 'finance_director'];
    if (!userData || !allowedRoles.includes(userData.role)) {
        throw new functions.https.HttpsError('permission-denied', 'User does not have approval privileges.');
    }

    // 3. Data Integrity Validation
    if (data.amount > 1000000000 && userData.role !== 'admin') {
        // Example: Only Admins can approve > 1 Billion
        throw new functions.https.HttpsError('permission-denied', 'Transaction amount exceeds your approval limit.');
    }

    // 4. Atomic Commit
    const transactionRef = db.collection('audit_log').doc();
    const targetDocRef = db.collection(getCollectionForType(data.type)).doc(data.documentId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(targetDocRef);
            if (!doc.exists) {
                throw new functions.https.HttpsError('not-found', 'Target document not found.');
            }

            const currentData = doc.data();
            if (currentData?.status === 'APPROVED') {
                throw new functions.https.HttpsError('failed-precondition', 'Document is already approved.');
            }

            // Update Target Status
            t.update(targetDocRef, {
                status: 'APPROVED',
                approvedBy: userId,
                approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastModified: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Write Audit Log
            t.set(transactionRef, {
                action: 'APPROVE',
                resourceType: data.type,
                resourceId: data.documentId,
                actorId: userId,
                meta: data,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        return {
            success: true,
            transactionId: transactionRef.id,
            timestamp: new Date().toISOString(),
        };

    } catch (error: any) {
        console.error('Transaction Approval Failed:', error);
        throw new functions.https.HttpsError(
            error.code === 'failed-precondition' ? 'failed-precondition' : 'internal',
            error.message || 'Approval failed.'
        );
    }
};

function getCollectionForType(type: string): string {
    switch (type) {
        case 'purchase_order': return 'purchase_orders';
        case 'invoice': return 'invoices';
        case 'payment': return 'payments';
        default: return 'finance_requests';
    }
}
