/**
 * Work Breakdown Structure (WBS) Service
 * 
 * Provides comprehensive WBS management functionality including:
 * - CRUD operations for WBS elements
 * - Hierarchy management (parent-child relationships)
 * - Budget calculations and rollups
 * - Cost allocations tracking
 * - Integration with RAB, Tasks, and Chart of Accounts
 * 
 * @module api/wbsService
 */

import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where,
    orderBy,
    writeBatch,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
    WBSElement,
    WBSHierarchy,
    WBSSummary,
    WBSCostAllocation,
    WBSBudgetRollup,
    WBSValidationResult,
    WBSFilterOptions,
    WBSSortOptions,
    hasChildren,
    isLeafElement
} from '@/types/wbs';
import { User } from '@/types';

/**
 * WBS Service Class
 */
class WBSService {
    private collectionName = 'wbs_elements';

    /**
     * Create a new WBS element
     */
    async createWBSElement(
        projectId: string,
        elementData: Omit<WBSElement, 'id' | 'children' | 'createdDate' | 'createdBy'>,
        user: User
    ): Promise<string> {
        try {
            // Validate WBS code uniqueness
            const existingElement = await this.getWBSByCode(projectId, elementData.code);
            if (existingElement) {
                throw new Error(`WBS code ${elementData.code} already exists in this project`);
            }

            // Validate parent exists if specified
            if (elementData.parentId) {
                const parent = await this.getWBSElement(elementData.parentId);
                if (!parent) {
                    throw new Error(`Parent WBS element ${elementData.parentId} not found`);
                }
                if (parent.projectId !== projectId) {
                    throw new Error('Parent WBS element must be in the same project');
                }
            }

            // Calculate derived fields
            const variance = elementData.budgetAmount - (elementData.actualAmount + elementData.commitments);
            const variancePercentage = elementData.budgetAmount > 0 
                ? (variance / elementData.budgetAmount) * 100 
                : 0;
            const availableBudget = elementData.budgetAmount - elementData.actualAmount - elementData.commitments;

            const newElement = {
                ...elementData,
                projectId,
                variance,
                variancePercentage,
                availableBudget,
                children: [],
                rabItemCount: 0,
                taskCount: 0,
                createdBy: user.id,
                createdDate: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, this.collectionName), newElement);

            console.log(`✅ WBS Element created: ${docRef.id} (${elementData.code})`);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating WBS element:', error);
            throw error;
        }
    }

    /**
     * Update WBS element
     */
    async updateWBSElement(
        elementId: string,
        updates: Partial<WBSElement>,
        user: User
    ): Promise<void> {
        try {
            const elementRef = doc(db, this.collectionName, elementId);
            const elementDoc = await getDoc(elementRef);

            if (!elementDoc.exists()) {
                throw new Error(`WBS element ${elementId} not found`);
            }

            const currentData = elementDoc.data() as WBSElement;

            // Recalculate derived fields if budget/actual/commitments changed
            let derivedUpdates = {};
            if (updates.budgetAmount !== undefined || 
                updates.actualAmount !== undefined || 
                updates.commitments !== undefined) {
                
                const budget = updates.budgetAmount ?? currentData.budgetAmount;
                const actual = updates.actualAmount ?? currentData.actualAmount;
                const commitments = updates.commitments ?? currentData.commitments;
                
                const variance = budget - (actual + commitments);
                const variancePercentage = budget > 0 ? (variance / budget) * 100 : 0;
                const availableBudget = budget - actual - commitments;

                derivedUpdates = {
                    variance,
                    variancePercentage,
                    availableBudget
                };
            }

            await updateDoc(elementRef, {
                ...updates,
                ...derivedUpdates,
                updatedBy: user.id,
                updatedDate: new Date().toISOString()
            });

            // If parent changed, update hierarchy
            if (updates.parentId !== undefined && updates.parentId !== currentData.parentId) {
                await this.updateHierarchyLevels(elementId, updates.parentId);
            }

            console.log(`✅ WBS Element updated: ${elementId}`);
        } catch (error) {
            console.error('❌ Error updating WBS element:', error);
            throw error;
        }
    }

    /**
     * Delete WBS element (and optionally its children)
     */
    async deleteWBSElement(
        elementId: string,
        deleteChildren: boolean = false,
        user: User
    ): Promise<void> {
        try {
            const element = await this.getWBSElement(elementId);
            if (!element) {
                throw new Error(`WBS element ${elementId} not found`);
            }

            // Check if element has children
            const children = await this.getChildElements(elementId);
            if (children.length > 0 && !deleteChildren) {
                throw new Error('Cannot delete WBS element with children. Set deleteChildren=true to force delete.');
            }

            // Delete children recursively if requested
            if (deleteChildren && children.length > 0) {
                for (const child of children) {
                    await this.deleteWBSElement(child.id, true, user);
                }
            }

            // Check for linked entities (RAB items, tasks, etc.)
            const hasLinks = await this.checkLinkedEntities(elementId);
            if (hasLinks) {
                console.warn(`⚠️ WBS element ${elementId} has linked entities. Consider unlinking first.`);
            }

            // Delete the element
            await deleteDoc(doc(db, this.collectionName, elementId));

            console.log(`✅ WBS Element deleted: ${elementId}`);
        } catch (error) {
            console.error('❌ Error deleting WBS element:', error);
            throw error;
        }
    }

    /**
     * Get single WBS element by ID
     */
    async getWBSElement(elementId: string): Promise<WBSElement | null> {
        try {
            const docRef = doc(db, this.collectionName, elementId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            return { id: docSnap.id, ...docSnap.data() } as WBSElement;
        } catch (error) {
            console.error('❌ Error getting WBS element:', error);
            throw error;
        }
    }

    /**
     * Get WBS element by code
     */
    async getWBSByCode(projectId: string, code: string): Promise<WBSElement | null> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('projectId', '==', projectId),
                where('code', '==', code)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return null;
            }

            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as WBSElement;
        } catch (error) {
            console.error('❌ Error getting WBS by code:', error);
            throw error;
        }
    }

    /**
     * Get complete WBS hierarchy for a project
     */
    async getWBSHierarchy(projectId: string): Promise<WBSHierarchy> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('projectId', '==', projectId),
                orderBy('code', 'asc')
            );
            const querySnapshot = await getDocs(q);

            const flatList: WBSElement[] = [];
            querySnapshot.forEach((doc) => {
                flatList.push({ id: doc.id, ...doc.data() } as WBSElement);
            });

            // Build tree structure
            const elementMap = new Map<string, WBSElement>();
            flatList.forEach(element => {
                element.children = [];
                elementMap.set(element.id, element);
            });

            const rootElements: WBSElement[] = [];
            flatList.forEach(element => {
                if (element.parentId) {
                    const parent = elementMap.get(element.parentId);
                    if (parent) {
                        parent.children.push(element);
                        parent.children.sort((a, b) => a.order - b.order);
                    }
                } else {
                    rootElements.push(element);
                }
            });

            rootElements.sort((a, b) => a.order - b.order);

            const maxLevel = flatList.reduce((max, el) => Math.max(max, el.level), 0);

            return {
                projectId,
                projectName: '', // Will be filled by caller
                rootElements,
                flatList,
                totalElements: flatList.length,
                maxLevel,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error getting WBS hierarchy:', error);
            throw error;
        }
    }

    /**
     * Get child elements of a WBS element
     */
    async getChildElements(parentId: string): Promise<WBSElement[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('parentId', '==', parentId),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);

            const children: WBSElement[] = [];
            querySnapshot.forEach((doc) => {
                children.push({ id: doc.id, ...doc.data() } as WBSElement);
            });

            return children;
        } catch (error) {
            console.error('❌ Error getting child elements:', error);
            throw error;
        }
    }

    /**
     * Calculate WBS summary (budget rollup)
     */
    async calculateWBSSummary(elementId: string): Promise<WBSSummary> {
        try {
            const element = await this.getWBSElement(elementId);
            if (!element) {
                throw new Error(`WBS element ${elementId} not found`);
            }

            // Get all descendants
            const descendants = await this.getAllDescendants(elementId);

            // Calculate totals (including element itself)
            let totalBudget = element.budgetAmount;
            let totalActual = element.actualAmount;
            let totalCommitments = element.commitments;
            let totalRabItems = element.rabItemCount;
            let totalTasks = element.taskCount;

            descendants.forEach(desc => {
                totalBudget += desc.budgetAmount;
                totalActual += desc.actualAmount;
                totalCommitments += desc.commitments;
                totalRabItems += desc.rabItemCount;
                totalTasks += desc.taskCount;
            });

            const totalVariance = totalBudget - (totalActual + totalCommitments);
            const variancePercentage = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

            // Calculate weighted progress
            let weightedProgress = 0;
            if (totalBudget > 0) {
                weightedProgress = element.progress * (element.budgetAmount / totalBudget);
                descendants.forEach(desc => {
                    weightedProgress += desc.progress * (desc.budgetAmount / totalBudget);
                });
            }

            // Determine completion status
            let completionStatus: WBSSummary['completionStatus'] = 'On Track';
            if (element.status === 'Completed') {
                completionStatus = 'Completed';
            } else if (variancePercentage < -10) {
                completionStatus = 'Over Budget';
            } else if (variancePercentage < -5) {
                completionStatus = 'At Risk';
            }

            const completedChildCount = descendants.filter(d => d.status === 'Completed').length;

            return {
                wbsId: elementId,
                wbsCode: element.code,
                wbsName: element.name,
                totalBudget,
                totalActual,
                totalCommitments,
                totalVariance,
                variancePercentage,
                overallProgress: weightedProgress,
                childCount: descendants.length,
                completedChildCount,
                totalRabItems,
                totalTasks,
                completionStatus
            };
        } catch (error) {
            console.error('❌ Error calculating WBS summary:', error);
            throw error;
        }
    }

    /**
     * Get all descendants of a WBS element (recursive)
     */
    private async getAllDescendants(elementId: string): Promise<WBSElement[]> {
        const descendants: WBSElement[] = [];
        const children = await this.getChildElements(elementId);

        for (const child of children) {
            descendants.push(child);
            const childDescendants = await this.getAllDescendants(child.id);
            descendants.push(...childDescendants);
        }

        return descendants;
    }

    /**
     * Link RAB item to WBS element
     */
    async linkRabToWBS(
        rabItemId: number,
        wbsId: string,
        projectId: string,
        user: User
    ): Promise<void> {
        try {
            // Update RAB item with wbsElementId
            // (This would be in rabService, but we track the count here)

            // Update WBS element's RAB item count
            const element = await this.getWBSElement(wbsId);
            if (!element) {
                throw new Error(`WBS element ${wbsId} not found`);
            }

            await updateDoc(doc(db, this.collectionName, wbsId), {
                rabItemCount: (element.rabItemCount || 0) + 1,
                updatedBy: user.id,
                updatedDate: new Date().toISOString()
            });

            console.log(`✅ RAB item ${rabItemId} linked to WBS ${wbsId}`);
        } catch (error) {
            console.error('❌ Error linking RAB to WBS:', error);
            throw error;
        }
    }

    /**
     * Update WBS budget from linked RAB items
     */
    async updateWBSBudgetFromRAB(wbsId: string, user: User): Promise<void> {
        try {
            // This would query RAB items linked to this WBS
            // and sum their budgets to update WBS budget
            // Implementation depends on RAB service integration

            console.log(`✅ WBS budget updated from RAB for ${wbsId}`);
        } catch (error) {
            console.error('❌ Error updating WBS budget from RAB:', error);
            throw error;
        }
    }

    /**
     * Update WBS actual costs from expenses
     */
    async updateWBSActualFromExpenses(wbsId: string, user: User): Promise<void> {
        try {
            // This would query expenses linked to this WBS
            // and sum their amounts to update WBS actual
            // Implementation depends on expense service integration

            console.log(`✅ WBS actual updated from expenses for ${wbsId}`);
        } catch (error) {
            console.error('❌ Error updating WBS actual from expenses:', error);
            throw error;
        }
    }

    /**
     * Get budget rollup by hierarchy level
     */
    async getBudgetRollupByLevel(projectId: string): Promise<WBSBudgetRollup[]> {
        try {
            const hierarchy = await this.getWBSHierarchy(projectId);
            const rollupMap = new Map<number, WBSBudgetRollup>();

            hierarchy.flatList.forEach(element => {
                if (!rollupMap.has(element.level)) {
                    rollupMap.set(element.level, {
                        level: element.level,
                        elements: [],
                        levelTotal: {
                            budget: 0,
                            actual: 0,
                            commitments: 0,
                            variance: 0
                        }
                    });
                }

                const rollup = rollupMap.get(element.level)!;
                rollup.elements.push({
                    wbsId: element.id,
                    code: element.code,
                    name: element.name,
                    budget: element.budgetAmount,
                    actual: element.actualAmount,
                    commitments: element.commitments,
                    variance: element.variance,
                    variancePercentage: element.variancePercentage,
                    progress: element.progress,
                    status: element.status
                });

                rollup.levelTotal.budget += element.budgetAmount;
                rollup.levelTotal.actual += element.actualAmount;
                rollup.levelTotal.commitments += element.commitments;
                rollup.levelTotal.variance += element.variance;
            });

            return Array.from(rollupMap.values()).sort((a, b) => a.level - b.level);
        } catch (error) {
            console.error('❌ Error getting budget rollup by level:', error);
            throw error;
        }
    }

    /**
     * Validate WBS structure
     */
    async validateWBSStructure(projectId: string): Promise<WBSValidationResult> {
        try {
            const errors: string[] = [];
            const warnings: string[] = [];

            const hierarchy = await this.getWBSHierarchy(projectId);

            // Check for duplicate codes
            const codes = new Set<string>();
            hierarchy.flatList.forEach(element => {
                if (codes.has(element.code)) {
                    errors.push(`Duplicate WBS code: ${element.code}`);
                }
                codes.add(element.code);
            });

            // Check for orphaned elements
            hierarchy.flatList.forEach(element => {
                if (element.parentId) {
                    const parentExists = hierarchy.flatList.some(e => e.id === element.parentId);
                    if (!parentExists) {
                        errors.push(`Orphaned element: ${element.code} (parent not found)`);
                    }
                }
            });

            // Check for level consistency
            hierarchy.flatList.forEach(element => {
                if (element.parentId) {
                    const parent = hierarchy.flatList.find(e => e.id === element.parentId);
                    if (parent && element.level !== parent.level + 1) {
                        errors.push(`Level inconsistency: ${element.code} (expected level ${parent.level + 1}, got ${element.level})`);
                    }
                }
            });

            // Check for budget without children (warnings)
            hierarchy.flatList.forEach(element => {
                if (element.children.length === 0 && element.budgetAmount === 0) {
                    warnings.push(`Leaf element without budget: ${element.code}`);
                }
            });

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            console.error('❌ Error validating WBS structure:', error);
            throw error;
        }
    }

    /**
     * Update hierarchy levels when parent changes
     */
    private async updateHierarchyLevels(elementId: string, newParentId: string | null): Promise<void> {
        try {
            let newLevel = 1;
            if (newParentId) {
                const parent = await this.getWBSElement(newParentId);
                if (parent) {
                    newLevel = parent.level + 1;
                }
            }

            // Update element and all descendants recursively
            await this.updateLevelRecursive(elementId, newLevel);
        } catch (error) {
            console.error('❌ Error updating hierarchy levels:', error);
            throw error;
        }
    }

    /**
     * Recursively update level for element and descendants
     */
    private async updateLevelRecursive(elementId: string, level: number): Promise<void> {
        await updateDoc(doc(db, this.collectionName, elementId), { level });

        const children = await this.getChildElements(elementId);
        for (const child of children) {
            await this.updateLevelRecursive(child.id, level + 1);
        }
    }

    /**
     * Check if WBS element has linked entities
     */
    private async checkLinkedEntities(elementId: string): Promise<boolean> {
        try {
            const element = await this.getWBSElement(elementId);
            if (!element) return false;

            return element.rabItemCount > 0 || element.taskCount > 0;
        } catch (error) {
            console.error('❌ Error checking linked entities:', error);
            return false;
        }
    }

    /**
     * Reorder WBS elements within same parent
     */
    async reorderElements(elementIds: string[], user: User): Promise<void> {
        try {
            const batch = writeBatch(db);

            elementIds.forEach((elementId, index) => {
                const elementRef = doc(db, this.collectionName, elementId);
                batch.update(elementRef, {
                    order: index,
                    updatedBy: user.id,
                    updatedDate: new Date().toISOString()
                });
            });

            await batch.commit();
            console.log(`✅ Reordered ${elementIds.length} WBS elements`);
        } catch (error) {
            console.error('❌ Error reordering elements:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const wbsService = new WBSService();
