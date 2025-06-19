'use client';

import { DataTableColumnToggle } from './data-table-column-toggle';

export function DataTableToolbar({ table, columnVisibility }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Add filtering inputs here in the future if needed */}
      </div>
      <DataTableColumnToggle table={table} columnVisibility={columnVisibility} />
    </div>
  );
}
