import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DeleteProjectModal from '../DeleteProjectModal';

describe('DeleteProjectModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Title',
    message: 'Test Message',
    isLoading: false,
  };

  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<DeleteProjectModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('should render with correct title and message when isOpen is true', () => {
    render(<DeleteProjectModal {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    render(<DeleteProjectModal {...defaultProps} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when Confirm button is clicked', async () => {
    render(<DeleteProjectModal {...defaultProps} />);
    await userEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons and show "Deleting..." when isLoading is true', () => {
    render(<DeleteProjectModal {...defaultProps} isLoading={true} />);
    const confirmButton = screen.getByText('Deleting...');
    const cancelButton = screen.getByText('Cancel');

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should call onClose when overlay is clicked and not loading', async () => {
    render(<DeleteProjectModal {...defaultProps} />);
    const overlay = screen.getByTestId('modal-overlay');
    await userEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when overlay is clicked and loading', async () => {
    render(<DeleteProjectModal {...defaultProps} isLoading={true} />);
    const overlay = screen.getByTestId('modal-overlay');
    await userEvent.click(overlay);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  // Add data-testid="modal-overlay" to the overlay div in DeleteProjectModal.jsx
});