/**
 * VIRTUALIZED LIST COMPONENT
 * 
 * Performance-optimized list component using react-window
 * for rendering large datasets (>100 items).
 * 
 * Only renders visible items in viewport, dramatically
 * improving performance for inventory, transactions, etc.
 * 
 * Usage:
 * ```tsx
 * <VirtualizedList
 *   items={materials}
 *   height={600}
 *   itemHeight={72}
 *   renderItem={({ item, index, style }) => (
 *     <div style={style}>
 *       <MaterialCard material={item} />
 *     </div>
 *   )}
 * />
 * ```
 */

import React from 'react';
// @ts-ignore - react-window types may not be available
import { FixedSizeList } from 'react-window';

interface ListChildComponentProps {
  index: number;
  style: React.CSSProperties;
}

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  width?: string | number;
  className?: string;
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
  }) => React.ReactNode;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  width = '100%',
  className = '',
  renderItem,
}: VirtualizedListProps<T>) {
  // Wrapper component for each row
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return <>{renderItem({ item, index, style })}</>;
  };

  return (
    <div className={className}>
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
        overscanCount={5} // Render 5 extra items above/below viewport for smooth scrolling
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

/**
 * VIRTUALIZED TABLE COMPONENT
 * 
 * Virtual scrolling for table rows
 * 
 * Usage:
 * ```tsx
 * <VirtualizedTable
 *   items={transactions}
 *   height={500}
 *   rowHeight={60}
 *   columns={[
 *     { key: 'date', label: 'Date', width: 150 },
 *     { key: 'description', label: 'Description', width: 300 },
 *     { key: 'amount', label: 'Amount', width: 120 },
 *   ]}
 *   renderCell={(item, column) => {
 *     if (column.key === 'amount') {
 *       return formatCurrency(item[column.key]);
 *     }
 *     return item[column.key];
 *   }}
 * />
 * ```
 */

interface TableColumn {
  key: string;
  label: string;
  width: number;
}

interface VirtualizedTableProps<T> {
  items: T[];
  height: number;
  rowHeight: number;
  columns: TableColumn[];
  renderCell: (item: T, column: TableColumn, index: number) => React.ReactNode;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

export function VirtualizedTable<T>({
  items,
  height,
  rowHeight,
  columns,
  renderCell,
  onRowClick,
  className = '',
}: VirtualizedTableProps<T>) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    
    return (
      <div 
        style={style} 
        className={`flex border-b border-gray-200 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
        onClick={() => onRowClick?.(item, index)}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-4 py-3 flex items-center text-sm"
          >
            {renderCell(item, column, index)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`${className} overflow-hidden`}>
      {/* Table Header */}
      <div className="flex bg-gray-100 border-b-2 border-gray-300 font-semibold text-sm text-gray-700">
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-4 py-3"
          >
            {column.label}
          </div>
        ))}
      </div>

      {/* Virtualized Rows */}
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={rowHeight}
        width={totalWidth}
        overscanCount={5}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

export default VirtualizedList;
