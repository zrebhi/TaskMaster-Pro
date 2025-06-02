// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'node',
  maxWorkers: 1,
  testTimeout: 10000,
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
