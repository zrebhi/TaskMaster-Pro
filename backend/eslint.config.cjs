const globals = require('globals');
const pluginJs = require('@eslint/js');
const pluginJest = require('eslint-plugin-jest');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  // 1. Global Ignores
  {
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      'build/',
      '*.min.js',
      '.*', // Ignores files/dirs starting with a dot (e.g. .husky, .env, .git)
      '*.log',
      // Add any other backend-specific files/folders to ignore,
      // e.g. "public/" if serving static files not needing linting
    ],
  },

  // 2. Main JavaScript Configuration (Node.js)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs', // Backend typically uses CommonJS unless "type": "module" in package.json
      globals: {
        ...globals.node, // Node.js global variables
        ...globals.es2022, // Modern ECMAScript globals
        process: 'readonly', // Make process.env available
      },
    },
    rules: {
      ...pluginJs.configs.recommended.rules, // Base ESLint recommended rules

      // Consistent with frontend overrides/preferences where applicable
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': [
        'warn', // Consistent with frontend; 'error' is also common for backend
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn', // Consistent with frontend
      'no-duplicate-imports': 'error', // For ES modules; harmless if primarily CJS
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'dot-notation': 'warn',

      // Additional good practices for backend/Node.js (from core ESLint)
      radix: 'error', // require radix parameter for parseInt()
      'no-throw-literal': 'error', // throw Error objects, not literals
      'consistent-return': 'warn', // ensure all paths return a value if any do
      'no-empty-function': ['warn', { allow: ['methods'] }], // Allow empty methods (e.g. interface stubs)
      // 'no-shadow': ['warn', { builtinGlobals: true, hoist: 'all' }], // Can be noisy; enable if desired

      // Additional Node.js specific rules
      'no-process-exit': 'error', // Prevent process.exit() in production code
      'no-sync': 'warn', // Discourage synchronous methods
      'handle-callback-err': 'error', // Ensure callback errors are handled
      'no-mixed-requires': 'error', // Group require statements
      'no-new-require': 'error', // Prevent new require()
      'no-path-concat': 'error', // Use path.join() instead of string concatenation

      // Security-focused rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  // 2a. Middleware-specific overrides
  {
    files: ['**/middleware/**/*.js'],
    rules: {
      'consistent-return': 'off', // Middleware often has specific patterns (e.g. async functions, no return values)
    },
  },

  // 2b. Model loader files (e.g., models/index.js)
  {
    files: ['**/models/index.js'],
    rules: {
      'no-sync': 'off', // Model loaders often use sync methods for file system operations
    },
  },

  // 3. Jest Specific Configuration (for test files)
  {
    files: [
      '**/__tests__/**/*.js',
      '**/*.test.js',
      '**/*.spec.js',
      'jest.setup.js', // Common Jest setup file name
    ],
    plugins: {
      jest: pluginJest,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs', // Assuming test files are also CommonJS
      globals: {
        ...globals.node, // For any Node utilities used in tests
        ...globals.jest, // Jest specific globals (describe, test, expect, etc.)
        ...globals.es2022,
      },
    },
    rules: {
      ...pluginJest.configs.recommended.rules, // Recommended Jest rules
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',

      // Overrides for test files
      'no-console': 'off', // Allow console.log in tests
      'no-unused-vars': 'warn', // More lenient for unused vars in tests (e.g. stubs)
      'no-empty-function': 'off', // Stubs or pending tests might be empty
      'consistent-return': 'off', // Test logic might not always need consistent returns
    },
  },

  // 4. Configuration files (e.g., this eslint.config.js, database configs)
  {
    files: [
      'eslint.config.js', // This file itself
      '*.config.js', // General config files (e.g. jest.config.js)
      'config/**/*.js', // Configuration directory
      '**/knexfile.js', // Knex.js database configuration
      '**/db/seeds/**/*.js', // Database seeder scripts
      '**/db/migrations/**/*.js', // Database migration scripts
      'jest.setup.js', // Jest setup files
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      'no-console': 'off', // Config/scripts often use console output
      'no-process-exit': 'off', // Config files may need to exit on errors
      'no-sync': 'off', // Config files often use sync methods for simplicity
    },
  },

  // 5. Prettier Compatibility (MUST BE THE LAST CONFIGURATION)
  // This turns off all ESLint rules that are unnecessary or might conflict with Prettier.
  eslintConfigPrettier,
];
