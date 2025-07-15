/**
 * @file Shared setup utilities for ProjectListPage integration tests.
 */
import { screen, render, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import ProjectListPage from '@/pages/ProjectListPage';
import { setupPageTests } from '@/__tests__/helpers/integration-test-utils';
import {
  createAuthenticatedContext,
  createMockErrorContext,
} from '@/__tests__/helpers/mock-providers';
import AuthContext from '@/context/AuthContext';
import ErrorContext from '@/context/ErrorContext';
import * as projectApiService from '@/services/projectApiService';

// Mock the underlying API service to isolate the frontend.
// This is the boundary we are testing against.
jest.mock('@/services/projectApiService');

// Export common libraries and the mocked service for convenience in test files
export { screen, render, within, waitFor, projectApiService, setupPageTests };

/**
 * Renders the ProjectListPage with all necessary providers for integration testing.
 * This function handles the boilerplate of QueryClient, Routing, and Auth,
 * providing a flexible options object to override defaults for specific test cases.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient - The QueryClient instance.
 * @param {object} [options] - Optional configuration for the render.
 * @param {object} [options.authContext] - Overrides for the auth context value.
 * @param {object} [options.errorContext] - Overrides for the error context value.
 * @param {string} [options.initialRoute='/'] - The initial route for MemoryRouter.
 * @returns {import('@testing-library/react').RenderResult}
 */
export const renderProjectListPage = (
  queryClient,
  {
    authContext: authContextOverrides = {},
    errorContext: errorContextOverrides = {},
    initialRoute = '/',
  } = {}
) => {
  const authValue = createAuthenticatedContext(authContextOverrides);
  const errorValue = createMockErrorContext(errorContextOverrides);

  const ui = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={authValue}>
          <ErrorContext.Provider value={errorValue}>
            <Routes>
              {/* This path is now correct for the ProjectListPage */}
              <Route path="/" element={<ProjectListPage />} />
              <Route
                path="/projects/:projectId"
                element={<div>Mock Project Tasks Page</div>}
              />
            </Routes>
          </ErrorContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(ui);
};