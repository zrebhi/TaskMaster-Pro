'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu';

// The component is now a pure wrapper. It only provides the menu structure.
export function DataTableRowActions({ children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      {/* The specific actions are passed in from the parent */}
      <DropdownMenuContent align="end" className="w-[180px]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
