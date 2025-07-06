'use client';

import { flexRender } from '@tanstack/react-table';

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
 * This is now a "dumb" presentational component that receives a fully-configured table instance.
 * @template TData
 * @param {object} props
 * @param {import("@tanstack/react-table").Table<TData>} props.table - The Tanstack Table instance created by useReactTable.
 * @param {import("@tanstack/react-table").ColumnDef<TData>[]} props.columns - Used to determine the colspan for the "no results" row.
 */
export function DataTable({
  table,
  columns,
}) {

  return (
    <div className="flex flex-col gap-4">
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
                  data-completed={row.original.is_completed}
                  onClick={
                    table.options.meta?.onRowClick
                      ? (event) => table.options.meta.onRowClick(row, event)
                      : undefined
                  }
                  // Conditionally apply the cursor style for better UX
                  className=
                  {table.options.meta?.onRowClick ? 'cursor-pointer' : ''}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
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
