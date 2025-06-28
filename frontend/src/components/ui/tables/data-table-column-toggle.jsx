'use client';

import { Columns, ChevronDown } from 'lucide-react';

import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export function DataTableColumnToggle({ table, columnVisibility = {} }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Columns className="size-3 sm:size-4" />
          View
          <ChevronDown className="size-3 sm:size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            const isChecked = columnVisibility[column.id] ?? true;
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={isChecked}
                onCheckedChange={() => {
                  column.toggleVisibility(!isChecked);
                }}
              >
                {column.columnDef.meta?.headerTitle || column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
