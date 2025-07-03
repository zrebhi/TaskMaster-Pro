// @ts-check
/**
 * @file Shared setup and render utilities for ProjectTasksPage integration tests.
 */
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import ProjectTasksPage from '@/pages/ProjectTasksPage';
import { TaskProvider } from '@/context/TaskContext';
import ProjectContext from '@/context/ProjectContext';
import AuthContext from '@/context/AuthContext';
import ErrorContext from '@/context/ErrorContext';

import {
  TestProviders,
  createAuthenticatedContext,
  createMockProjectContext,
  createMockTaskContext,
  createMockErrorContext,
} from './mock-providers';

/**
 * Renders the ProjectTasksPage with MOCKED context providers.
 * Ideal for testing component behavior without invoking real context logic,
 * focusing on props and callbacks.
 *
 * @param {object} [projectContextOverrides={}]
 * @param {object} [taskContextOverrides={}]
 * @returns {import('@testing-library/react').RenderResult & { rerenderWithState: (newTaskContext: object) => void }}
 */
export const renderWithMockContexts = (
  projectContextOverrides = {},
  taskContextOverrides = {}
) => {
  const authValue = createAuthenticatedContext();
  const projectValue = createMockProjectContext(projectContextOverrides);
  const taskValue = createMockTaskContext(taskContextOverrides);
  const errorValue = createMockErrorContext();

  const renderResult = render(
    <MemoryRouter initialEntries={['/projects/proj-1']}>
      <TestProviders
        authValue={authValue}
        projectValue={projectValue}
        taskValue={taskValue}
        errorValue={errorValue}
      >
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
        </Routes>
      </TestProviders>
    </MemoryRouter>
  );

  /**
   * Helper to simulate a state update by re-rendering with new context values.
   * @param {object} newTaskContext - The new task context overrides.
   */
  const rerenderWithState = (newTaskContext) => {
    const updatedTaskValue = createMockTaskContext(newTaskContext);
    renderResult.rerender(
      <MemoryRouter initialEntries={['/projects/proj-1']}>
        <TestProviders
          authValue={authValue}
          projectValue={projectValue}
          taskValue={updatedTaskValue}
          errorValue={errorValue}
        >
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
          </Routes>
        </TestProviders>
      </MemoryRouter>
    );
  };

  return { ...renderResult, rerenderWithState };
};

/**
 * Renders the ProjectTasksPage with the REAL TaskProvider.
 * Necessary for testing integrated async logic, especially error handling
 * that lives inside the actual context provider.
 *
 * @param {object} [projectContextOverrides={}]
 * @param {object} [errorContextOverrides={}]
 * @returns {import('@testing-library/react').RenderResult}
 */
export const renderWithRealTaskProvider = (
  projectContextOverrides = {},
  errorContextOverrides = {}
) => {
  const authValue = createAuthenticatedContext();
  const projectValue = createMockProjectContext(projectContextOverrides);
  const errorValue = createMockErrorContext(errorContextOverrides);

  return render(
    <MemoryRouter initialEntries={['/projects/proj-1']}>
      <AuthContext.Provider value={authValue}>
        <ErrorContext.Provider value={errorValue}>
          <ProjectContext.Provider value={projectValue}>
            <TaskProvider>
              <Routes>
                <Route
                  path="/projects/:projectId"
                  element={<ProjectTasksPage />}
                />
              </Routes>
            </TaskProvider>
          </ProjectContext.Provider>
        </ErrorContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};
