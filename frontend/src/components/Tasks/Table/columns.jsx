'use client';

// import { Checkbox } from "@/components/ui/checkbox"
import { statuses } from '@/data/taskUIData';
import { DataTableColumnHeader } from '@/components/ui/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/tables/data-table-row-actions';
import EditablePriorityCell from './EditablePriorityCell';
import EditableDueDateCell from './EditableDueDateCell';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Undo2, Check } from 'lucide-react';

/** @file Defines the column structure for the Tasks data table. */

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
      const task = row.original;
      
      if (!status) {
        return null;
      }

      const handleStatusClick = (e) => {
        e.stopPropagation();
        table.options.meta?.onPatchTask(task.id, {
          is_completed: !task.is_completed,
        });
      };

      return (
        <Button
          variant="ghost"
          onClick={handleStatusClick}
          // className="flex w-[100px] items-center gap-2 rounded-md text-left hover:bg-muted transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          className="justify-start flex"
          aria-label={`Toggle status for ${row.original.title}. Current status: ${status.label}`}
        >
          {!!status.icon && task.is_completed ? (
            <>
              <status.icon className="text-success h-4 w-4" />
              <span className="capitalize text-success">{status.label}</span>
            </>
          ) : (
            <>
              <status.icon className="text-muted-foreground h-4 w-4" />
              <span className="capitalize text-muted-foreground">{status.label}</span>
            </>
          )}
        </Button>
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
    cell: EditablePriorityCell,
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
    cell: EditableDueDateCell,
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
