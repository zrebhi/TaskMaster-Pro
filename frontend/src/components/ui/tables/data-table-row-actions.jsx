'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { cn } from '@/lib/utils';

// The component is now a pure wrapper. It only provides the menu structure.
export function DataTableRowActions({ children, className }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'data-[state=open]:bg-muted flex h-8 w-8 p-0',
            className
          )}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] project-actions-cell">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
