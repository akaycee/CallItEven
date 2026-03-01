import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { EditProfileDialog } from './EditProfileDialog';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('EditProfileDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    profileForm: {
      name: 'John Doe',
      email: 'john@example.com',
      password: '',
      confirmPassword: '',
    },
    onFormChange: jest.fn(),
    onSubmit: jest.fn(),
    error: '',
    success: '',
  };

  it('should render dialog with form fields', () => {
    renderWithTheme(<EditProfileDialog {...defaultProps} />);

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });

  it('should display current profile values', () => {
    renderWithTheme(<EditProfileDialog {...defaultProps} />);

    expect(screen.getByLabelText('Name *')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Email *')).toHaveValue('john@example.com');
  });

  it('should display error message', () => {
    renderWithTheme(
      <EditProfileDialog {...defaultProps} error="Something went wrong" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should display success message', () => {
    renderWithTheme(
      <EditProfileDialog {...defaultProps} success="Profile updated!" />
    );

    expect(screen.getByText('Profile updated!')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    renderWithTheme(
      <EditProfileDialog {...defaultProps} open={false} />
    );

    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
  });

  it('should call onClose when Cancel is clicked', () => {
    const mockOnClose = jest.fn();
    renderWithTheme(
      <EditProfileDialog {...defaultProps} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show helper text for password', () => {
    renderWithTheme(<EditProfileDialog {...defaultProps} />);

    expect(screen.getByText('Minimum 6 characters')).toBeInTheDocument();
  });

  it('should show note about keeping current password', () => {
    renderWithTheme(<EditProfileDialog {...defaultProps} />);

    expect(screen.getByText(/Leave password fields blank to keep current password/i)).toBeInTheDocument();
  });
});
