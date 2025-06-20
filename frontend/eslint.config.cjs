const globals = require('globals');
const pluginJs = require('@eslint/js'); // Recommended base rules from ESLint
const pluginReact = require('eslint-plugin-react');
const pluginReactHooks = require('eslint-plugin-react-hooks');
const pluginJsxA11y = require('eslint-plugin-jsx-a11y');
const pluginJest = require('eslint-plugin-jest');
const pluginReactRefresh = require('eslint-plugin-react-refresh');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  // 1. Global Ignores and Base Configuration
  {
    ignores: [
      'node_modules/',
      'build/',
      'dist/',
      'coverage/',
      '*.min.js',
      '.*',
      // Add any other specific files/folders to ignore
    ],
  },

  // 2. JavaScript Core Rules (Recommended by ESLint)
  pluginJs.configs.recommended,

  // 3. React Specific Configuration
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginJsxA11y,
      'react-refresh': pluginReactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
      },
      globals: {
        ...globals.browser, // Standard browser globals
        ...globals.es2022,
        process: 'readonly', // Common for accessing process.env.NODE_ENV
      },
      ecmaVersion: 'latest',
      sourceType: 'module', // React projects use ES modules
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
    rules: {
      // ESLint Core Rules (Adjustments/Additions for Frontend)
      'no-console': ['warn', { allow: ['warn', 'error', 'group', 'groupEnd'] }], // Allow warn/error
      'no-unused-vars': [
        'warn',
        {
          // Warn for unused vars, error in backend is stricter
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'no-duplicate-imports': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'dot-notation': 'warn',

      // React Plugin Rules (eslint-plugin-react)
      ...pluginReact.configs.recommended.rules, // Start with recommended React rules
      ...pluginReact.configs['jsx-runtime'].rules, // If using new JSX transform (React 17+)
      'react/prop-types': 'off', // Typically off if using TypeScript, can be 'warn' for JS
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ new JSX transform
      'react/jsx-uses-react': 'off', // Not needed with React 17+ new JSX transform
      'react/jsx-props-no-spreading': [
        'warn',
        {
          // Discourage prop spreading unless necessary
          html: 'enforce',
          custom: 'enforce',
          exceptions: [],
        },
      ],
      'react/jsx-filename-extension': [
        'warn',
        { extensions: ['.jsx', '.tsx'] },
      ], // Prefer .jsx/.tsx
      'react/self-closing-comp': 'warn',
      'react/display-name': 'off', // Can be noisy

      // React Hooks Plugin Rules (eslint-plugin-react-hooks)
      ...pluginReactHooks.configs.recommended.rules, // Essential for correct hook usage
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies in useEffect/useCallback etc.

      // JSX Accessibility Plugin Rules (eslint-plugin-jsx-a11y)
      ...pluginJsxA11y.configs.recommended.rules, // Start with recommended accessibility rules
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['to'],
          aspects: ['invalidHref', 'preferButton'],
        },
      ],
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          labelComponents: ['Label'],
          labelAttributes: ['htmlFor'],
          controlComponents: ['Input', 'Select', 'Textarea'],
          depth: 3,
        },
      ],

      // React Refresh (eslint-plugin-react-refresh)
      'react-refresh/only-export-components': 'warn',

      // React performance:
      'react/jsx-no-bind': [
        'warn',
        {
          allowArrowFunctions: true,
          allowBind: false,
          ignoreRefs: true,
        },
      ],
      'react/jsx-no-leaked-render': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unstable-nested-components': 'error',
    },
  },

  // 4. Jest Specific Configuration (for test files)
  {
    files: [
      '**/__tests__/**/*.js?(x)',
      '**/*.test.js?(x)',
      '**/*.spec.js?(x)',
      'jest.setup.js',
    ],
    plugins: {
      jest: pluginJest,
    },
    languageOptions: {
      ecmaVersion: 'latest', // Good to be explicit
      sourceType: 'module', // Test files are usually modules
      globals: {
        ...globals.browser, // Add browser globals for things like sessionStorage, console
        ...globals.node, // If any node specific things are used (less common in frontend tests)
        ...globals.jest, // Jest specific globals
      },
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'jest/expect-expect': [
        'warn',
        {
          assertFunctionNames: [
            'expect',
            'expectToastCall',
            'expectLoadingState',
            'expectErrorMessage',
            'expectSuccessMessage',
            'waitForElementToBeRemoved',
            'advanceTimersAndExpect',
            'testToastWithCustomOptions',
            'testModalOpenClose', 
            'setupProjectAndTaskFetchTest',
          ],
        },
      ],
      'no-console': 'off',
      'react/prop-types': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react-refresh/only-export-components': 'off', // Test files don't need fast refresh
    },
  },

  // 5. Context files - allow mixed exports (components + utilities)
  {
    files: ['**/context/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'ERROR_SEVERITY',
            'useError',
            'useAuth',
            'useProject',
          ],
        },
      ],
      // Context files often use refs in cleanup functions - this is safe
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  // 6. Shadcn UI components - relax rules for generated components
  {
    files: ['**/components/ui/**/*.{js,jsx}'],
    rules: {
      // Shadcn components rely on prop spreading for composability
      'react/jsx-props-no-spreading': 'off',
      // Allow mixed exports (components + utility functions like buttonVariants)
      'react-refresh/only-export-components': 'off',
    },
  },

  // 7. Form components - allow prop spreading for composable form components
  {
    files: [
      '**/components/Auth/**/*.{js,jsx}',
      '**/components/Projects/**/*.{js,jsx}',
      '**/components/Tasks/**/*.{js,jsx}',
    ],
    rules: {
      // Form components often forward props to shadcn Card/Dialog components for composability
      'react/jsx-props-no-spreading': 'off',
    },
  },

  // 8. Configuration files (if any in frontend, e.g., vite.config.js)
  {
    files: ['*.config.js', '*.config.mjs', '*.config.cjs'],
    languageOptions: {
      globals: {
        ...globals.node, // Config files might run in Node.js environment
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // THIS MUST BE LAST to override other formatting rules
  eslintConfigPrettier,
];
