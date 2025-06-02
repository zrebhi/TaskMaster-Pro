import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectList from '../../../../components/Projects/ProjectList';
import {
  renderWithMinimalProviders,
  createMockProject,
} from '../../../helpers/test-utils';

jest.mock('../../../../components/Projects/ProjectListItem', () => {
  return jest.fn(
    ({ project, onSelectProject, isActive, onEditClick, onDeleteClick }) => (
      <li
        data-testid={`project-item-${project.id}`}
        style={{ backgroundColor: isActive ? 'activebg' : 'inactivebg' }}
      >
        <span
          onClick={() => onSelectProject(project.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelectProject(project.id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          {project.name}
        </span>
        <div>
          {onEditClick ? <button onClick={() => onEditClick(project)}>Edit</button> : null}
          {onDeleteClick ? <button onClick={() => onDeleteClick(project.id, project.name)}>
              Delete
            </button> : null}
        </div>
      </li>
    )
  );
});

describe('ProjectList Unit Tests', () => {
  const mockProjects = [
    createMockProject({ id: '1', name: 'Project Alpha' }),
    createMockProject({ id: '2', name: 'Project Beta' }),
    createMockProject({ id: '3', name: 'Project Gamma' }),
  ];
  const mockOnSelectProject = jest.fn();
  const mockOnEditProject = jest.fn();
  const mockOnDeleteProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderProjectList = (props = {}) => {
    const defaultProps = {
      projects: mockProjects,
      onSelectProject: mockOnSelectProject,
      activeProjectId: null,
      onEditProject: mockOnEditProject,
      onDeleteProject: mockOnDeleteProject,
    };

    return renderWithMinimalProviders(
      <ProjectList {...defaultProps} {...props} />
    );
  };

  test('renders empty state message when no projects', () => {
    renderProjectList({ projects: [] });

    expect(
      screen.getByText('No projects yet. Create one to get started!')
    ).toBeInTheDocument();
  });

  test('renders empty state message when projects is null', () => {
    renderProjectList({ projects: null });

    expect(
      screen.getByText('No projects yet. Create one to get started!')
    ).toBeInTheDocument();
  });

  test('renders list of projects when projects provided', () => {
    const ProjectListItem = require('../../../../components/Projects/ProjectListItem');

    renderProjectList({ activeProjectId: '2' });

    expect(ProjectListItem).toHaveBeenCalledTimes(mockProjects.length);

    mockProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    });
  });

  test('passes correct props to ProjectListItem components', () => {
    const ProjectListItem = require('../../../../components/Projects/ProjectListItem');
    const activeId = '2';

    renderProjectList({ activeProjectId: activeId });

    expect(ProjectListItem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        project: mockProjects[0],
        onSelectProject: mockOnSelectProject,
        isActive: false,
        onEditClick: expect.any(Function),
        onDeleteClick: expect.any(Function),
      }),
      undefined
    );

    expect(ProjectListItem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        project: mockProjects[1],
        onSelectProject: mockOnSelectProject,
        isActive: true,
        onEditClick: expect.any(Function),
        onDeleteClick: expect.any(Function),
      }),
      undefined
    );

    expect(ProjectListItem).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        project: mockProjects[2],
        onSelectProject: mockOnSelectProject,
        isActive: false,
        onEditClick: expect.any(Function),
        onDeleteClick: expect.any(Function),
      }),
      undefined
    );
  });

  test('correctly identifies active project', () => {
    const activeId = '1';

    renderProjectList({ activeProjectId: activeId });

    const activeItem = screen.getByTestId(`project-item-${activeId}`);
    const inactiveItem = screen.getByTestId('project-item-2');

    expect(activeItem).toHaveStyle('background-color: activebg');
    expect(inactiveItem).toHaveStyle('background-color: inactivebg');
  });

  test('handles missing optional props gracefully', () => {
    const ProjectListItem = require('../../../../components/Projects/ProjectListItem');

    renderProjectList({
      onEditProject: undefined,
      onDeleteProject: undefined,
    });

    expect(ProjectListItem).toHaveBeenCalledWith(
      expect.objectContaining({
        project: expect.any(Object),
        onSelectProject: mockOnSelectProject,
        isActive: false,
        onEditClick: undefined,
        onDeleteClick: undefined,
      }),
      undefined
    );
  });

  test('renders with no active project selected', () => {
    renderProjectList({ activeProjectId: null });

    mockProjects.forEach((project) => {
      const item = screen.getByTestId(`project-item-${project.id}`);
      expect(item).toHaveStyle('background-color: inactivebg');
    });
  });
});
