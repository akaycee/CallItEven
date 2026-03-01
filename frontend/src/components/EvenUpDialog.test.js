import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { EvenUpDialog } from './EvenUpDialog';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('EvenUpDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    evenUpForm: {
      amount: '',
      paymentMethod: '',
      notes: '',
    },
    onFormChange: jest.fn(),
    onSubmit: jest.fn(),
    error: '',
    success: '',
  };

  it('should render dialog with form fields', () => {
    renderWithTheme(<EvenUpDialog {...defaultProps} />);

    expect(screen.getByText('Even Up')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount *')).toBeInTheDocument();
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes (optional)')).toBeInTheDocument();
  });

  it('should display all payment method options', () => {
    renderWithTheme(<EvenUpDialog {...defaultProps} />);

    // Open the payment method select by clicking the combobox
    const selectButton = screen.getByRole('combobox');
    fireEvent.mouseDown(selectButton);

    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Zelle')).toBeInTheDocument();
    expect(screen.getByText('Venmo')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should display error message', () => {
    renderWithTheme(
      <EvenUpDialog {...defaultProps} error="Amount exceeds balance" />
    );

    expect(screen.getByText('Amount exceeds balance')).toBeInTheDocument();
  });

  it('should display success message', () => {
    renderWithTheme(
      <EvenUpDialog {...defaultProps} success="Payment recorded!" />
    );

    expect(screen.getByText('Payment recorded!')).toBeInTheDocument();
  });

  it('should disable submit when amount is empty', () => {
    renderWithTheme(<EvenUpDialog {...defaultProps} />);

    expect(screen.getByText('Record Payment')).toBeDisabled();
  });

  it('should disable submit when payment method is empty', () => {
    renderWithTheme(
      <EvenUpDialog
        {...defaultProps}
        evenUpForm={{ amount: '50', paymentMethod: '', notes: '' }}
      />
    );

    expect(screen.getByText('Record Payment')).toBeDisabled();
  });

  it('should enable submit when both amount and payment method are filled', () => {
    renderWithTheme(
      <EvenUpDialog
        {...defaultProps}
        evenUpForm={{ amount: '50', paymentMethod: 'Cash', notes: '' }}
      />
    );

    expect(screen.getByText('Record Payment')).not.toBeDisabled();
  });

  it('should call onClose when Cancel is clicked', () => {
    const mockOnClose = jest.fn();
    renderWithTheme(
      <EvenUpDialog {...defaultProps} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onSubmit when Record Payment is clicked', () => {
    const mockOnSubmit = jest.fn();
    renderWithTheme(
      <EvenUpDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
        evenUpForm={{ amount: '50', paymentMethod: 'Cash', notes: '' }}
      />
    );

    fireEvent.click(screen.getByText('Record Payment'));
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should not render when closed', () => {
    renderWithTheme(
      <EvenUpDialog {...defaultProps} open={false} />
    );

    expect(screen.queryByText('Even Up')).not.toBeInTheDocument();
  });
});
