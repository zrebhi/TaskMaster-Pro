import userEvent from '@testing-library/user-event';
import {
  setupTest,
  createTestQueryClient,
} from '@/__tests__/helpers/test-utils';

/**
 * Encapsulates common beforeEach/afterEach setup for integration tests.
 *
 * This function sets up Jest hooks to create a new `userEvent` instance and
 * a new `QueryClient` before each test, ensuring test isolation.
 *
 * @example
 * describe('My Component', () => {
 *   const testState = setupPageTests();
 *   beforeEach(() => { ... });
 * });
 */
export const setupPageTests = () => {
  const testState = {
    user: null,
    queryClient: null,
    cleanup: null,
  };

  beforeEach(() => {
    const { cleanup } = setupTest();
    testState.cleanup = cleanup;
    testState.user = userEvent.setup();
    testState.queryClient = createTestQueryClient();
  });

  afterEach(() => {
    if (testState.queryClient) {
      testState.queryClient.clear();
    }
    if (testState.cleanup) {
      testState.cleanup();
    }
  });

  return testState;
};
