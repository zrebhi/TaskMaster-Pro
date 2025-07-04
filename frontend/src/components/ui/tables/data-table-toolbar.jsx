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
    <div
      role="toolbar"
      className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2"
    >
      <div className="flex flex-1 items-center gap-2">
        {!!filterColumnId && (
          <Input
            placeholder={
              filterColumnPlaceholder || `Filter ${filterColumnId}...`
            }
            value={table.getColumn(filterColumnId)?.getFilterValue() ?? ''}
            onChange={(event) =>
              table.getColumn(filterColumnId)?.setFilterValue(event.target.value)
            }
            className="h-8 w-full sm:w-[200px] lg:w-[280px]"
          />
        )}
      </div>
      <div className="flex w-full sm:w-auto justify-end items-center gap-2 flex-wrap">
        <div className="flex justify-end items-end">
          {!!isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="-m-2"
            >
              Reset
              <Cross2Icon />
            </Button>
          )}
        </div>
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
        <DataTableColumnToggle table={table} />
        {!!onAdd && !!addButtonText && (
          <Button role="button" onClick={onAdd} variant="outline">
            <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
