'use client';

import { Badge } from '../../ui/badge';
// import { Checkbox } from "../../ui/checkbox"
import { priorities, statuses } from '../../../data/taskUIData';
import { DataTableColumnHeader } from '../../ui/tables/data-table-column-header';
import { DataTableRowActions } from '../../ui/tables/data-table-row-actions';

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
      headerTitle: "Title",
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
      headerTitle: "Status",
    },
    cell: ({ row }) => {
      const status = statuses.find(
        (s) =>
          s.value.toLowerCase() ===
          (row.getValue('status')?.toLowerCase() || '')
      );

      if (!status) {
        return (
          <span className="capitalize">{row.getValue('status') || 'N/A'}</span>
        );
      }

      return (
        <div className="flex w-[100px] items-center gap-2">
          {status.icon ? (
            <status.icon className="text-muted-foreground h-4 w-4" />
          ) : null}
          <span className="capitalize">{status.label}</span>
        </div>
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
      headerTitle: "Priority",
    },
    cell: ({ row }) => {
      // Assuming priority is a number (1: Low, 2: Medium, 3: High)
      // and priorities array is structured like: [{ value: 1, label: "Low", icon: Comp}, ...]
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
          {/* Use Badge for visual consistency if desired */}
          <Badge
            variant={
              priority.value === 3
                ? 'destructive_table'
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
      headerTitle: "Due Date",
    },
    cell: ({ row }) => {
      const dueDate = row.getValue('due_date');
      return <div className="w-[100px]">{formatDate(dueDate)}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      // Access onEdit and onDelete from table.options.meta
      // This assumes they are passed to DataTable and then to table options
      const meta = table.options.meta;
      return (
        <DataTableRowActions
          row={row}
          onEdit={meta?.onEdit}
          onDelete={meta?.onDelete}
        />
      );
    },
    enableHiding: false, // Actions column should not be toggleable
  },
];
