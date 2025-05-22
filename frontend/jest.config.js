export default {
  testEnvironment: "jsdom", // Use jsdom for React components
  setupFilesAfterEnv: ["@testing-library/jest-dom", "./jest.setup.js"], // Adds jest-dom's custom matchers and polyfills
  moduleNameMapper: {
    // Handle CSS imports (if you import CSS in your components)
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // Handle static asset imports (e.g., images)
    // "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest", // Use babel-jest to transpile tests
  },
  // Ignore transformations for node_modules except for specific ES modules if needed
  transformIgnorePatterns: [
    "/node_modules/(?!(@testing-library|react-router-dom)).+\\.js$",
  ],
};
