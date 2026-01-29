import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn'; // Using cn if available, or just template literals in code

// Defined here or imported from types
export interface ColumnDef<T> {
    key: string;
    header: string; // "header" is the standard, "label" is legacy alias
    sortable?: boolean;
    render?: (row: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
    mobileLabel?: string;
    hiddenOnMobile?: boolean;
}

export interface TableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    isLoading?: boolean;
    loading?: boolean; // alias
    emptyMessage?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    onRowClick?: (row: T) => void;
    className?: string;
    stickyHeader?: boolean;
    striped?: boolean;
    hoverable?: boolean;
    compact?: boolean;
    rowKey?: string | ((row: T) => string); // For key extraction
}

export function Table<T extends Record<string, any>>({
    data,
    columns,
    isLoading = false,
    loading = false,
    emptyMessage = 'No data available',
    searchable = false,
    searchPlaceholder = 'Search...',
    onRowClick,
    className = '',
    stickyHeader = false,
    striped = false,
    hoverable = true,
    compact = false,
    rowKey = 'id',
}: TableProps<T>) {
    const isBusy = isLoading || loading;
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    // Helper to get row key
    const getRowKey = (row: T, index: number): string => {
        if (typeof rowKey === 'function') return rowKey(row);
        return (row[rowKey] as string) || String(index);
    };

    // Sorting logic
    const sortedData = useMemo(() => {
        if (!sortKey) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (aVal === bVal) return 0;

            const comparison = aVal < bVal ? -1 : 1;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [data, sortKey, sortOrder]);

    // Search/filter logic
    const filteredData = useMemo(() => {
        if (!searchTerm) return sortedData;

        return sortedData.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [sortedData, searchTerm]);

    // Handle sort
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (key: string) => {
        if (sortKey !== key) return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
        return sortOrder === 'asc'
            ? <ChevronUp className="w-4 h-4 text-blue-600" />
            : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    const paddingClasses = compact ? 'px-3 py-2' : 'px-6 py-4';

    return (
        <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
            {/* Search Bar */}
            {searchable && (
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className={`bg-gray-50 border-b border-gray-200 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    style={{ width: column.width }}
                                    className={`
                    ${paddingClasses}
                    text-xs font-semibold text-gray-600 uppercase tracking-wider
                    ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                    ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
                  `}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{column.header}</span>
                                        {column.sortable && getSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isBusy ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Search className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row, rowIndex) => (
                                <tr
                                    key={getRowKey(row, rowIndex)}
                                    className={`
                    ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                    ${hoverable ? 'hover:bg-gray-100' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    transition-colors duration-150
                  `}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`
                        ${paddingClasses}
                        text-sm text-gray-900
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                      `}
                                        >
                                            {column.render ? column.render(row) : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
                {isBusy ? (
                    <div className="px-6 py-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Loading...</p>
                        </div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">{emptyMessage}</p>
                        </div>
                    </div>
                ) : (
                    filteredData.map((row, rowIndex) => (
                        <div
                            key={getRowKey(row, rowIndex)}
                            className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-100' : ''}`}
                            onClick={() => onRowClick?.(row)}
                        >
                            {columns.filter(col => !col.hiddenOnMobile).map((column) => (
                                <div key={column.key} className="flex justify-between items-start py-2">
                                    <span className="text-sm font-medium text-gray-600">
                                        {column.mobileLabel || column.header}
                                    </span>
                                    <span className="text-sm text-gray-900 text-right ml-4">
                                        {column.render ? column.render(row) : row[column.key]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Footer with count */}
            {!isBusy && filteredData.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-medium">{filteredData.length}</span> of{' '}
                        <span className="font-medium">{data.length}</span> results
                    </p>
                </div>
            )}
        </div>
    );
}
