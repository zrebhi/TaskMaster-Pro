'use client';

import { Columns, CheckIcon, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// This component now mirrors the structure of DataTableFacetedFilter
export function DataTableColumnToggle({ table }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* The trigger button remains the same, providing a consistent look */}
        <Button variant="outline">
          <Columns className="size-3 sm:size-4" />
          View
          <ChevronDown className="size-3 sm:size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0" align="start">
        <Command shouldFilter={false}>
          {/* Input is required for keyboard nav but can be visually hidden */}
          <CommandInput className="sr-only" />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide()
                )
                .map((column) => {
                  const isSelected = column.getIsVisible();
                  return (
                    <CommandItem
                      key={column.id}
                      className="capitalize"
                      onSelect={() => column.toggleVisibility(!isSelected)}
                      aria-checked={isSelected}
                    >
                      <CheckIcon
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {column.columnDef.meta?.headerTitle || column.id}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
