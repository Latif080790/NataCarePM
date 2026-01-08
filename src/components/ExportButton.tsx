/**
 * ExportButton - Reusable export button component with format dropdown
 * Phase 3: Feature Enhancement - Export capabilities
 * 
 * Usage:
 * <ExportButton 
 *   data={tableData} 
 *   filename="project-report" 
 *   title="Project Report"
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, ChevronDown } from 'lucide-react';
import { ButtonPro } from './ButtonPro';
import { useExport, ExportOptions } from '@/hooks/useExport';

type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json';

interface ExportButtonProps<T extends Record<string, unknown>> {
  /** Data to export */
  data: T[];
  /** Default filename (without extension) */
  filename?: string;
  /** PDF title */
  title?: string;
  /** PDF subtitle */
  subtitle?: string;
  /** Include statistics in export */
  includeStatistics?: boolean;
  /** Date range for filtering */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Available export formats */
  formats?: ExportFormat[];
  /** Size of button */
  size?: 'sm' | 'md' | 'lg';
  /** Variant of button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Custom class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show dropdown or direct export */
  mode?: 'dropdown' | 'direct';
  /** Default format for direct mode */
  defaultFormat?: ExportFormat;
  /** Callback after export */
  onExport?: (format: ExportFormat, success: boolean) => void;
}

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  excel: <FileSpreadsheet className="w-4 h-4" />,
  pdf: <FileText className="w-4 h-4" />,
  csv: <FileText className="w-4 h-4" />,
  json: <FileJson className="w-4 h-4" />,
};

const formatLabels: Record<ExportFormat, string> = {
  excel: 'Excel (.xlsx)',
  pdf: 'PDF (.pdf)',
  csv: 'CSV (.csv)',
  json: 'JSON (.json)',
};

export function ExportButton<T extends Record<string, unknown>>({
  data,
  filename,
  title,
  subtitle,
  includeStatistics = false,
  dateRange,
  formats = ['excel', 'pdf', 'csv'],
  size = 'sm',
  variant = 'outline',
  className = '',
  disabled = false,
  mode = 'dropdown',
  defaultFormat = 'excel',
  onExport,
}: ExportButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { exportExcel, exportPDF, exportCSV, exportJSON, isExporting, exportFormat } = useExport();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const exportOptions: ExportOptions = {
    filename,
    title,
    subtitle,
    includeStatistics,
    dateRange,
  };

  const handleExport = async (format: ExportFormat) => {
    setIsOpen(false);
    
    let result;
    switch (format) {
      case 'excel':
        result = await exportExcel(data, exportOptions);
        break;
      case 'pdf':
        result = await exportPDF(data, exportOptions);
        break;
      case 'csv':
        result = await exportCSV(data, exportOptions);
        break;
      case 'json':
        result = await exportJSON(data, exportOptions);
        break;
    }

    onExport?.(format, result.success);
  };

  const isButtonDisabled = disabled || data.length === 0 || isExporting;

  // Direct mode - single button with default format
  if (mode === 'direct') {
    return (
      <ButtonPro
        variant={variant}
        size={size}
        onClick={() => handleExport(defaultFormat)}
        disabled={isButtonDisabled}
        className={className}
        isLoading={isExporting}
        aria-label={`Export to ${formatLabels[defaultFormat]}`}
      >
        {formatIcons[defaultFormat]}
        <span className="ml-2">Export</span>
      </ButtonPro>
    );
  }

  // Dropdown mode - button with format selector
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <ButtonPro
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isButtonDisabled}
        isLoading={isExporting}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Export options"
      >
        <Download className="w-4 h-4" />
        <span className="ml-2 hidden sm:inline">Export</span>
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </ButtonPro>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          {formats.map((format) => (
            <button
              key={format}
              className={`
                w-full px-4 py-2 text-left text-sm flex items-center gap-3
                hover:bg-gray-100 dark:hover:bg-gray-700
                text-gray-700 dark:text-gray-300
                transition-colors duration-150
                ${exportFormat === format ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
              `}
              onClick={() => handleExport(format)}
              disabled={isExporting && exportFormat === format}
              role="menuitem"
            >
              {formatIcons[format]}
              <span>{formatLabels[format]}</span>
              {isExporting && exportFormat === format && (
                <span className="ml-auto">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Styled dropdown animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.15s ease-out;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('style[data-export-button]')) {
  style.setAttribute('data-export-button', 'true');
  document.head.appendChild(style);
}

export default ExportButton;
