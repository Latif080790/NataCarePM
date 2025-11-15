/**
 * Responsive Table Component
 * Automatically switches between table and card view based on screen size
 * Enterprise-grade solution for mobile-friendly data display
 */

import { memo, ReactNode, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Download, Filter } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  mobileLabel?: string; // Optional custom label for mobile view
  hiddenOnMobile?: boolean; // Hide column in mobile view
}

export interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  pageSize?: number;
  className?: string;
}

/**
 * Mobile Card View
 */
const MobileCard = memo<{
  row: any;
  columns: Column[];
  keyExtractor: (row: any) => string;
  onClick?: (row: any) => void;
}>(({ row, columns, keyExtractor, onClick }) => {
  const visibleColumns = columns.filter(col => !col.hiddenOnMobile);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-3 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
      }`}
      onClick={() => onClick?.(row)}
    >
      {visibleColumns.map((col, idx) => {
        const value = row[col.key];
        const displayValue = col.render ? col.render(value, row) : value;
        const label = col.mobileLabel || col.label;

        return (
          <div
            key={`${keyExtractor(row)}-${col.key}`}
            className={`flex justify-between items-start py-2 ${
              idx !== visibleColumns.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <span className="text-sm font-medium text-slate-600 mr-3">{label}:</span>
            <span className="text-sm text-slate-900 text-right flex-1">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
});

MobileCard.displayName = 'MobileCard';

/**
 * Desktop Table View
 */
const DesktopTable = memo<{
  data: any[];
  columns: Column[];
  keyExtractor: (row: any) => string;
  onRowClick?: (row: any) => void;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (key: string) => void;
}>(({ data, columns, keyExtractor, onRowClick, sortKey, sortDirection, onSort }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b-2 border-slate-200">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-sm font-semibold text-slate-700 ${
                  col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                }`}
                style={{ width: col.width }}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <div className="flex items-center space-x-2">
                  <span>{col.label}</span>
                  {col.sortable && sortKey === col.key && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={keyExtractor(row)}
              className={`border-b border-slate-100 transition-colors ${
                onRowClick
                  ? 'cursor-pointer hover:bg-blue-50'
                  : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => {
                const value = row[col.key];
                const displayValue = col.render ? col.render(value, row) : value;

                return (
                  <td key={`${keyExtractor(row)}-${col.key}`} className="px-4 py-3 text-sm text-slate-900">
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

DesktopTable.displayName = 'DesktopTable';

/**
 * Main Responsive Table Component
 */
function ResponsiveTableComponent<T = any>(props: ResponsiveTableProps<T>) {
  const {
    data,
    columns,
    keyExtractor,
    onRowClick,
    loading = false,
    emptyMessage = 'No data available',
    title,
    searchable = false,
    filterable = false,
    exportable = false,
    pageSize = 20,
    className = '',
  } = props;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle responsive breakpoint
  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm && searchable) {
      result = result.filter(row =>
        columns.some(col => {
          const value = (row as any)[col.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];

        if (aVal === bVal) return 0;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortKey, sortDirection, columns, searchable]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Handle export
  const handleExport = () => {
    const csv = [
      columns.map(col => col.label).join(','),
      ...processedData.map(row =>
        columns.map(col => {
          const value = (row as any)[col.key];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      {(title || searchable || filterable || exportable) && (
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
            
            <div className="flex flex-wrap items-center gap-2">
              {searchable && (
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {filterable && (
                <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  <Filter size={18} />
                  <span className="hidden md:inline">Filter</span>
                </button>
              )}
              
              {exportable && (
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download size={18} />
                  <span className="hidden md:inline">Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Display */}
      {paginatedData.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <p>{emptyMessage}</p>
        </div>
      ) : isMobile ? (
        <div className="p-4">
          {paginatedData.map(row => (
            <MobileCard
              key={keyExtractor(row)}
              row={row}
              columns={columns}
              keyExtractor={keyExtractor}
              onClick={onRowClick}
            />
          ))}
        </div>
      ) : (
        <DesktopTable
          data={paginatedData}
          columns={columns}
          keyExtractor={keyExtractor}
          onRowClick={onRowClick}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ResponsiveTable = memo(ResponsiveTableComponent) as typeof ResponsiveTableComponent;

