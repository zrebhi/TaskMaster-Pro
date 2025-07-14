export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', './jest.setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/*.test.jsx',
    '<rootDir>/src/**/*.test.js'
  ],

  // Ignore test utility files
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/helpers/(?!.*\\.test\\.(js|jsx|ts|tsx)$).*\\.(js|jsx|ts|tsx)$',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(js|jsx)',
    '!src/**/*.test.(js|jsx)',
    '!src/**/__tests__/**',
    '!src/main.jsx',
    '!src/**/*.mock.js',
  ],

  // Module name mapping
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/__tests__/$1',
  },

  // Test environment setup
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library|react-router-dom)).+\\.js$',
  ],
};
