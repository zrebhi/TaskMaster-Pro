'use client';

import { DataTableColumnHeader } from '../../ui/tables/data-table-column-header';
import { DataTableRowActions } from '../../ui/tables/data-table-row-actions';

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
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <DataTableRowActions
          row={row}
          onEdit={meta?.onEdit}
          onDelete={meta?.onDelete}
        />
      );
    },
    enableHiding: false,
  },
];