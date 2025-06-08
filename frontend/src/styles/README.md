# TaskMaster Pro Styling Architecture

## Overview
This directory contains the styling foundation for TaskMaster Pro, designed to be simple yet expandable for future features like theme switching.

## File Structure

```
src/styles/
├── colors.js      # Centralized color system
├── patterns.js    # Reusable styling patterns
├── utils.js       # Styling utility functions
└── README.md      # This file
```

## Usage Guidelines

### 1. Using Colors
```jsx
import { colors, statusColors } from '@/styles/colors';

// Use semantic colors
<div style={{ backgroundColor: colors.card }}>
  <span style={{ color: statusColors.completed }}>Done!</span>
</div>
```

### 2. Using Patterns
```jsx
import { layouts, components } from '@/styles/patterns';

// Use layout patterns
<div className={layouts.container}>
  <div className={components.card}>
    Content here
  </div>
</div>
```

### 3. Using Utilities
```jsx
import { cn, getStatusStyles } from '@/styles/utils';

// Combine classes conditionally
<div className={cn(
  'base-class',
  isActive && 'active-class',
  getStatusStyles(task.status)
)}>
```

## Component Styling Strategy

### When to use each approach:

1. **Tailwind Classes**: For simple, one-off styling
2. **Pattern Classes**: For repeated layout patterns
3. **CSS Variables**: For theme-able colors and values
4. **Utility Functions**: For dynamic/conditional styling

### Example Component Structure:
```jsx
import { layouts, components } from '@/styles/patterns';
import { cn, getStatusStyles } from '@/styles/utils';

function TaskCard({ task, className }) {
  return (
    <div className={cn(
      components.cardHover,
      layouts.flexBetween,
      getStatusStyles(task.status),
      className
    )}>
      {/* Content */}
    </div>
  );
}
```

## Future Expansion

### Adding Dark Theme:
1. Uncomment dark theme variables in `index.css`
2. Add theme toggle logic
3. Apply `dark` class to root element
4. Colors automatically switch via CSS variables

### Adding New Themes:
1. Add new color sets to CSS variables
2. Create theme switching logic
3. No component changes needed

## Best Practices

1. **Use semantic color names** instead of specific colors
2. **Prefer CSS variables** for theme-able properties
3. **Use utility functions** for complex conditional logic
4. **Keep components theme-agnostic** by using the color system
5. **Test with different themes** in mind (even if not implemented yet)
