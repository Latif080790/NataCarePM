/**
 * Smart Notification Service
 * Phase 6: AI & Automation - Predictive Notifications
 * 
 * Features:
 * - Predict project delays based on progress trends
 * - Budget overrun warnings
 * - Resource shortage alerts
 * - Weather-based scheduling recommendations
 * - Automated task reminders
 */

import { logger } from '@/utils/logger.enhanced';
import type { Project, Task, RabItem, InventoryItem } from '@/types';

// Extended types for analytics (supplements base types)
interface ExtendedProject extends Project {
  totalExpenses?: number;
  progress?: number;
  endDate?: string;
}

interface ExtendedTask extends Task {
  completedAt?: string;
}

interface ExtendedInventoryItem extends InventoryItem {
  id?: string;
  name?: string;
  minimumStock?: number;
  unitPrice?: number;
}

// ============================================
// TYPES
// ============================================

export interface SmartNotification {
  id: string;
  type: 'delay_prediction' | 'budget_warning' | 'resource_shortage' | 'task_reminder' | 'milestone_alert' | 'safety_reminder';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedAction?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'project' | 'task' | 'rab' | 'inventory';
  predictedDate?: Date;
  confidence: number; // 0-100
  createdAt: Date;
  expiresAt?: Date;
}

export interface ProjectHealthMetrics {
  schedulePerformanceIndex: number; // SPI - Earned Value metric
  costPerformanceIndex: number; // CPI - Earned Value metric
  progressVelocity: number; // Tasks completed per week
  averageTaskDelay: number; // Days
  resourceUtilization: number; // Percentage
  riskScore: number; // 0-100
}

export interface PredictionResult {
  willDelay: boolean;
  estimatedDelayDays: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

// Helper to safely access extended properties
const getProjectExpenses = (project: Project): number => 
  (project as ExtendedProject).totalExpenses || 0;

const getProjectProgress = (project: Project): number => 
  (project as ExtendedProject).progress || 0;

const getProjectEndDate = (project: Project): string | undefined => 
  (project as ExtendedProject).endDate;

const getTaskCompletedAt = (task: Task): string | undefined =>
  (task as ExtendedTask).completedAt;

const getInventoryName = (item: InventoryItem): string =>
  (item as ExtendedInventoryItem).name || item.materialName || 'Unknown';

const getInventoryMinStock = (item: InventoryItem): number =>
  (item as ExtendedInventoryItem).minimumStock || 10;

/**
 * Calculate project health metrics from project data
 */
export function calculateProjectHealth(
  project: Project,
  tasks: Task[],
  rabItems: RabItem[]
): ProjectHealthMetrics {
  const now = new Date();
  
  // Calculate Schedule Performance Index (SPI)
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const plannedProgress = calculatePlannedProgress(project, now);
  const actualProgress = (completedTasks / totalTasks) * 100;
  const spi = plannedProgress > 0 ? actualProgress / plannedProgress : 1;
  
  // Calculate Cost Performance Index (CPI)
  const totalBudget = rabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0) || 1;
  const actualSpent = getProjectExpenses(project);
  const earnedValue = (actualProgress / 100) * totalBudget;
  const cpi = actualSpent > 0 ? earnedValue / actualSpent : 1;
  
  // Calculate progress velocity (tasks per week)
  const completedTaskDates = tasks
    .filter(t => t.status === 'completed' && getTaskCompletedAt(t))
    .map(t => new Date(getTaskCompletedAt(t)!).getTime())
    .sort((a, b) => a - b);
  
  let velocity = 0;
  if (completedTaskDates.length >= 2) {
    const weeks = (completedTaskDates[completedTaskDates.length - 1] - completedTaskDates[0]) / (7 * 24 * 60 * 60 * 1000);
    velocity = weeks > 0 ? completedTaskDates.length / weeks : completedTaskDates.length;
  }
  
  // Calculate average task delay
  const delayedTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false;
    return new Date(t.dueDate) < now;
  });
  const avgDelay = delayedTasks.length > 0
    ? delayedTasks.reduce((sum, t) => {
        const dueDate = new Date(t.dueDate!);
        return sum + Math.max(0, (now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      }, 0) / delayedTasks.length
    : 0;
  
  // Calculate resource utilization (simplified - based on task assignment)
  const assignedTasks = tasks.filter(t => t.assignedTo && t.status !== 'completed').length;
  const resourceUtilization = Math.min(100, (assignedTasks / Math.max(5, totalTasks * 0.3)) * 100);
  
  // Calculate risk score
  const riskScore = calculateRiskScore(spi, cpi, avgDelay, delayedTasks.length / totalTasks);
  
  return {
    schedulePerformanceIndex: Math.round(spi * 100) / 100,
    costPerformanceIndex: Math.round(cpi * 100) / 100,
    progressVelocity: Math.round(velocity * 10) / 10,
    averageTaskDelay: Math.round(avgDelay * 10) / 10,
    resourceUtilization: Math.round(resourceUtilization),
    riskScore: Math.round(riskScore),
  };
}

/**
 * Calculate planned progress percentage based on project timeline
 */
function calculatePlannedProgress(project: Project, now: Date): number {
  const startDate = project.startDate ? new Date(project.startDate) : new Date();
  const projectEndDate = getProjectEndDate(project);
  const endDate = projectEndDate ? new Date(projectEndDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
  
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return (elapsed / totalDuration) * 100;
}

/**
 * Calculate risk score based on performance indicators
 */
function calculateRiskScore(spi: number, cpi: number, avgDelay: number, delayRatio: number): number {
  let score = 0;
  
  // SPI contribution (40%)
  if (spi < 0.8) score += 40;
  else if (spi < 0.9) score += 25;
  else if (spi < 1.0) score += 10;
  
  // CPI contribution (30%)
  if (cpi < 0.8) score += 30;
  else if (cpi < 0.9) score += 20;
  else if (cpi < 1.0) score += 10;
  
  // Average delay contribution (15%)
  if (avgDelay > 14) score += 15;
  else if (avgDelay > 7) score += 10;
  else if (avgDelay > 3) score += 5;
  
  // Delay ratio contribution (15%)
  if (delayRatio > 0.5) score += 15;
  else if (delayRatio > 0.3) score += 10;
  else if (delayRatio > 0.1) score += 5;
  
  return Math.min(100, score);
}

// ============================================
// PREDICTION FUNCTIONS
// ============================================

/**
 * Predict if project will be delayed
 */
export function predictProjectDelay(
  project: Project,
  tasks: Task[],
  rabItems: RabItem[]
): PredictionResult {
  const health = calculateProjectHealth(project, tasks, rabItems);
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  let delayProbability = 0;
  let estimatedDelayDays = 0;
  
  // Analyze SPI
  if (health.schedulePerformanceIndex < 0.8) {
    delayProbability += 35;
    factors.push(`Schedule Performance Index rendah (${health.schedulePerformanceIndex})`);
    recommendations.push('Tambah resource atau kurangi scope untuk catch up schedule');
    estimatedDelayDays += Math.round((1 - health.schedulePerformanceIndex) * 30);
  } else if (health.schedulePerformanceIndex < 0.95) {
    delayProbability += 15;
    factors.push(`Schedule sedikit tertinggal (SPI: ${health.schedulePerformanceIndex})`);
    recommendations.push('Monitor progress lebih ketat minggu depan');
  }
  
  // Analyze CPI
  if (health.costPerformanceIndex < 0.8) {
    delayProbability += 20;
    factors.push(`Cost Performance Index rendah (${health.costPerformanceIndex})`);
    recommendations.push('Review dan optimalkan penggunaan budget');
  }
  
  // Analyze task delays
  if (health.averageTaskDelay > 7) {
    delayProbability += 25;
    factors.push(`Rata-rata keterlambatan task ${health.averageTaskDelay} hari`);
    recommendations.push('Identify bottleneck dan address immediately');
    estimatedDelayDays += Math.round(health.averageTaskDelay * 0.5);
  } else if (health.averageTaskDelay > 3) {
    delayProbability += 10;
    factors.push(`Beberapa task terlambat (avg: ${health.averageTaskDelay} hari)`);
  }
  
  // Analyze velocity trend
  if (health.progressVelocity < 2) {
    delayProbability += 10;
    factors.push('Velocity penyelesaian task rendah');
    recommendations.push('Evaluate team capacity dan workflow efficiency');
  }
  
  // Analyze risk score
  if (health.riskScore > 70) {
    delayProbability += 10;
    factors.push(`Risk score tinggi (${health.riskScore}/100)`);
    recommendations.push('Lakukan risk mitigation meeting segera');
  }
  
  const willDelay = delayProbability > 50;
  const confidence = Math.min(95, 50 + (Math.abs(delayProbability - 50) * 0.8));
  
  if (!willDelay && factors.length === 0) {
    factors.push('Semua indikator dalam batas normal');
    recommendations.push('Maintain current momentum dan monitoring rutin');
  }
  
  return {
    willDelay,
    estimatedDelayDays: willDelay ? Math.max(1, estimatedDelayDays) : 0,
    confidence: Math.round(confidence),
    factors,
    recommendations,
  };
}

/**
 * Predict budget overrun
 */
export function predictBudgetOverrun(
  project: Project,
  rabItems: RabItem[]
): { willOverrun: boolean; estimatedOverrun: number; confidence: number; factors: string[] } {
  const totalBudget = rabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
  const currentSpent = getProjectExpenses(project);
  const progress = getProjectProgress(project);
  
  const factors: string[] = [];
  
  // Estimate final cost based on current burn rate
  const expectedFinalCost = progress > 0 ? (currentSpent / progress) * 100 : currentSpent;
  const estimatedOverrun = expectedFinalCost - totalBudget;
  const overrunPercentage = totalBudget > 0 ? (estimatedOverrun / totalBudget) * 100 : 0;
  
  if (overrunPercentage > 20) {
    factors.push(`Burn rate sangat tinggi - estimasi overrun ${Math.round(overrunPercentage)}%`);
  } else if (overrunPercentage > 10) {
    factors.push(`Burn rate di atas target - estimasi overrun ${Math.round(overrunPercentage)}%`);
  } else if (overrunPercentage > 0) {
    factors.push(`Slight budget pressure - ${Math.round(overrunPercentage)}% di atas target`);
  }
  
  return {
    willOverrun: overrunPercentage > 5,
    estimatedOverrun: Math.max(0, estimatedOverrun),
    confidence: Math.min(90, 60 + progress * 0.3),
    factors,
  };
}

// ============================================
// NOTIFICATION GENERATORS
// ============================================

/**
 * Generate smart notifications for a project
 */
export function generateSmartNotifications(
  project: Project,
  tasks: Task[],
  rabItems: RabItem[],
  inventoryItems: InventoryItem[]
): SmartNotification[] {
  const notifications: SmartNotification[] = [];
  const now = new Date();
  
  // 1. Delay Prediction Notification
  const delayPrediction = predictProjectDelay(project, tasks, rabItems);
  if (delayPrediction.willDelay) {
    notifications.push({
      id: `delay-${project.id}-${now.getTime()}`,
      type: 'delay_prediction',
      severity: delayPrediction.estimatedDelayDays > 14 ? 'critical' : 'warning',
      title: 'Prediksi Keterlambatan Project',
      message: `Project diprediksi terlambat ~${delayPrediction.estimatedDelayDays} hari. ${delayPrediction.factors[0]}`,
      actionRequired: true,
      suggestedAction: delayPrediction.recommendations[0],
      relatedEntityId: project.id,
      relatedEntityType: 'project',
      predictedDate: new Date(now.getTime() + delayPrediction.estimatedDelayDays * 24 * 60 * 60 * 1000),
      confidence: delayPrediction.confidence,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
  }
  
  // 2. Budget Warning Notification
  const budgetPrediction = predictBudgetOverrun(project, rabItems);
  if (budgetPrediction.willOverrun) {
    notifications.push({
      id: `budget-${project.id}-${now.getTime()}`,
      type: 'budget_warning',
      severity: budgetPrediction.estimatedOverrun > 0.2 * (getProjectExpenses(project) || 1) ? 'critical' : 'warning',
      title: 'Peringatan Budget Overrun',
      message: `Estimasi budget overrun: Rp ${budgetPrediction.estimatedOverrun.toLocaleString('id-ID')}. ${budgetPrediction.factors[0] || ''}`,
      actionRequired: true,
      suggestedAction: 'Review pengeluaran dan identifikasi area untuk cost optimization',
      relatedEntityId: project.id,
      relatedEntityType: 'project',
      confidence: budgetPrediction.confidence,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    });
  }
  
  // 3. Resource Shortage Notifications
  const lowStockItems = inventoryItems.filter(item => {
    const threshold = getInventoryMinStock(item);
    return item.quantity < threshold;
  });
  
  if (lowStockItems.length > 0) {
    notifications.push({
      id: `stock-${project.id}-${now.getTime()}`,
      type: 'resource_shortage',
      severity: lowStockItems.length > 3 ? 'critical' : 'warning',
      title: 'Stok Material Menipis',
      message: `${lowStockItems.length} item material di bawah minimum stock: ${lowStockItems.slice(0, 3).map(i => getInventoryName(i)).join(', ')}${lowStockItems.length > 3 ? '...' : ''}`,
      actionRequired: true,
      suggestedAction: 'Segera lakukan purchase order untuk material yang menipis',
      relatedEntityId: project.id,
      relatedEntityType: 'inventory',
      confidence: 95,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    });
  }
  
  // 4. Task Reminder Notifications (due in 2 days)
  const upcomingTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed' || t.status === 'done') return false;
    const dueDate = new Date(t.dueDate);
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    return daysUntilDue > 0 && daysUntilDue <= 2;
  });
  
  upcomingTasks.forEach(task => {
    notifications.push({
      id: `task-${task.id}-${now.getTime()}`,
      type: 'task_reminder',
      severity: 'info',
      title: 'Deadline Task Mendekat',
      message: `Task "${task.title}" akan jatuh tempo pada ${new Date(task.dueDate!).toLocaleDateString('id-ID')}`,
      actionRequired: false,
      relatedEntityId: task.id,
      relatedEntityType: 'task',
      confidence: 100,
      createdAt: now,
      expiresAt: new Date(task.dueDate!),
    });
  });
  
  // 5. Overdue Task Alerts
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed' || t.status === 'done') return false;
    return new Date(t.dueDate) < now;
  });
  
  if (overdueTasks.length > 0) {
    notifications.push({
      id: `overdue-${project.id}-${now.getTime()}`,
      type: 'milestone_alert',
      severity: overdueTasks.length > 5 ? 'critical' : 'warning',
      title: 'Task Melewati Deadline',
      message: `${overdueTasks.length} task sudah melewati deadline dan belum selesai`,
      actionRequired: true,
      suggestedAction: 'Prioritaskan penyelesaian task yang overdue',
      relatedEntityId: project.id,
      relatedEntityType: 'project',
      confidence: 100,
      createdAt: now,
    });
  }
  
  logger.info('Generated smart notifications', { 
    projectId: project.id, 
    notificationCount: notifications.length 
  });
  
  return notifications;
}

export default {
  calculateProjectHealth,
  predictProjectDelay,
  predictBudgetOverrun,
  generateSmartNotifications,
};
