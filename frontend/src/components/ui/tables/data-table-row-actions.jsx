"use client"

import { MoreHorizontal } from "lucide-react"

import { Button } from "../button" // Path relative to frontend/src/components/ui/tables/
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu" // Path relative to frontend/src/components/ui/tables/

// Props onEdit and onDelete will be passed down from the columns definition
export function DataTableRowActions({
  row,
  onEdit,
  onDelete,
}) {
  const task = row.original // Access the task data

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
      <DropdownMenuContent align="end" className="w-[160px] solid-popover-bg">
        <DropdownMenuItem onClick={() => onEdit && onEdit(task)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete && onDelete(task)}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}