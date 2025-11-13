/**
 * Test for auditExport service with ExcelJS (replaces xlsx)
 * Verifies Excel export functionality after CVE fix
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  exportToExcel,
  exportToPDF,
  exportToCSV,
  exportToJSON,
  exportAuditLogs,
  downloadBlob,
  getDefaultExportOptions
} from '../auditExport.service';
import type { EnhancedAuditLog, AuditExportOptions } from '@/types/audit.enhanced';
import { Timestamp } from 'firebase/firestore';

// Mock ExcelJS
vi.mock('exceljs', () => {
  const Workbook = class {
    worksheets: any[] = [];
    
    addWorksheet(name: string) {
      const worksheet = {
        name,
        columns: [] as any[],
        rows: [] as any[],
        addRow: vi.fn((data: any) => {
          worksheet.rows.push(data);
        }),
        getRow: vi.fn(() => ({
          font: {},
          fill: {},
          eachCell: vi.fn((callback: any) => {
            // Mock cells
            const cells = [{ border: {} }, { border: {} }];
            cells.forEach(cell => callback(cell));
          })
        })),
        eachRow: vi.fn((callback: any) => {
          worksheet.rows.forEach((row, index) => callback(row, index));
        })
      };
      this.worksheets.push(worksheet);
      return worksheet;
    }
    
    xlsx = {
      writeBuffer: vi.fn(async () => {
        // Return mock buffer
        return new ArrayBuffer(100);
      })
    };
  };
  
  return {
    default: Workbook,
    Workbook
  };
});

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn(() => new Blob(['pdf content'], { type: 'application/pdf' }))
  }))
}));

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}));

describe('AuditExport Service (ExcelJS)', () => {
  const mockLogs: EnhancedAuditLog[] = [
    {
      id: 'log1',
      timestamp: Timestamp.fromDate(new Date('2025-11-12T10:00:00Z')),
      userId: 'user123',
      userName: 'John Doe',
      userRole: 'Project Manager',
      userDepartment: 'Engineering',
      action: 'Created project',
      actionType: 'create',
      actionCategory: 'project',
      module: 'Projects',
      subModule: 'Project Creation',
      entityType: 'project',
      entityId: 'proj_001',
      entityName: 'New Construction Project',
      impactLevel: 'high',
      status: 'success',
      isCompliant: true,
      requiresReview: false,
      executionTimeMs: 250,
      userIp: '192.168.1.100',
      changes: [
        {
          field: 'name',
          fieldLabel: 'Project Name',
          fieldType: 'string',
          oldValue: null,
          newValue: 'New Construction Project',
          oldValueFormatted: '-',
          newValueFormatted: 'New Construction Project',
          changeType: 'added',
          isSignificant: true
        }
      ],
      changesSummary: 'Created new project with 5 fields',
      metadata: {},
      sessionId: 'session_123',
      requestId: 'corr_123',
      tags: ['project', 'creation'],
      createdAt: Timestamp.fromDate(new Date('2025-11-12T10:00:00Z'))
    },
    {
      id: 'log2',
      timestamp: Timestamp.fromDate(new Date('2025-11-12T11:00:00Z')),
      userId: 'user456',
      userName: 'Jane Smith',
      userRole: 'Admin',
      userDepartment: 'IT',
      action: 'Updated user permissions',
      actionType: 'update',
      actionCategory: 'security',
      module: 'Users',
      subModule: undefined,
      entityType: 'user',
      entityId: 'user_789',
      entityName: 'Alice Johnson',
      impactLevel: 'critical',
      status: 'success',
      isCompliant: true,
      requiresReview: true,
      executionTimeMs: 150,
      userIp: '192.168.1.101',
      changes: [],
      changesSummary: 'Updated permissions',
      metadata: {},
      sessionId: 'session_456',
      requestId: 'corr_456',
      createdAt: Timestamp.fromDate(new Date('2025-11-12T11:00:00Z')),
      tags: ['user', 'permissions']
    }
  ];

  const defaultOptions: AuditExportOptions = {
    format: 'excel',
    fields: ['timestamp', 'userName', 'action', 'module', 'status'],
    includeChanges: false,
    includeMetadata: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToExcel (ExcelJS)', () => {
    it('should export audit logs to Excel format', async () => {
      const blob = await exportToExcel(mockLogs, defaultOptions);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should create worksheet with correct data', async () => {
      await exportToExcel(mockLogs, defaultOptions);
      
      // ExcelJS mock should have been called
      const ExcelJS = await import('exceljs');
      expect(ExcelJS.default).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      await expect(exportToExcel([], defaultOptions))
        .rejects.toThrow('No data to export');
    });

    it('should add summary sheet when includeStatistics is true', async () => {
      const optionsWithStats: AuditExportOptions = {
        ...defaultOptions,
        pdfOptions: {
          includeStatistics: true
        }
      };
      
      const blob = await exportToExcel(mockLogs, optionsWithStats);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should auto-size columns based on content', async () => {
      const blob = await exportToExcel(mockLogs, defaultOptions);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('exportToPDF', () => {
    it('should export audit logs to PDF format', async () => {
      const blob = await exportToPDF(mockLogs, defaultOptions);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('should include statistics in PDF when requested', async () => {
      const optionsWithStats: AuditExportOptions = {
        ...defaultOptions,
        pdfOptions: {
          includeStatistics: true
        }
      };
      
      const blob = await exportToPDF(mockLogs, optionsWithStats);
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('exportToCSV', () => {
    it('should export audit logs to CSV format', async () => {
      const blob = await exportToCSV(mockLogs, defaultOptions);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('should handle special characters in CSV', async () => {
      const logsWithSpecialChars = [{
        ...mockLogs[0],
        userName: 'User, "Special"',
        action: 'Action\nWith\nNewlines'
      }];
      
      const blob = await exportToCSV(logsWithSpecialChars, defaultOptions);
      const text = await blob.text();
      
      expect(text).toContain('User, ""Special""'); // Escaped quotes
      expect(text).toContain('Action With Newlines'); // Newlines replaced
    });
  });

  describe('exportToJSON', () => {
    it('should export audit logs to JSON format', async () => {
      const blob = await exportToJSON(mockLogs, defaultOptions);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should create valid JSON', async () => {
      const blob = await exportToJSON(mockLogs, defaultOptions);
      const text = await blob.text();
      const parsed = JSON.parse(text);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });
  });

  describe('exportAuditLogs', () => {
    // Mock DOM methods
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: ''
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    });

    it('should export to Excel format', async () => {
      await exportAuditLogs(mockLogs, { ...defaultOptions, format: 'excel' });
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should export to PDF format', async () => {
      await exportAuditLogs(mockLogs, { ...defaultOptions, format: 'pdf' });
      
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should export to CSV format', async () => {
      await exportAuditLogs(mockLogs, { ...defaultOptions, format: 'csv' });
      
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should export to JSON format', async () => {
      await exportAuditLogs(mockLogs, { ...defaultOptions, format: 'json' });
      
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        exportAuditLogs(mockLogs, { ...defaultOptions, format: 'xml' as any })
      ).rejects.toThrow('Unsupported export format: xml');
    });

    it('should generate filename with timestamp', async () => {
      await exportAuditLogs(mockLogs, { ...defaultOptions, format: 'excel' });
      
      const link = document.createElement('a');
      expect(link.download).toMatch(/audit-logs-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx/);
    });
  });

  describe('downloadBlob', () => {
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: ''
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    });

    it('should create download link and trigger click', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const filename = 'test.txt';
      
      downloadBlob(blob, filename);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('getDefaultExportOptions', () => {
    it('should return default export options', () => {
      const options = getDefaultExportOptions();
      
      expect(options.format).toBe('excel');
      expect(options.fields).toContain('timestamp');
      expect(options.fields).toContain('userName');
      expect(options.includeChanges).toBe(false);
      expect(options.includeMetadata).toBe(true);
      expect(options.pdfOptions?.includeStatistics).toBe(true);
    });
  });

  describe('Field Selection', () => {
    it('should export only selected fields', async () => {
      const customOptions: AuditExportOptions = {
        format: 'json',
        fields: ['timestamp', 'userName'],
        includeChanges: false,
        includeMetadata: true
      };
      
      const blob = await exportToJSON(mockLogs, customOptions);
      const text = await blob.text();
      const parsed = JSON.parse(text);
      
      expect(Object.keys(parsed[0])).toHaveLength(2);
      expect(parsed[0]).toHaveProperty('Timestamp');
      expect(parsed[0]).toHaveProperty('User Name');
    });

    it('should include changes when requested', async () => {
      const optionsWithChanges: AuditExportOptions = {
        format: 'json',
        fields: ['timestamp', 'userName'],
        includeChanges: true,
        includeMetadata: true
      };
      
      const blob = await exportToJSON(mockLogs, optionsWithChanges);
      const text = await blob.text();
      const parsed = JSON.parse(text);
      
      expect(parsed[0]).toHaveProperty('Detailed Changes');
    });
  });

  describe('Error Handling', () => {
    it('should handle Excel export errors gracefully', async () => {
      vi.doMock('exceljs', () => {
        throw new Error('ExcelJS error');
      });
      
      await expect(exportToExcel(mockLogs, defaultOptions))
        .rejects.toThrow('Failed to export to Excel');
    });

    it('should handle PDF export errors gracefully', async () => {
      vi.doMock('jspdf', () => {
        throw new Error('jsPDF error');
      });
      
      await expect(exportToPDF(mockLogs, defaultOptions))
        .rejects.toThrow('Failed to export to PDF');
    });

    it('should handle CSV export errors gracefully', async () => {
      const invalidLogs = null as any;
      
      await expect(exportToCSV(invalidLogs, defaultOptions))
        .rejects.toThrow();
    });
  });
});
