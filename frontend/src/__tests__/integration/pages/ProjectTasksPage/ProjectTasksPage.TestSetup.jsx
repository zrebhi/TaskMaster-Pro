/**
 * @file Shared setup utilities for ProjectTasksPage integration tests.
 * This file exports custom render functions and common test setup logic
 * to be used across all test suites for this page.
 */
import {
  screen,
  render,
  within,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'jest-axe';
import 'jest-axe/extend-expect';
import { QueryClientProvider } from '@tanstack/react-query';

import ProjectTasksPage from '@/pages/ProjectTasksPage';
import {
  waitForElementToBeRemoved,
  createMockApiError,
} from '@/__tests__/helpers/test-utils';
import { setupPageTests } from '@/__tests__/helpers/integration-test-utils';
import {
  createAuthenticatedContext,
  createMockErrorContext,
} from '@/__tests__/helpers/mock-providers';

// Import the actual providers and contexts needed for integration tests
import AuthContext from '@/context/AuthContext';
import ErrorContext from '@/context/ErrorContext';
import * as taskApiService from '@/services/taskApiService';
import * as projectApiService from '@/services/projectApiService';

// Mock the underlying API service to isolate the frontend.
jest.mock('@/services/taskApiService');
jest.mock('@/services/projectApiService');

// Export common libraries so you don't have to import them in every test file
export {
  screen,
  within,
  waitFor,
  userEvent,
  fireEvent,
  axe,
  waitForElementToBeRemoved,
  createMockApiError,
  taskApiService,
  projectApiService,
  setupPageTests,
};

export const renderProjectTasksPage = (
  queryClient,
  {
    errorContext: errorContextOverrides = {},
    authContext: authContextOverrides = {},
    initialRoute = '/projects/proj-1',
  } = {}
) => {
  const authValue = createAuthenticatedContext(authContextOverrides);
  const errorValue = createMockErrorContext(errorContextOverrides);

  // The UI now uses the *real* providers, isolated by the mocked API service
  const ui = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={authValue}>
          <ErrorContext.Provider value={errorValue}>
            <Routes>
              <Route
                path="/projects/:projectId"
                element={<ProjectTasksPage />}
              />
            </Routes>
          </ErrorContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui);
};
