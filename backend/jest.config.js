module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'node',
  maxWorkers: 1,
  testTimeout: 10000,
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
};
