import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProjectListItem from '@/components/Projects/ProjectListItem';
import {
  renderWithMinimalProviders,
  createMockProject,
} from '@/__tests__/helpers/test-utils';

describe('ProjectListItem Unit Tests', () => {
  let user;
  const mockProject = createMockProject({ id: '1', name: 'Test Project' });
  const mockOnSelectProject = jest.fn();
  const mockOnEditClick = jest.fn();
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  const renderProjectListItem = (props = {}) => {
    const defaultProps = {
      project: mockProject,
      onSelectProject: mockOnSelectProject,
      isActive: false,
      onEditClick: mockOnEditClick,
      onDeleteClick: mockOnDeleteClick,
    };

    return renderWithMinimalProviders(
      <ProjectListItem {...defaultProps} {...props} />
    );
  };

  test('renders project name correctly', () => {
    renderProjectListItem();

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  test('applies active styling when isActive is true', () => {
    renderProjectListItem({ isActive: true });

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveStyle('background-color: #e0e0e0');
  });

  test('does not apply active styling when isActive is false', () => {
    renderProjectListItem({ isActive: false });

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveStyle('background-color: transparent');
  });

  test('calls onSelectProject when project name is clicked', async () => {
    renderProjectListItem();

    const projectButton = screen.getByRole('button', { name: 'Test Project' });
    await user.click(projectButton);

    expect(mockOnSelectProject).toHaveBeenCalledWith('1');
  });

  test('calls onSelectProject when Enter key is pressed', async () => {
    renderProjectListItem();

    const projectButton = screen.getByRole('button', { name: 'Test Project' });
    projectButton.focus();
    await user.keyboard('{Enter}');

    expect(mockOnSelectProject).toHaveBeenCalledWith('1');
  });

  test('calls onSelectProject when Space key is pressed', async () => {
    renderProjectListItem();

    const projectButton = screen.getByRole('button', { name: 'Test Project' });
    projectButton.focus();
    await user.keyboard(' ');

    expect(mockOnSelectProject).toHaveBeenCalledWith('1');
  });

  test('renders edit button when onEditClick is provided', () => {
    renderProjectListItem();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  test('edit button always renders', () => {
    renderProjectListItem();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  test('calls onEditClick when edit button is clicked', async () => {
    renderProjectListItem();

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalledWith(mockProject);
  });

  test('renders delete button', () => {
    renderProjectListItem();

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('calls onDeleteClick when delete button is clicked', async () => {
    renderProjectListItem();

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledWith('1', 'Test Project');
  });

  test('renders all buttons correctly', () => {
    renderProjectListItem();

    expect(
      screen.getByRole('button', { name: 'Test Project' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('project name is accessible button', () => {
    renderProjectListItem();

    const projectButton = screen.getByRole('button', { name: 'Test Project' });
    expect(projectButton).toBeInTheDocument();
    expect(projectButton).toHaveStyle('cursor: pointer');
  });
});
