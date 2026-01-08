/**
 * Natural Language Query Service
 * Phase 6: AI & Automation - Natural Language Search
 * 
 * Features:
 * - Natural language project queries using Gemini AI
 * - Query intent classification
 * - Context-aware responses
 * - Multi-language support (ID/EN)
 */

import { logger } from '@/utils/logger.enhanced';
import type { Project, Task, RabItem, InventoryItem } from '@/types';

// Extended types for analytics (supplements base types)
interface ExtendedProject extends Project {
  totalExpenses?: number;
  progress?: number;
  endDate?: string;
}

interface ExtendedInventoryItem extends InventoryItem {
  id?: string;
  name?: string;
  minimumStock?: number;
  unitPrice?: number;
}

// Helper to safely access extended properties
const getProjectExpenses = (project: Project): number => 
  (project as ExtendedProject).totalExpenses || 0;

const getProjectProgress = (project: Project): number => 
  (project as ExtendedProject).progress || 0;

const getProjectEndDate = (project: Project): string | undefined => 
  (project as ExtendedProject).endDate;

const getInventoryName = (item: InventoryItem): string =>
  (item as ExtendedInventoryItem).name || item.materialName || 'Unknown';

const getInventoryMinStock = (item: InventoryItem): number =>
  (item as ExtendedInventoryItem).minimumStock || 10;

const getInventoryUnitPrice = (item: InventoryItem): number =>
  (item as ExtendedInventoryItem).unitPrice || 0;

// ============================================
// TYPES
// ============================================

export type QueryIntent = 
  | 'project_status'
  | 'budget_info'
  | 'task_info'
  | 'inventory_info'
  | 'schedule_info'
  | 'risk_assessment'
  | 'comparison'
  | 'trend_analysis'
  | 'recommendation'
  | 'general_info'
  | 'unknown';

export interface NLQueryResult {
  intent: QueryIntent;
  answer: string;
  confidence: number;
  relatedData?: Record<string, unknown>;
  suggestedFollowUp?: string[];
  processingTime: number;
}

export interface ProjectContext {
  project: Project;
  tasks: Task[];
  rabItems: RabItem[];
  inventoryItems: InventoryItem[];
}

// ============================================
// INTENT CLASSIFICATION
// ============================================

const INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
  project_status: [
    /status\s*(proyek|project)/i,
    /bagaimana\s*(proyek|project)/i,
    /kondisi\s*(proyek|project)/i,
    /progress\s*(proyek|project)?/i,
    /how\s*is\s*the\s*project/i,
    /project\s*status/i,
  ],
  budget_info: [
    /anggaran|budget|biaya|cost/i,
    /pengeluaran|spending|expense/i,
    /berapa\s*(total|sisa)?\s*(biaya|budget|anggaran)/i,
    /rab|rencana anggaran/i,
    /how\s*much\s*(spent|budget|cost)/i,
  ],
  task_info: [
    /task|tugas|pekerjaan/i,
    /apa\s*yang\s*(harus|perlu)\s*dikerjakan/i,
    /deadline|tenggat/i,
    /siapa\s*yang\s*bertanggung\s*jawab/i,
    /what\s*tasks?/i,
    /overdue|terlambat/i,
  ],
  inventory_info: [
    /stok|stock|inventory|material/i,
    /persediaan|bahan/i,
    /ada\s*berapa\s*(material|barang)/i,
    /sisa\s*(material|bahan)/i,
    /what\s*materials?/i,
    /low\s*stock/i,
  ],
  schedule_info: [
    /jadwal|schedule|timeline/i,
    /kapan\s*(selesai|mulai|deadline)/i,
    /durasi|duration/i,
    /when\s*(will|is)/i,
    /timeline/i,
  ],
  risk_assessment: [
    /risiko|risk/i,
    /masalah|problem|issue/i,
    /hambatan|obstacle/i,
    /apa\s*yang\s*perlu\s*diwaspadai/i,
    /what\s*risks?/i,
    /concerns?/i,
  ],
  comparison: [
    /bandingkan|compare/i,
    /vs|versus/i,
    /lebih\s*(baik|tinggi|rendah)/i,
    /which\s*is\s*(better|worse)/i,
    /dibanding(kan)?/i,
  ],
  trend_analysis: [
    /tren|trend/i,
    /perkembangan|development/i,
    /meningkat|menurun/i,
    /over\s*time/i,
    /historis|historical/i,
  ],
  recommendation: [
    /saran|recommend|suggest/i,
    /apa\s*yang\s*harus\s*dilakukan/i,
    /sebaiknya|should/i,
    /langkah\s*selanjutnya|next\s*step/i,
    /tips?/i,
  ],
  general_info: [
    /apa\s*itu|what\s*is/i,
    /jelaskan|explain/i,
    /info|information/i,
    /ceritakan|tell\s*me/i,
  ],
  unknown: [],
};

/**
 * Classify query intent based on patterns
 */
function classifyIntent(query: string): { intent: QueryIntent; confidence: number } {
  const normalizedQuery = query.toLowerCase().trim();
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        return { intent: intent as QueryIntent, confidence: 85 };
      }
    }
  }
  
  // Default to general_info for unmatched queries
  return { intent: 'unknown', confidence: 50 };
}

// ============================================
// RESPONSE GENERATORS
// ============================================

/**
 * Generate response for project status query
 */
function generateProjectStatusResponse(context: ProjectContext): string {
  const { project, tasks } = context;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  
  let status = 'berjalan dengan baik';
  if (progress < 30 && overdueTasks > 3) status = 'perlu perhatian khusus';
  else if (overdueTasks > 5) status = 'mengalami beberapa keterlambatan';
  else if (progress > 80) status = 'hampir selesai';
  
  return `📊 **Status Project: ${project.name}**

• Progress: ${progress}% (${completedTasks}/${totalTasks} task selesai)
• Status: ${status}
• Task overdue: ${overdueTasks} task
• Lokasi: ${project.location || 'Tidak ditentukan'}

${overdueTasks > 0 ? `⚠️ Ada ${overdueTasks} task yang melewati deadline dan perlu ditindaklanjuti.` : '✅ Semua task dalam jadwal.'}`;
}

/**
 * Generate response for budget info query
 */
function generateBudgetResponse(context: ProjectContext): string {
  const { project, rabItems } = context;
  const totalBudget = rabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
  const spent = getProjectExpenses(project);
  const remaining = totalBudget - spent;
  const spentPercentage = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
  
  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
  
  let budgetStatus = '✅ Dalam anggaran';
  if (spentPercentage > 100) budgetStatus = '🔴 Melebihi anggaran';
  else if (spentPercentage > 85) budgetStatus = '⚠️ Hampir melebihi anggaran';
  else if (spentPercentage > 70) budgetStatus = '🟡 Perlu diperhatikan';
  
  return `💰 **Informasi Budget: ${project.name}**

• Total Anggaran: ${formatCurrency(totalBudget)}
• Sudah Digunakan: ${formatCurrency(spent)} (${spentPercentage}%)
• Sisa Anggaran: ${formatCurrency(remaining)}
• Status: ${budgetStatus}

📋 Total ${rabItems.length} item dalam RAB`;
}

/**
 * Generate response for task info query
 */
function generateTaskResponse(context: ProjectContext): string {
  const { project, tasks } = context;
  const now = new Date();
  
  const statusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed' || t.status === 'done').length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length,
  };
  
  const upcomingTasks = tasks
    .filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);
  
  let taskList = upcomingTasks.length > 0
    ? upcomingTasks.map(t => `  - ${t.title} (${new Date(t.dueDate!).toLocaleDateString('id-ID')})`).join('\n')
    : '  Tidak ada task dengan deadline dalam waktu dekat';
  
  return `📋 **Informasi Task: ${project.name}**

**Ringkasan:**
• Menunggu: ${statusCounts.todo} task
• Sedang Dikerjakan: ${statusCounts.inProgress} task
• Selesai: ${statusCounts.completed} task
• Terlambat: ${statusCounts.overdue} task

**Deadline Terdekat:**
${taskList}

${statusCounts.overdue > 0 ? `⚠️ Perhatian: ${statusCounts.overdue} task sudah melewati deadline!` : ''}`;
}

/**
 * Generate response for inventory info query
 */
function generateInventoryResponse(context: ProjectContext): string {
  const { project, inventoryItems } = context;
  
  const lowStockItems = inventoryItems.filter(item => {
    const threshold = getInventoryMinStock(item);
    return item.quantity < threshold;
  });
  
  const totalValue = inventoryItems.reduce((sum, item) => {
    const price = getInventoryUnitPrice(item);
    return sum + (item.quantity * price);
  }, 0);
  
  let lowStockList = lowStockItems.length > 0
    ? lowStockItems.slice(0, 5).map(i => `  - ${getInventoryName(i)}: ${i.quantity} ${i.unit || 'unit'}`).join('\n')
    : '  Semua material dalam kondisi cukup';
  
  return `📦 **Informasi Inventory: ${project.name}**

**Ringkasan:**
• Total Item: ${inventoryItems.length} jenis material
• Nilai Inventory: Rp ${totalValue.toLocaleString('id-ID')}
• Item Low Stock: ${lowStockItems.length} item

**Material Perlu Restock:**
${lowStockList}

${lowStockItems.length > 0 ? '⚠️ Segera lakukan purchase order untuk material yang menipis!' : '✅ Semua stok dalam kondisi aman.'}`;
}

/**
 * Generate response for schedule info query
 */
function generateScheduleResponse(context: ProjectContext): string {
  const { project, tasks } = context;
  const now = new Date();
  
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const projectEndDate = getProjectEndDate(project);
  const endDate = projectEndDate ? new Date(projectEndDate) : null;
  
  let daysRemaining = 0;
  let totalDays = 0;
  let elapsedDays = 0;
  
  if (startDate && endDate) {
    totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    elapsedDays = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  }
  
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  let scheduleStatus = '✅ Sesuai jadwal';
  if (daysRemaining <= 0 && progress < 100) scheduleStatus = '🔴 Melewati deadline';
  else if (daysRemaining < 7 && progress < 90) scheduleStatus = '⚠️ Deadline mendekat';
  else if (elapsedDays > totalDays * 0.5 && progress < 40) scheduleStatus = '⚠️ Perlu percepatan';
  
  return `📅 **Jadwal Project: ${project.name}**

• Mulai: ${startDate ? startDate.toLocaleDateString('id-ID') : 'Belum ditentukan'}
• Target Selesai: ${endDate ? endDate.toLocaleDateString('id-ID') : 'Belum ditentukan'}
• Sisa Waktu: ${daysRemaining} hari
• Progress: ${progress}%
• Status: ${scheduleStatus}

${daysRemaining > 0 
  ? `⏰ Project harus selesai dalam ${daysRemaining} hari lagi.`
  : progress === 100 
    ? '🎉 Project sudah selesai!'
    : '⚠️ Project sudah melewati deadline!'}`;
}

/**
 * Generate risk assessment response
 */
function generateRiskResponse(context: ProjectContext): string {
  const { project, tasks, rabItems, inventoryItems } = context;
  const risks: string[] = [];
  
  // Check task delays
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false;
    return new Date(t.dueDate) < new Date();
  });
  if (overdueTasks.length > 3) {
    risks.push(`🔴 ${overdueTasks.length} task overdue - risiko keterlambatan tinggi`);
  } else if (overdueTasks.length > 0) {
    risks.push(`🟡 ${overdueTasks.length} task overdue - perlu perhatian`);
  }
  
  // Check budget
  const totalBudget = rabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
  const spent = getProjectExpenses(project);
  if (totalBudget > 0 && spent / totalBudget > 0.85) {
    risks.push('🔴 Budget hampir habis - risiko cost overrun');
  }
  
  // Check inventory
  const lowStock = inventoryItems.filter(i => i.quantity < getInventoryMinStock(i));
  if (lowStock.length > 3) {
    risks.push(`🔴 ${lowStock.length} material low stock - risiko project delay`);
  } else if (lowStock.length > 0) {
    risks.push(`🟡 ${lowStock.length} material perlu restock`);
  }
  
  // Check schedule
  const projectEndDate = getProjectEndDate(project);
  if (projectEndDate) {
    const daysRemaining = Math.ceil((new Date(projectEndDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
    const progress = getProjectProgress(project);
    if (daysRemaining < 14 && progress < 80) {
      risks.push('🔴 Deadline dekat dengan progress rendah');
    }
  }
  
  if (risks.length === 0) {
    risks.push('✅ Tidak ada risiko signifikan terdeteksi');
  }
  
  return `⚠️ **Risk Assessment: ${project.name}**

**Risiko Teridentifikasi:**
${risks.map(r => `• ${r}`).join('\n')}

**Rekomendasi:**
${risks.length > 2 
  ? '• Segera lakukan meeting untuk mitigasi risiko\n• Prioritaskan task yang overdue\n• Review alokasi resource'
  : '• Maintain monitoring rutin\n• Update progress secara berkala'}`;
}

// ============================================
// MAIN QUERY FUNCTION
// ============================================

/**
 * Process natural language query
 */
export async function processNaturalLanguageQuery(
  query: string,
  context: ProjectContext
): Promise<NLQueryResult> {
  const startTime = Date.now();
  
  logger.info('Processing NL query', { query, projectId: context.project.id });
  
  // Classify intent
  const { intent, confidence } = classifyIntent(query);
  
  // Generate response based on intent
  let answer: string;
  let relatedData: Record<string, unknown> = {};
  const suggestedFollowUp: string[] = [];
  
  switch (intent) {
    case 'project_status':
      answer = generateProjectStatusResponse(context);
      suggestedFollowUp.push('Apa risiko yang perlu diwaspadai?', 'Bagaimana status budget?');
      break;
      
    case 'budget_info':
      answer = generateBudgetResponse(context);
      relatedData.totalBudget = context.rabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
      relatedData.spent = getProjectExpenses(context.project);
      suggestedFollowUp.push('Item RAB apa yang paling mahal?', 'Bagaimana progress project?');
      break;
      
    case 'task_info':
      answer = generateTaskResponse(context);
      relatedData.totalTasks = context.tasks.length;
      suggestedFollowUp.push('Task apa yang overdue?', 'Siapa yang paling banyak task?');
      break;
      
    case 'inventory_info':
      answer = generateInventoryResponse(context);
      relatedData.totalItems = context.inventoryItems.length;
      suggestedFollowUp.push('Material apa yang perlu dipesan?', 'Berapa total nilai inventory?');
      break;
      
    case 'schedule_info':
      answer = generateScheduleResponse(context);
      suggestedFollowUp.push('Apa yang bisa mempercepat progress?', 'Task apa yang kritis?');
      break;
      
    case 'risk_assessment':
      answer = generateRiskResponse(context);
      suggestedFollowUp.push('Bagaimana cara mitigasi risiko?', 'Berapa sisa waktu project?');
      break;
      
    case 'recommendation':
      // Generate recommendations based on current state
      answer = `💡 **Rekomendasi untuk ${context.project.name}:**\n\n`;
      const recommendations: string[] = [];
      
      const overdue = context.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
      if (overdue > 0) recommendations.push(`1. Prioritaskan ${overdue} task yang overdue`);
      
      const lowStock = context.inventoryItems.filter(i => i.quantity < getInventoryMinStock(i)).length;
      if (lowStock > 0) recommendations.push(`2. Lakukan PO untuk ${lowStock} material yang menipis`);
      
      const budgetUsed = getProjectExpenses(context.project) / context.rabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0) || 0;
      if (budgetUsed > 0.8) recommendations.push('3. Review pengeluaran untuk menghindari cost overrun');
      
      if (recommendations.length === 0) {
        recommendations.push('• Maintain momentum dan progress saat ini');
        recommendations.push('• Lakukan weekly review untuk early detection masalah');
      }
      
      answer += recommendations.join('\n');
      break;
      
    default:
      answer = `Maaf, saya kurang memahami pertanyaan "${query}". 

Anda bisa bertanya tentang:
• Status project dan progress
• Informasi budget dan pengeluaran
• Daftar task dan deadline
• Stok material/inventory
• Jadwal dan timeline
• Analisis risiko
• Rekomendasi

Contoh: "Bagaimana status project?", "Berapa sisa budget?", "Task apa yang overdue?"`;
  }
  
  const processingTime = Date.now() - startTime;
  
  logger.info('NL query processed', { 
    query, 
    intent, 
    confidence, 
    processingTime 
  });
  
  return {
    intent,
    answer,
    confidence,
    relatedData,
    suggestedFollowUp,
    processingTime,
  };
}

/**
 * React hook for natural language queries
 */
export function useNaturalLanguageQuery() {
  return {
    processQuery: processNaturalLanguageQuery,
    classifyIntent,
  };
}

export default {
  processNaturalLanguageQuery,
  classifyIntent,
  useNaturalLanguageQuery,
};
