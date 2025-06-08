import { render, renderHook, act } from '@testing-library/react';
import toast from 'react-hot-toast';
import { ErrorProvider, useError } from '../../../context/ErrorContext';
import { ERROR_SEVERITY } from '../../../utils/errorHandler';
import {
  createMockApiError,
  createMockNetworkError,
  setupTest,
  cleanupMocks,
} from '../../helpers/test-utils';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  mockToast.error = jest.fn();
  mockToast.success = jest.fn();
  return {
    __esModule: true,
    default: mockToast,
    error: mockToast.error,
    success: mockToast.success,
  };
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window event listeners
const mockAddEventListener = jest.spyOn(window, 'addEventListener');
const mockRemoveEventListener = jest.spyOn(window, 'removeEventListener');

// Test Helper Functions
const renderErrorHook = () => {
  return renderHook(() => useError(), {
    wrapper: ErrorProvider,
  });
};

const createTestError = (
  message = 'Test error',
  severity = ERROR_SEVERITY.MEDIUM
) => ({
  message,
  severity,
});

const expectToastCall = (mockFn, message, expectedOptions) => {
  expect(mockFn).toHaveBeenCalledWith(message, expectedOptions);
};

const advanceTimersAndExpect = (time, expectation) => {
  act(() => {
    jest.advanceTimersByTime(time);
  });
  expectation();
};

// Helper for testing toast functions with custom options
const testToastWithCustomOptions = (
  toastFn,
  message,
  customOptions,
  expectedToastMock
) => {
  const { result } = renderErrorHook();

  act(() => {
    result.current[toastFn](message, customOptions);
  });

  expect(expectedToastMock).toHaveBeenCalledWith(message, customOptions);
};

// Helper for adding multiple errors to test state
const addMultipleErrors = (result, errorCount = 2) => {
  const errorIds = [];
  act(() => {
    for (let i = 1; i <= errorCount; i++) {
      const errorId = result.current.addError({
        message: `Error ${i}`,
        severity: i === 1 ? ERROR_SEVERITY.LOW : ERROR_SEVERITY.MEDIUM,
      });
      errorIds.push(errorId);
    }
  });
  return errorIds;
};

describe('ErrorContext', () => {
  let testSetup;

  beforeEach(() => {
    testSetup = setupTest();
    navigator.onLine = true;
  });

  afterEach(() => {
    testSetup.cleanup();
    cleanupMocks();
  });

  describe('Initial State', () => {
    test('initializes with correct default values', () => {
      const { result } = renderErrorHook();

      expect(result.current.globalErrors).toEqual([]);
      expect(result.current.isOnline).toBe(true);
      expect(typeof result.current.addError).toBe('function');
      expect(typeof result.current.removeError).toBe('function');
      expect(typeof result.current.clearAllErrors).toBe('function');
      expect(typeof result.current.showErrorToast).toBe('function');
      expect(typeof result.current.showSuccess).toBe('function');
      expect(typeof result.current.showInfo).toBe('function');
    });

    test('initializes with isOnline true when navigator is undefined (SSR)', () => {
      const originalNavigator = global.navigator;
      delete global.navigator;

      const { result } = renderErrorHook();

      expect(result.current.isOnline).toBe(true);

      // Restore navigator
      global.navigator = originalNavigator;
    });
  });

  describe('Error Management', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('addError adds error to globalErrors with generated id and timestamp and returns error id', () => {
      const { result } = renderErrorHook();
      const errorInfo = createTestError('Test error', ERROR_SEVERITY.MEDIUM);

      let errorId;
      act(() => {
        errorId = result.current.addError(errorInfo);
      });

      expect(result.current.globalErrors).toHaveLength(1);
      expect(result.current.globalErrors[0]).toMatchObject({
        message: 'Test error',
        severity: ERROR_SEVERITY.MEDIUM,
      });
      expect(result.current.globalErrors[0].id).toBeDefined();
      expect(result.current.globalErrors[0].timestamp).toBeDefined();
      expect(errorId).toBeDefined();
      expect(result.current.globalErrors[0].id).toBe(errorId);
    });

    test('addError auto-removes error after timeout based on severity', () => {
      const { result } = renderErrorHook();

      act(() => {
        result.current.addError(
          createTestError('Test error', ERROR_SEVERITY.LOW)
        );
      });

      expect(result.current.globalErrors).toHaveLength(1);

      advanceTimersAndExpect(3000, () => {
        expect(result.current.globalErrors).toHaveLength(0);
      });
    });

    test('addError auto-removes error after 10 seconds for critical severity', () => {
      const { result } = renderErrorHook();

      act(() => {
        result.current.addError(
          createTestError('Critical error', ERROR_SEVERITY.CRITICAL)
        );
      });

      expect(result.current.globalErrors).toHaveLength(1);

      advanceTimersAndExpect(10000, () => {
        expect(result.current.globalErrors).toHaveLength(0);
      });
    });

    test('removeError removes specific error by id', () => {
      const { result } = renderErrorHook();

      const [errorId1, errorId2] = addMultipleErrors(result);

      expect(result.current.globalErrors).toHaveLength(2);

      act(() => {
        result.current.removeError(errorId1);
      });

      expect(result.current.globalErrors).toHaveLength(1);
      expect(result.current.globalErrors[0].id).toBe(errorId2);
    });

    test('removeError handles non-existent error id gracefully', () => {
      const { result } = renderErrorHook();

      let errorId;
      act(() => {
        errorId = result.current.addError({
          message: 'Test error',
          severity: ERROR_SEVERITY.LOW,
        });
      });

      expect(result.current.globalErrors).toHaveLength(1);

      // Remove the error first
      act(() => {
        result.current.removeError(errorId);
      });

      expect(result.current.globalErrors).toHaveLength(0);

      // Try to remove the same error again (timeout already cleared)
      act(() => {
        result.current.removeError(errorId);
      });

      // Should not throw error and state should remain unchanged
      expect(result.current.globalErrors).toHaveLength(0);
    });

    test('clearAllErrors removes all errors', () => {
      const { result } = renderErrorHook();

      addMultipleErrors(result);

      expect(result.current.globalErrors).toHaveLength(2);

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.globalErrors).toHaveLength(0);
    });

    test('addError uses default timeout for invalid severity', () => {
      const { result } = renderErrorHook();

      act(() => {
        result.current.addError({
          message: 'Error with invalid severity',
          severity: 'invalid-severity',
        });
      });

      expect(result.current.globalErrors).toHaveLength(1);

      // Should use default timeout of 5000ms
      advanceTimersAndExpect(5000, () => {
        expect(result.current.globalErrors).toHaveLength(0);
      });
    });

    test('cleans up timeouts on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderErrorHook();

      addMultipleErrors(result);

      expect(result.current.globalErrors).toHaveLength(2);

      // Unmount should clear all timeouts
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Provider Rendering', () => {
    test('ErrorProvider provides context values to children', () => {
      const TestComponent = () => {
        const context = useError();
        return (
          <div>
            <span data-testid="errors-count">
              {context.globalErrors.length}
            </span>
            <span data-testid="online-status">
              {context.isOnline.toString()}
            </span>
          </div>
        );
      };

      const { getByTestId } = render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      expect(getByTestId('errors-count')).toHaveTextContent('0');
      expect(getByTestId('online-status')).toHaveTextContent('true');
    });
  });

  describe('Hook Functionality', () => {
    test('useError throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useError());
      }).toThrow('useError must be used within an ErrorProvider');
    });
  });

  describe('Toast Integration', () => {
    test.each([
      {
        severity: ERROR_SEVERITY.LOW,
        message: 'Minor validation issue',
        expectedDuration: 3000,
        expectedStyle: { background: '#fbbf24', color: 'white' },
      },
      {
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Test error message',
        expectedDuration: 5000,
        expectedStyle: { background: '#f59e0b', color: 'white' },
      },
      {
        severity: ERROR_SEVERITY.HIGH,
        message: 'High priority error',
        expectedDuration: 8000,
        expectedStyle: { background: '#ef4444', color: 'white' },
      },
      {
        severity: ERROR_SEVERITY.CRITICAL,
        message: 'Critical system failure',
        expectedDuration: 10000,
        expectedStyle: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
        },
      },
      {
        severity: 'invalid-severity',
        message: 'Error with invalid severity',
        expectedDuration: 5000,
        expectedStyle: { background: '#ef4444', color: 'white' },
      },
    ])(
      'showErrorToast uses correct styling for $severity severity',
      ({ severity, message, expectedDuration, expectedStyle }) => {
        const { result } = renderErrorHook();

        const errorResult = {
          message,
          severity,
          isNetworkError: false,
        };

        act(() => {
          result.current.showErrorToast(errorResult);
        });

        expectToastCall(toast.error, message, {
          duration: expectedDuration,
          style: expectedStyle,
        });
      }
    );

    test('showErrorToast shows network message when offline and network error', () => {
      navigator.onLine = false;

      const { result } = renderErrorHook();

      const errorResult = {
        message: 'Test error message',
        severity: ERROR_SEVERITY.HIGH,
        isNetworkError: true,
      };

      act(() => {
        result.current.showErrorToast(errorResult);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'You appear to be offline. Please check your internet connection.',
        {
          duration: 8000,
          style: {
            background: '#ef4444',
            color: 'white',
          },
        }
      );
    });

    test('showSuccess calls toast.success with correct styling', () => {
      const { result } = renderErrorHook();

      act(() => {
        result.current.showSuccess('Success message');
      });

      expect(toast.success).toHaveBeenCalledWith('Success message', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
    });

    test('showInfo calls toast with correct styling', () => {
      const { result } = renderErrorHook();

      act(() => {
        result.current.showInfo('Info message');
      });

      expect(toast).toHaveBeenCalledWith('Info message', {
        duration: 4000,
        style: {
          background: '#3b82f6',
          color: 'white',
        },
      });
    });

    test('showErrorToast handles API error objects correctly', () => {
      const { result } = renderErrorHook();
      const apiError = createMockApiError(400, 'Validation failed', 'medium');

      act(() => {
        result.current.showErrorToast(apiError.processedError);
      });

      expect(toast.error).toHaveBeenCalledWith('Validation failed', {
        duration: 5000,
        style: {
          background: '#f59e0b',
          color: 'white',
        },
      });
    });

    test('showErrorToast handles network error objects correctly', () => {
      const { result } = renderErrorHook();
      const networkError = createMockNetworkError();

      act(() => {
        result.current.showErrorToast(networkError.processedError);
      });

      expectToastCall(
        toast.error,
        'Network error occurred. Please check your connection.',
        {
          duration: 8000,
          style: {
            background: '#ef4444',
            color: 'white',
          },
        }
      );
    });

    test('showErrorToast allows custom options override', () => {
      const { result } = renderErrorHook();
      const errorResult = {
        message: 'Test error',
        severity: ERROR_SEVERITY.MEDIUM,
        isNetworkError: false,
      };

      const customOptions = {
        duration: 1000,
        style: { background: 'red' },
      };

      act(() => {
        result.current.showErrorToast(errorResult, customOptions);
      });

      expect(toast.error).toHaveBeenCalledWith('Test error', {
        duration: 1000,
        style: { background: 'red' },
      });
    });

    test('showSuccess allows custom options override', () => {
      const customOptions = {
        duration: 1000,
        style: { background: 'green' },
      };

      testToastWithCustomOptions(
        'showSuccess',
        'Success message',
        customOptions,
        toast.success
      );
    });

    test('showInfo allows custom options override', () => {
      const customOptions = {
        duration: 1000,
        style: { background: 'blue' },
      };

      testToastWithCustomOptions(
        'showInfo',
        'Info message',
        customOptions,
        toast
      );
    });
  });

  describe('Network Monitoring', () => {
    test('sets up event listeners for online/offline events', () => {
      renderErrorHook();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });

    test.each([
      { eventType: 'online', initialState: false, expectedState: true },
      { eventType: 'offline', initialState: true, expectedState: false },
    ])(
      'updates isOnline state when $eventType event is triggered',
      ({ eventType, initialState, expectedState }) => {
        navigator.onLine = initialState;
        const { result } = renderErrorHook();

        expect(result.current.isOnline).toBe(initialState);

        act(() => {
          const handler = mockAddEventListener.mock.calls.find(
            (call) => call[0] === eventType
          )[1];
          handler();
        });

        expect(result.current.isOnline).toBe(expectedState);
      }
    );

    test('cleans up event listeners on unmount', () => {
      const { unmount } = renderErrorHook();

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });
  });
});
