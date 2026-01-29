import { Table } from './Table';
import type { ColumnDef } from './Table';

/**
 * @deprecated ResponsiveTable is deprecated. Use Table component instead.
 * This adapter maps legacy props to the new Table API.
 */
export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  keyExtractor,
  ...props
}: any) {
  // Map ResponsiveTable columns (label) to Table columns (header)
  const mappedColumns = columns.map((col: any) => ({
    ...col,
    header: col.label, // Map label to header
  })) as ColumnDef<T>[];

  return <Table columns={mappedColumns} rowKey={keyExtractor} {...props} />;
}
