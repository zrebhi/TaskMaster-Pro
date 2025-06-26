'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';

/**
 * A reusable data table component powered by Tanstack Table.
 * @template TData
 * @template TValue
 * @param {object} props
 * @param {import("@tanstack/react-table").ColumnDef<TData, TValue>[]} props.columns - The column definitions for the table.
 * @param {TData[]} props.data - The data to be displayed in the table.
 * @param {{ onEdit?: (item: TData) => void, onDelete?: (item: TData) => void }} [props.meta] - Optional object to pass action handlers to the table.
 * @param {import("@tanstack/react-table").VisibilityState} [props.columnVisibility] - State object controlling column visibility.
 * @param {import("@tanstack/react-table").OnChangeFn<import("@tanstack/react-table").VisibilityState>} [props.onColumnVisibilityChange] - State setter for column visibility.
 * @param {(table: import("@tanstack/react-table").Table<TData>) => void} [props.onTableInstanceReady] - Callback to get the table instance.
 */
export function DataTable({
  columns,
  data,
  meta,
  onTableInstanceReady,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange: controlledOnColumnVisibilityChange,
}) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);

  const table = useReactTable({
    data,
    columns,
    meta, // Pass meta to useReactTable
    state: {
      sorting,
      columnVisibility: controlledColumnVisibility, // Use controlled state
      rowSelection,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 25, // Default page size from template
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: controlledOnColumnVisibilityChange, // Use controlled setter
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Call the callback prop with the table instance
  React.useEffect(() => {
    if (table && onTableInstanceReady) {
      onTableInstanceReady(table);
    }
  }, [table, onTableInstanceReady]);

  return (
    <div className="flex flex-col gap-4">
      {/* children prop removed */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* <DataTablePagination table={table} /> */}
    </div>
  );
}
