'use client';

import { DataTableColumnHeader } from '@/components/ui/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/tables/data-table-row-actions';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, ChevronRight } from 'lucide-react';

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
      // Remove the padding from the TableCell (the <td> element)
      // so our Link can span the entire cell area.
      cellClassName: 'p-0',
    },
    cell: ({ row }) => {
      return (
        // Use a Link for proper navigation semantics.
        // The Link now gets the padding, making the whole padded area clickable.
        // <Link
        //   to={`/projects/${row.original.id}`}
        //   className="flex items-center h-full w-full p-2 hover:underline underline md:no-underline"
        //   title={`View tasks for ${row.getValue('name')}`}
        // >
        <span className="flex items-center truncate h-full w-full p-2 max-w-[300px] md:max-w-[400px] underline md:no-underline">
          {row.getValue('name')}
        </span>
        // </Link>
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
    id: 'navigation',
    header: () => <span className="sr-only">Go to project</span>,
    meta: {
      cellClassName: 'w-[40px]', // Control column width
    },
    cell: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const project = row.original;
      const { meta } = table.options;

      // Determine if this specific row's menu should be open

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
    meta: {
      cellClassName: 'project-actions-cell',
    },
    enableHiding: false,
  },
];
