//@ts-check
import { PlusCircledIcon } from '@radix-ui/react-icons';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

/**
 * @template TData
 * @template TValue
 * @param {{
 *   table: import("@tanstack/react-table").Table<TData>,
 *   column?: import("@tanstack/react-table").Column<TData, TValue>
 *   title?: string
 *   options: {
 *     label: string
 *     value: string
 *     icon?: React.ComponentType<{ className?: string }>
 *   }[]
 * }} props
 */
export function DataTableFacetedFilter({
  table,
  column,
  title,
  options
}) {
  const selectedValues = new Set(/** @type {string[]} */ (column?.getFilterValue()));

  const facets = useMemo(() => {
    const newFacets = new Map();
    if (!column) return newFacets;

    // We use the pre-filtered rows to calculate the facet counts.
    // This ensures that the counts reflect the entire dataset before this filter is applied.
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const value = row.getValue(column.id);
      newFacets.set(value, (newFacets.get(value) || 0) + 1);
    });

    return newFacets;
  }, [table, column]);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        <DropdownMenuLabel
          className="px-2 py-1.5 text-sm font-semibold"
          inset={false}
        >
          {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-muted" />
        {options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              checked={isSelected}
              onCheckedChange={() => {
                const newSelectedValues = new Set(selectedValues);
                if (isSelected) {
                  newSelectedValues.delete(option.value);
                } else {
                  newSelectedValues.add(option.value);
                }
                const filterValues = Array.from(newSelectedValues);
                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined
                );
              }}
              onSelect={(event) => event.preventDefault()}
            >
              <div className="flex w-full items-center">
                {!!option.icon && (
                  <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1">{option.label}</span>
                {!!facets?.get(option.value) && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                    {facets.get(option.value)}
                  </span>
                )}
              </div>
            </DropdownMenuCheckboxItem>
          );
        })}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-muted" />
            <DropdownMenuItem
              onSelect={() => column?.setFilterValue(undefined)}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 justify-center"
              inset={false}
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
