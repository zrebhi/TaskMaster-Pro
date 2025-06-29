'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
// import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableColumnToggle } from './data-table-column-toggle';

import { Plus } from 'lucide-react';

export function DataTableToolbar({ table, onAdd, addButtonText }) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const filtersConfig = table.options.meta?.filtersConfig;

  return (
    <div
      role="toolbar"
      className="flex flex-col sm:flex-row items-end gap-2"
    >
      <div className="hidden sm:flex sm:items-center space-x-2 items-end">
        {!!isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
        {filtersConfig?.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) {
            return null;
          }
          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableColumnToggle
          table={table}
        />
        {!!onAdd && !!addButtonText && (
          <Button role="button" onClick={onAdd} variant="outline">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" /> {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
