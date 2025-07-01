'use client';

import { Badge } from '../../ui/badge';
// import { Checkbox } from "../../ui/checkbox"
import { priorities, statuses } from '../../../data/taskUIData';
import { DataTableColumnHeader } from '../../ui/tables/data-table-column-header';
import { DataTableRowActions } from '../../ui/tables/data-table-row-actions';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu';
import { Edit, Trash2, Undo2, Check } from 'lucide-react';

/** @file Defines the column structure for the Tasks data table. */

// Helper function for formatting dates, can be moved to a utils file
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

export const columns = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && "indeterminate")
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    meta: {
      headerTitle: 'Title',
    },
    cell: ({ row }) => {
      return (
        <div className="flex">
          <span className="max-w-[300px] md:max-w-[400px] truncate font-medium">
            {row.getValue('title')}
          </span>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: {
      headerTitle: 'Status',
    },
    cell: ({ row, table }) => {
      const status = statuses.find(
        (s) => s.value === row.getValue('status')
      );

      if (!status) {
        return null;
      }

      const handleStatusClick = () => {
        const task = row.original;
        table.options.meta?.onPatchTask(task.id, {
          is_completed: !task.is_completed,
        });
      };

      return (
        <button
          type="button"
          onClick={handleStatusClick}
          className="flex w-[100px] items-center gap-2 rounded-md p-1 -ml-1 text-left hover:bg-muted transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Toggle status for ${row.original.title}. Current status: ${status.label}`}
        >
          {!!status.icon && (
            <status.icon className="text-muted-foreground h-4 w-4" />
          )}
          <span className="capitalize">{status.label}</span>
        </button>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableHiding: false,
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    meta: {
      headerTitle: 'Priority',
    },
    cell: ({ row }) => {
      const priorityValue = row.getValue('priority');
      const priority = priorities.find((p) => p.value === priorityValue);

      if (!priority) {
        // Fallback for numeric priorities if not found in the array
        if (priorityValue === 1) return <Badge variant="outline">Low</Badge>;
        if (priorityValue === 2) return <Badge variant="default">Medium</Badge>;
        if (priorityValue === 3)
          return <Badge variant="destructive_table">High</Badge>;
        return <span>{priorityValue || 'N/A'}</span>;
      }

      return (
        <div className="flex items-center gap-2">
          {/* {priority.icon && (
            <priority.icon className="text-muted-foreground h-4 w-4" />
          )} */}
          <Badge
            variant={
              priority.value === 3
                ? 'destructive'
                : priority.value === 1
                  ? 'outline'
                  : 'default'
            }
          >
            {priority.label}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'due_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    meta: {
      headerTitle: 'Due Date',
    },
    cell: ({ row }) => {
      const dueDate = row.getValue('due_date');
      return <div className="w-[100px]">{formatDate(dueDate)}</div>;
    },
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const task = row.original;
      const meta = table.options.meta;

      return (
        <DataTableRowActions>
          <DropdownMenuItem onClick={() => meta?.onEdit(task)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              meta?.onPatchTask(task.id, { is_completed: !task.is_completed })
            }
          >
            {task.is_completed ? (
              <Undo2 className="mr-2 h-4 w-4" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            <span>
              {task.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => meta?.onDelete(task)}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DataTableRowActions>
      );
    },
    enableHiding: false,
  },
];
