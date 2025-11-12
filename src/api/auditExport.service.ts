/**
 * Audit Export Service
 * Provides export functionality for audit logs in various formats (Excel, PDF, CSV, JSON)
 */

import { 
  EnhancedAuditLog, 
  AuditExportOptions,
  FieldChange 
} from '@/types/audit.enhanced';

/**
 * Export audit logs to Excel format
 */
export async function exportToExcel(
  logs: EnhancedAuditLog[],
  options: AuditExportOptions
): Promise<Blob> {
  try {
    // Import xlsx dynamically
    const XLSX = await import('xlsx');
    
    // Prepare data based on options
    const data = prepareExportData(logs, options);
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    }));
    ws['!cols'] = colWidths;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    
    // Add summary sheet if requested
    if (options.pdfOptions?.includeStatistics) {
      const summaryData = generateSummaryData(logs);
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    return blob;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
}

/**
 * Export audit logs to PDF format
 */
export async function exportToPDF(
  logs: EnhancedAuditLog[],
  options: AuditExportOptions
): Promise<Blob> {
  try {
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(16);
    doc.text('Audit Trail Report', 14, 15);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    doc.text(`Total Records: ${logs.length}`, 14, 27);
    
    // Prepare table data
    const fields = options.fields || [];
    const tableData = logs.map(log => {
      const row: any = {};
      
      if (fields.includes('timestamp')) {
        row['Timestamp'] = log.timestamp.toDate().toLocaleString('id-ID');
      }
      if (fields.includes('userName')) {
        row['User'] = log.userName;
      }
      if (fields.includes('action')) {
        row['Action'] = log.action;
      }
      if (fields.includes('module')) {
        row['Module'] = log.module;
      }
      if (fields.includes('entityName')) {
        row['Entity'] = log.entityName || log.entityId;
      }
      if (fields.includes('impactLevel')) {
        row['Impact'] = log.impactLevel;
      }
      if (fields.includes('status')) {
        row['Status'] = log.status;
      }
      
      return row;
    });
    
    // Add table
    autoTable(doc, {
      head: [Object.keys(tableData[0] || {})],
      body: tableData.map(row => Object.values(row)),
      startY: 32,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Add summary if requested
    if (options.pdfOptions?.includeStatistics) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, 15);
      
      const summaryData = generateSummaryData(logs);
      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: summaryData.map(item => [item.Metric, item.Value]),
        startY: 22,
        styles: { fontSize: 10 }
      });
    }
    
    // Generate PDF blob
    const blob = doc.output('blob');
    return blob;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF');
  }
}

/**
 * Export audit logs to CSV format
 */
export async function exportToCSV(
  logs: EnhancedAuditLog[],
  options: AuditExportOptions
): Promise<Blob> {
  try {
    const data = prepareExportData(logs, options);
    
    // Convert to CSV
    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          const escaped = String(value || '')
            .replace(/"/g, '""')
            .replace(/\n/g, ' ');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return blob;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export to CSV');
  }
}

/**
 * Export audit logs to JSON format
 */
export async function exportToJSON(
  logs: EnhancedAuditLog[],
  options: AuditExportOptions
): Promise<Blob> {
  try {
    const data = prepareExportData(logs, options);
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    return blob;
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw new Error('Failed to export to JSON');
  }
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main export function - handles all formats
 */
export async function exportAuditLogs(
  logs: EnhancedAuditLog[],
  options: AuditExportOptions
): Promise<void> {
  try {
    let blob: Blob;
    let extension: string;
    
    // Generate blob based on format
    switch (options.format) {
      case 'excel':
        blob = await exportToExcel(logs, options);
        extension = 'xlsx';
        break;
      case 'pdf':
        blob = await exportToPDF(logs, options);
        extension = 'pdf';
        break;
      case 'csv':
        blob = await exportToCSV(logs, options);
        extension = 'csv';
        break;
      case 'json':
        blob = await exportToJSON(logs, options);
        extension = 'json';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `audit-logs-${timestamp}.${extension}`;
    
    // Download file
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
}

/**
 * Prepare data for export based on selected fields
 */
function prepareExportData(
  logs: EnhancedAuditLog[],
  options: AuditExportOptions
): any[] {
  const fields = options.fields || [];
  
  return logs.map(log => {
    const row: any = {};
    
    // Add selected fields
    if (fields.includes('timestamp')) {
      row['Timestamp'] = log.timestamp.toDate().toLocaleString('id-ID');
    }
    if (fields.includes('userId')) {
      row['User ID'] = log.userId;
    }
    if (fields.includes('userName')) {
      row['User Name'] = log.userName;
    }
    if (fields.includes('userRole')) {
      row['User Role'] = log.userRole;
    }
    if (fields.includes('userDepartment')) {
      row['Department'] = log.userDepartment || '-';
    }
    if (fields.includes('action')) {
      row['Action'] = log.action;
    }
    if (fields.includes('actionType')) {
      row['Action Type'] = log.actionType;
    }
    if (fields.includes('actionCategory')) {
      row['Category'] = log.actionCategory;
    }
    if (fields.includes('module')) {
      row['Module'] = log.module;
    }
    if (fields.includes('subModule')) {
      row['Sub Module'] = log.subModule || '-';
    }
    if (fields.includes('entityType')) {
      row['Entity Type'] = log.entityType;
    }
    if (fields.includes('entityId')) {
      row['Entity ID'] = log.entityId;
    }
    if (fields.includes('entityName')) {
      row['Entity Name'] = log.entityName || log.entityId;
    }
    if (fields.includes('impactLevel')) {
      row['Impact Level'] = log.impactLevel;
    }
    if (fields.includes('status')) {
      row['Status'] = log.status;
    }
    if (fields.includes('errorMessage')) {
      row['Error Message'] = log.errorMessage || '-';
    }
    if (fields.includes('changesSummary')) {
      row['Changes Summary'] = log.changesSummary || '-';
    }
    if (fields.includes('userIp')) {
      row['IP Address'] = log.userIp || '-';
    }
    if (fields.includes('isCompliant')) {
      row['Compliant'] = log.isCompliant ? 'Yes' : 'No';
    }
    if (fields.includes('requiresReview')) {
      row['Requires Review'] = log.requiresReview ? 'Yes' : 'No';
    }
    if (fields.includes('executionTimeMs')) {
      row['Execution Time (ms)'] = log.executionTimeMs || '-';
    }
    
    // Add changes detail if requested
    if (options.includeChanges && log.changes && log.changes.length > 0) {
      row['Detailed Changes'] = formatChangesForExport(log.changes);
    }
    
    return row;
  });
}

/**
 * Format changes array for export
 */
function formatChangesForExport(changes: FieldChange[]): string {
  return changes.map(change => {
    const parts = [change.fieldLabel];
    
    if (change.changeType === 'added') {
      parts.push(`ADDED: ${change.newValueFormatted}`);
    } else if (change.changeType === 'removed') {
      parts.push(`REMOVED: ${change.oldValueFormatted}`);
    } else {
      parts.push(`${change.oldValueFormatted} → ${change.newValueFormatted}`);
    }
    
    return parts.join(' - ');
  }).join(' | ');
}

/**
 * Generate summary statistics data
 */
function generateSummaryData(logs: EnhancedAuditLog[]): any[] {
  const totalLogs = logs.length;
  const successfulLogs = logs.filter(log => log.status === 'success').length;
  const failedLogs = logs.filter(log => log.status === 'failed').length;
  const compliantLogs = logs.filter(log => log.isCompliant).length;
  
  // Count by module
  const moduleCount: Record<string, number> = {};
  logs.forEach(log => {
    moduleCount[log.module] = (moduleCount[log.module] || 0) + 1;
  });
  
  // Count by action type
  const actionTypeCount: Record<string, number> = {};
  logs.forEach(log => {
    actionTypeCount[log.actionType] = (actionTypeCount[log.actionType] || 0) + 1;
  });
  
  // Count by impact level
  const impactCount: Record<string, number> = {};
  logs.forEach(log => {
    impactCount[log.impactLevel] = (impactCount[log.impactLevel] || 0) + 1;
  });
  
  // Unique users
  const uniqueUsers = new Set(logs.map(log => log.userId)).size;
  
  // Average execution time
  const avgExecution = logs.reduce((sum, log) => 
    sum + (log.executionTimeMs || 0), 0) / totalLogs;
  
  return [
    { Metric: 'Total Audit Logs', Value: totalLogs },
    { Metric: 'Successful Actions', Value: `${successfulLogs} (${((successfulLogs/totalLogs)*100).toFixed(1)}%)` },
    { Metric: 'Failed Actions', Value: `${failedLogs} (${((failedLogs/totalLogs)*100).toFixed(1)}%)` },
    { Metric: 'Compliance Rate', Value: `${((compliantLogs/totalLogs)*100).toFixed(1)}%` },
    { Metric: 'Unique Users', Value: uniqueUsers },
    { Metric: 'Average Execution Time', Value: `${avgExecution.toFixed(2)} ms` },
    { Metric: '', Value: '' }, // Separator
    { Metric: 'Top Module', Value: Object.entries(moduleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-' },
    { Metric: 'Top Action Type', Value: Object.entries(actionTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-' },
    { Metric: 'Critical Impact Count', Value: impactCount['critical'] || 0 },
    { Metric: 'High Impact Count', Value: impactCount['high'] || 0 },
  ];
}

/**
 * Get default export options
 */
export function getDefaultExportOptions(): AuditExportOptions {
  return {
    format: 'excel',
    fields: [
      'timestamp',
      'userName',
      'userRole',
      'action',
      'module',
      'entityName',
      'impactLevel',
      'status',
      'changesSummary'
    ],
    includeChanges: false,
    includeMetadata: true,
    groupBy: undefined,
    pdfOptions: {
      includeStatistics: true
    }
  };
}
