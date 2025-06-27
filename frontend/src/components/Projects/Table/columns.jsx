'use client';

import { DataTableColumnHeader } from '../../ui/tables/data-table-column-header';
import { DataTableRowActions } from '../../ui/tables/data-table-row-actions';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu';
import { Edit, Trash2 } from 'lucide-react';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

export const columns = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project Name" />
    ),
    meta: {
      headerTitle: 'Project Name',
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <div className="flex">
          <button
            className="text-left max-w-[300px] md:max-w-[400px] truncate font-medium hover:underline"
            onClick={() => meta?.onSelect(row.original.id)}
            title={`View tasks for ${row.getValue('name')}`}
          >
            {row.getValue('name')}
          </button>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creation Date" />
    ),
    meta: {
      headerTitle: 'Creation Date',
    },
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt');
      return <div className="w-[100px]">{formatDate(createdAt)}</div>;
    },
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const project = row.original;
      const meta = table.options.meta;

      return (
        <DataTableRowActions>
          <DropdownMenuItem onClick={() => meta?.onEdit(project)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => meta?.onDelete(project)}
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
