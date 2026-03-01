import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { BalanceSummaryCard } from './BalanceSummaryCard';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

describe('BalanceSummaryCard', () => {
  it('should show empty state when no balances', () => {
    renderWithTheme(
      <BalanceSummaryCard
        balances={[]}
        formatCurrency={formatCurrency}
        handleUserClick={jest.fn()}
      />
    );

    expect(screen.getByText('Balance Summary')).toBeInTheDocument();
    expect(screen.getByText(/No outstanding balances/i)).toBeInTheDocument();
  });

  it('should display balances for owes_you type', () => {
    const balances = [
      {
        user: { _id: '1', name: 'Alice', email: 'alice@example.com' },
        amount: 50,
        type: 'owes_you',
      },
    ];

    renderWithTheme(
      <BalanceSummaryCard
        balances={balances}
        formatCurrency={formatCurrency}
        handleUserClick={jest.fn()}
      />
    );

    expect(screen.getByText('Balance Summary')).toBeInTheDocument();
    // $50.00 appears in summary total and individual card
    const amounts = screen.getAllByText('$50.00');
    expect(amounts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('should display balances for you_owe type', () => {
    const balances = [
      {
        user: { _id: '2', name: 'Bob', email: 'bob@example.com' },
        amount: 30,
        type: 'you_owe',
      },
    ];

    renderWithTheme(
      <BalanceSummaryCard
        balances={balances}
        formatCurrency={formatCurrency}
        handleUserClick={jest.fn()}
      />
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should calculate totals correctly', () => {
    const balances = [
      {
        user: { _id: '1', name: 'Alice', email: 'alice@example.com' },
        amount: 50,
        type: 'owes_you',
      },
      {
        user: { _id: '2', name: 'Bob', email: 'bob@example.com' },
        amount: 30,
        type: 'owes_you',
      },
      {
        user: { _id: '3', name: 'Charlie', email: 'charlie@example.com' },
        amount: 20,
        type: 'you_owe',
      },
    ];

    renderWithTheme(
      <BalanceSummaryCard
        balances={balances}
        formatCurrency={formatCurrency}
        handleUserClick={jest.fn()}
      />
    );

    // Totals should show $80 owed to you and $20 you owe
    const amounts80 = screen.getAllByText('$80.00');
    expect(amounts80.length).toBeGreaterThanOrEqual(1);
    const amounts20 = screen.getAllByText('$20.00');
    expect(amounts20.length).toBeGreaterThanOrEqual(1);
  });

  it('should call handleUserClick when a balance card is clicked', () => {
    const mockHandleUserClick = jest.fn();
    const balances = [
      {
        user: { _id: '1', name: 'Alice', email: 'alice@example.com' },
        amount: 50,
        type: 'owes_you',
      },
    ];

    renderWithTheme(
      <BalanceSummaryCard
        balances={balances}
        formatCurrency={formatCurrency}
        handleUserClick={mockHandleUserClick}
      />
    );

    fireEvent.click(screen.getByText('Alice'));
    expect(mockHandleUserClick).toHaveBeenCalledWith(balances[0]);
  });

  it('should display People owe you and You owe labels', () => {
    const balances = [
      {
        user: { _id: '1', name: 'Alice', email: 'alice@example.com' },
        amount: 50,
        type: 'owes_you',
      },
    ];

    renderWithTheme(
      <BalanceSummaryCard
        balances={balances}
        formatCurrency={formatCurrency}
        handleUserClick={jest.fn()}
      />
    );

    expect(screen.getByText('People owe you')).toBeInTheDocument();
    expect(screen.getByText('You owe')).toBeInTheDocument();
  });
});
