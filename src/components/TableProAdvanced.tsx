/**
 * TableProAdvanced - Advanced Table Features Extension
 * 
 * Additional features for TablePro:
 * - Pagination
 * - Column visibility toggle
 * - Export to CSV/Excel
 * - Advanced filtering
 * - Bulk actions
 * - Row selection
 * 
 * @component
 */

import { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Filter,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react';
import { ButtonPro } from './ButtonPro';
import { BadgePro } from './BadgePro';
import { ModalPro } from './ModalPro';
import type { ColumnDef } from './TablePro';

export interface TableProAdvancedProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  
  /** Pagination */
  pagination?: {
    pageSize?: number;
    pageSizeOptions?: number[];
  };
  
  /** Export */
  exportable?: boolean;
  exportFileName?: string;
  
  /** Column visibility */
  columnToggle?: boolean;
  
  /** Bulk actions */
  bulkActions?: boolean;
  onBulkDelete?: (selected: T[]) => void;
  customBulkActions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (selected: T[]) => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  
  /** Row selection */
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;
  
  /** Row identifier key */
  rowKey?: keyof T;
}

export function useTableAdvanced<T extends Record<string, any>>(
  props: TableProAdvancedProps<T>
) {
  const {
    data,
    columns,
    pagination,
    selectable = false,
    selectedRows: controlledSelected,
    onSelectionChange,
    rowKey = 'id' as keyof T,
  } = props;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((col) => col.key))
  );

  // Selection state
  const [selectedRows, setSelectedRows] = useState<T[]>(controlledSelected || []);

  // Modal states
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return data;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize, pagination]);

  // Visible columns
  const activeColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  // Pagination info
  const totalPages = Math.ceil(data.length / pageSize);
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, data.length);

  // Toggle column visibility
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Select/deselect row
  const toggleRowSelection = (row: T) => {
    const newSelected = selectedRows.some((r) => r[rowKey] === row[rowKey])
      ? selectedRows.filter((r) => r[rowKey] !== row[rowKey])
      : [...selectedRows, row];
    
    setSelectedRows(newSelected);
    onSelectionChange?.(newSelected);
  };

  // Select all visible rows
  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
      onSelectionChange?.([]);
    } else {
      setSelectedRows(paginatedData);
      onSelectionChange?.(paginatedData);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRows([]);
    onSelectionChange?.([]);
  };

  // Export to CSV
  const exportToCSV = (filename: string = 'export.csv') => {
    const headers = activeColumns.map((col) => col.header);
    const rows = data.map((row) =>
      activeColumns.map((col) => {
        const value = row[col.key];
        return typeof value === 'object' ? JSON.stringify(value) : value;
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Export to Excel (simplified CSV with .xlsx extension)
  const exportToExcel = (filename: string = 'export.xlsx') => {
    exportToCSV(filename);
  };

  return {
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    startRow,
    endRow,
    paginatedData,
    
    // Columns
    activeColumns,
    visibleColumns,
    toggleColumn,
    
    // Selection
    selectedRows,
    toggleRowSelection,
    toggleSelectAll,
    clearSelection,
    isRowSelected: (row: T) => selectedRows.some((r) => r[rowKey] === row[rowKey]),
    allSelected: selectedRows.length === paginatedData.length && paginatedData.length > 0,
    
    // Export
    exportToCSV,
    exportToExcel,
    
    // Modals
    showColumnModal,
    setShowColumnModal,
    showFilterModal,
    setShowFilterModal,
  };
}

/**
 * Table Toolbar Component
 */
export function TableToolbar<T>({
  selectedCount,
  onClearSelection,
  onExportCSV,
  onExportExcel,
  onToggleColumns,
  onToggleFilters,
  bulkActions,
  customBulkActions,
}: {
  selectedCount: number;
  onClearSelection: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onToggleColumns?: () => void;
  onToggleFilters?: () => void;
  bulkActions?: boolean;
  customBulkActions?: TableProAdvancedProps<T>['customBulkActions'];
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 bg-gray-50">
      {/* Left: Selection Info */}
      <div className="flex items-center gap-3">
        {selectedCount > 0 ? (
          <>
            <BadgePro variant="primary">
              {selectedCount} selected
            </BadgePro>
            <ButtonPro
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              Clear
            </ButtonPro>
            
            {/* Bulk Actions */}
            {bulkActions && (
              <div className="flex items-center gap-2 border-l pl-3 ml-3">
                {customBulkActions?.map((action, idx) => (
                  <ButtonPro
                    key={idx}
                    variant={action.variant || 'secondary'}
                    size="sm"
                    icon={action.icon}
                    onClick={action.onClick as any}
                  >
                    {action.label}
                  </ButtonPro>
                ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-sm text-gray-600">No rows selected</span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {onToggleFilters && (
          <ButtonPro
            variant="ghost"
            size="sm"
            icon={Filter}
            onClick={onToggleFilters}
          >
            Filters
          </ButtonPro>
        )}
        
        {onToggleColumns && (
          <ButtonPro
            variant="ghost"
            size="sm"
            icon={Settings2}
            onClick={onToggleColumns}
          >
            Columns
          </ButtonPro>
        )}

        {(onExportCSV || onExportExcel) && (
          <div className="flex items-center gap-1 border-l pl-2 ml-2">
            {onExportCSV && (
              <ButtonPro
                variant="outline"
                size="sm"
                icon={FileText}
                onClick={onExportCSV}
              >
                CSV
              </ButtonPro>
            )}
            {onExportExcel && (
              <ButtonPro
                variant="outline"
                size="sm"
                icon={Download}
                onClick={onExportExcel}
              >
                Excel
              </ButtonPro>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pagination Component
 */
export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  startRow,
  endRow,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  startRow: number;
  endRow: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50">
      {/* Left: Rows info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Showing {startRow} to {endRow} of {totalRows} rows
        </span>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Pagination controls */}
      <div className="flex items-center gap-2">
        <ButtonPro
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          icon={ChevronsLeft}
        />
        <ButtonPro
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          icon={ChevronLeft}
        />
        
        <span className="px-4 text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        
        <ButtonPro
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          icon={ChevronRight}
        />
        <ButtonPro
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          icon={ChevronsRight}
        />
      </div>
    </div>
  );
}

/**
 * Column Toggle Modal
 */
export function ColumnToggleModal({
  open,
  onClose,
  columns,
  visibleColumns,
  onToggleColumn,
}: {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef<any>[];
  visibleColumns: Set<string>;
  onToggleColumn: (key: string) => void;
}) {
  return (
    <ModalPro open={open} onClose={onClose} title="Manage Columns" size="sm">
      <div className="space-y-2">
        {columns.map((col) => {
          const isVisible = visibleColumns.has(col.key);
          return (
            <button
              key={col.key}
              onClick={() => onToggleColumn(col.key)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isVisible ? (
                <CheckSquare className="w-5 h-5 text-primary-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span className={`text-sm ${isVisible ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {col.header}
              </span>
            </button>
          );
        })}
      </div>
    </ModalPro>
  );
}

export default useTableAdvanced;
