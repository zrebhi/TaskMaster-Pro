import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProjectListItem from '../ProjectListItem';

describe('ProjectListItem', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project 1',
  };

  const mockOnSelectProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the project name', () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
      />
    );
    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
  });

  it('calls onSelectProject with project id when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
      />
    );
    const listItem = screen.getByText(mockProject.name);
    await user.click(listItem);
    expect(mockOnSelectProject).toHaveBeenCalledTimes(1);
    expect(mockOnSelectProject).toHaveBeenCalledWith(mockProject.id);
  });

  it('applies active styles when isActive is true', () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={true}
      />
    );
    const listItem = screen.getByText(mockProject.name);
    // Check for a style that indicates active state.
    // The component uses inline style for now: backgroundColor: isActive ? "#e0e0e0" : "transparent"
    expect(listItem).toHaveStyle('background-color: #e0e0e0'); // TODO: Adjust style to make test more robust
  });

  it('applies non-active styles when isActive is false', () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
      />
    );
    const listItem = screen.getByText(mockProject.name);
    expect(listItem).toHaveStyle("background-color: transparent"); // TODO: Adjust style to make test more robust
  });
});