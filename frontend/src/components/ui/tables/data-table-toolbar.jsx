'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableColumnToggle } from './data-table-column-toggle';

import { Plus } from 'lucide-react';

export function DataTableToolbar({
  table,
  onAdd,
  addButtonText,
  filterColumnId,
  filterColumnPlaceholder,
}) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const filtersConfig = table.options.meta?.filtersConfig;

  return (
    // The main toolbar container. It wraps its direct children and justifies space between them.
    <div
      role="toolbar"
      className="flex flex-1 flex-row flex-wrap justify-end items-end gap-2"
    >
      {/* Search Input: On small screens it grows, on larger screens it has a fixed width. */}

      {/* Filters Group */}
      <div className="flex gap-1 order-1 sm:order-2 min-w-full sm:min-w-0 justify-end">
        {!!isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="px-2 flex"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
        {filtersConfig?.map((filter) => (
          <DataTableFacetedFilter
            key={filter.columnId}
            column={table.getColumn(filter.columnId)}
            title={filter.title}
            options={filter.options}
          />
        ))}
      </div>
      <div className="flex flex-1 order-2 sm:order-1 min-w-100px justify-start">
        {/* Search Input */}
        {!!filterColumnId && (
          <Input
            placeholder={
              filterColumnPlaceholder || `Filter ${filterColumnId}...`
            }
            value={table.getColumn(filterColumnId)?.getFilterValue() ?? ''}
            onChange={(event) =>
              table
                .getColumn(filterColumnId)
                ?.setFilterValue(event.target.value)
            }
            className="flex max-w-[300px]"
          />
        )}
      </div>
      <div className="flex justify-end items-center gap-2 order-3">
        {/* View Toggle and Add Button Group */}
        <DataTableColumnToggle table={table} />
        {!!onAdd && !!addButtonText && (
          <Button
            role="button"
            onClick={onAdd}
            variant="default"
            size="sm"
          >
            <Plus className="h-4 w-4" /> {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
