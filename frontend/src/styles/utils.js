/**
 * Styling utility functions for TaskMaster Pro
 * 
 * These utilities help maintain consistency and provide
 * reusable logic for common styling patterns.
 */

/**
 * Combines class names conditionally
 * Simple alternative to clsx for basic use cases
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get status-based styling
 */
export function getStatusStyles(status) {
  const statusMap = {
    todo: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
  };
  
  return statusMap[status] || statusMap.todo;
}

/**
 * Get priority-based styling
 */
export function getPriorityStyles(priority) {
  const priorityMap = {
    low: 'bg-gray-100 text-gray-600 border-gray-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  };
  
  return priorityMap[priority] || priorityMap.low;
}

/**
 * Generate responsive grid classes based on item count
 */
export function getResponsiveGrid(itemCount) {
  if (itemCount <= 1) return 'grid grid-cols-1';
  if (itemCount <= 2) return 'grid grid-cols-1 md:grid-cols-2';
  if (itemCount <= 3) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
}

/**
 * Get consistent spacing classes
 */
export function getSpacing(size = 'medium') {
  const spacingMap = {
    small: 'gap-2 p-3',
    medium: 'gap-4 p-4',
    large: 'gap-6 p-6',
  };
  
  return spacingMap[size] || spacingMap.medium;
}
