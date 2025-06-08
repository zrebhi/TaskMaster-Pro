/**
 * Reusable styling patterns for TaskMaster Pro
 * 
 * These patterns provide consistent spacing, layouts, and component styles
 * across the application while remaining flexible for customization.
 */

// Layout patterns
export const layouts = {
  // Container patterns
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerTight: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Flex patterns
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',
  
  // Grid patterns
  gridAuto: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  gridResponsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
};

// Spacing patterns
export const spacing = {
  // Section spacing
  sectionY: 'py-8 md:py-12',
  sectionX: 'px-4 sm:px-6 lg:px-8',
  
  // Component spacing
  cardPadding: 'p-6',
  cardPaddingSmall: 'p-4',
  
  // Stack spacing
  stackSmall: 'space-y-2',
  stackMedium: 'space-y-4',
  stackLarge: 'space-y-6',
};

// Component patterns
export const components = {
  // Card patterns
  card: 'bg-card text-card-foreground rounded-lg border shadow-sm',
  cardHover: 'bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow',
  
  // Button patterns (extend shadcn buttons)
  buttonIcon: 'h-9 w-9 p-0',
  buttonSmall: 'h-8 px-3 text-sm',
  
  // Input patterns
  inputGroup: 'space-y-2',
  
  // Status badges
  badge: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  badgeSuccess: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  badgeWarning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  badgeError: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  badgeInfo: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

// Animation patterns
export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
};
