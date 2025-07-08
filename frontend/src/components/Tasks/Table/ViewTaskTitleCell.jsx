import { Button } from '@/components/ui/button';

const ViewTaskTitleCell = ({ row, table }) => {
  const { meta } = table.options;

  const handleViewTask = (e) => {
    // Stop propagation to prevent any other row/cell click handlers
    // that might exist now or in the future.
    e.stopPropagation();
    meta.onViewTask?.(row.original);
  };

  return (
    <Button
      variant="link"
      onClick={handleViewTask}
      // Ensure the button doesn't add extra padding and aligns text left
      className="w-full flex justify-start"
      title={`View details for ${row.getValue('title')}`}
    >
      <span className="max-w-[300px] md:max-w-[400px] truncate">
        {row.getValue('title')}
      </span>
    </Button>
  );
};

export default ViewTaskTitleCell;