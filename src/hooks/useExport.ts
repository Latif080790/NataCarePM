/**
 * useExport Hook - Reusable export functionality for PDF and Excel
 * Phase 3: Feature Enhancement - Export capabilities
 * 
 * Usage:
 * const { exportToExcel, exportToPDF, isExporting } = useExport();
 * 
 * // Export with data
 * await exportToExcel(auditLogs, { filename: 'audit-report' });
 * await exportToPDF(auditLogs, { filename: 'audit-report', title: 'Audit Report' });
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { logger } from '@/utils/logger.enhanced';

export interface ExportOptions {
  /** Filename without extension */
  filename?: string;
  /** Include statistics summary */
  includeStatistics?: boolean;
  /** Title for PDF report */
  title?: string;
  /** Subtitle for PDF report */
  subtitle?: string;
  /** Date range for filtering */
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}

type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const { addToast } = useToast();

  /**
   * Download blob as file
   */
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Export data to Excel format
   */
  const exportExcel = useCallback(async <T extends Record<string, unknown>>(
    data: T[],
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setExportFormat('excel');

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `export-${timestamp}`;
      const fullFilename = `${filename}.xlsx`;

      // Dynamic import for bundle optimization
      const { Workbook } = await import('exceljs');
      
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Data');

      if (data.length === 0) {
        throw new Error('No data to export');
      }

      // Get headers from first row
      const headers = Object.keys(data[0]);
      
      // Define columns with auto-width
      worksheet.columns = headers.map(header => ({
        header: formatHeader(header),
        key: header,
        width: Math.max(
          header.length + 2,
          ...data.map(row => String(row[header] || '').length + 2)
        )
      }));

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(row);
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2980B9' } // Blue background
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Add summary sheet if requested
      if (options.includeStatistics) {
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
          { header: 'Metric', key: 'Metric', width: 30 },
          { header: 'Value', key: 'Value', width: 20 }
        ];
        
        summarySheet.addRow({ Metric: 'Total Records', Value: data.length });
        summarySheet.addRow({ Metric: 'Export Date', Value: new Date().toLocaleString('id-ID') });
        if (options.dateRange) {
          summarySheet.addRow({ Metric: 'Date Range Start', Value: options.dateRange.start.toLocaleDateString('id-ID') });
          summarySheet.addRow({ Metric: 'Date Range End', Value: options.dateRange.end.toLocaleDateString('id-ID') });
        }

        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF27AE60' } // Green background
        };
        summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      // Generate Excel file buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      downloadBlob(blob, fullFilename);

      addToast(`Data berhasil di-export ke ${fullFilename}`, 'success');

      logger.info('Excel export successful', { filename: fullFilename, recordCount: data.length });

      return { success: true, filename: fullFilename };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      logger.error('Excel export failed', error instanceof Error ? error : undefined);
      addToast(`Export gagal: ${message}`, 'error');
      return { success: false, error: message };
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  }, [addToast, downloadBlob]);

  /**
   * Export data to PDF format
   */
  const exportPDF = useCallback(async <T extends Record<string, unknown>>(
    data: T[],
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setExportFormat('pdf');

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `export-${timestamp}`;
      const fullFilename = `${filename}.pdf`;

      // Dynamic import for bundle optimization
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      const title = options.title || 'Export Report';
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 15);

      // Add subtitle if provided
      if (options.subtitle) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(options.subtitle, 14, 22);
      }

      // Add export date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Exported: ${new Date().toLocaleString('id-ID')}`, 14, options.subtitle ? 28 : 22);

      // Get headers from first row
      const headers = Object.keys(data[0]);
      const tableData = data.map(row => headers.map(h => formatValue(row[h])));

      // Generate table
      autoTable(doc, {
        head: [headers.map(formatHeader)],
        body: tableData,
        startY: options.subtitle ? 35 : 30,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 35 },
      });

      // Add statistics if requested
      if (options.includeStatistics) {
        // Access the finalY from jsPDF-autotable  
        interface jsPDFWithAutoTable {
          lastAutoTable?: { finalY: number };
        }
        const finalY = (doc as unknown as jsPDFWithAutoTable).lastAutoTable?.finalY || 30;
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Total Records: ${data.length}`, 14, finalY + 10);
      }

      // Save PDF
      doc.save(fullFilename);

      addToast(`Data berhasil di-export ke ${fullFilename}`, 'success');

      logger.info('PDF export successful', { filename: fullFilename, recordCount: data.length });

      return { success: true, filename: fullFilename };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      logger.error('PDF export failed', error instanceof Error ? error : undefined);
      addToast(`Export gagal: ${message}`, 'error');
      return { success: false, error: message };
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  }, [addToast]);

  /**
   * Export data to CSV format
   */
  const exportCSV = useCallback(async <T extends Record<string, unknown>>(
    data: T[],
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setExportFormat('csv');

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `export-${timestamp}`;
      const fullFilename = `${filename}.csv`;

      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.map(formatHeader).join(','),
        ...data.map(row => 
          headers.map(h => {
            const val = formatValue(row[h]);
            // Escape quotes and wrap in quotes if contains comma
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, fullFilename);

      addToast(`Data berhasil di-export ke ${fullFilename}`, 'success');

      logger.info('CSV export successful', { filename: fullFilename, recordCount: data.length });

      return { success: true, filename: fullFilename };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      logger.error('CSV export failed', error instanceof Error ? error : undefined);
      addToast(`Export gagal: ${message}`, 'error');
      return { success: false, error: message };
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  }, [addToast, downloadBlob]);

  /**
   * Export data to JSON format
   */
  const exportJSON = useCallback(async <T extends Record<string, unknown>>(
    data: T[],
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setExportFormat('json');

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `export-${timestamp}`;
      const fullFilename = `${filename}.json`;

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      downloadBlob(blob, fullFilename);

      addToast(`Data berhasil di-export ke ${fullFilename}`, 'success');

      logger.info('JSON export successful', { filename: fullFilename, recordCount: data.length });

      return { success: true, filename: fullFilename };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      logger.error('JSON export failed', error instanceof Error ? error : undefined);
      addToast(`Export gagal: ${message}`, 'error');
      return { success: false, error: message };
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  }, [addToast, downloadBlob]);

  return {
    exportExcel,
    exportPDF,
    exportCSV,
    exportJSON,
    isExporting,
    exportFormat,
  };
}

// Helper functions
function formatHeader(header: string): string {
  return header
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleString('id-ID');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default useExport;
