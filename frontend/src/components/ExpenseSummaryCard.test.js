import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { ExpenseSummaryCard } from './ExpenseSummaryCard';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

describe('ExpenseSummaryCard', () => {
  const defaultStats = {
    totalCount: 5,
    totalAmount: 500,
    yourShare: 250,
    categoriesUsed: 3,
    largestExpense: 200,
  };

  it('should render all stat cards', () => {
    renderWithTheme(
      <ExpenseSummaryCard
        expenseStats={defaultStats}
        dateFilter="all"
        onDateFilterChange={jest.fn()}
        customDates={{ startDate: '', endDate: '' }}
        onCustomDateChange={jest.fn()}
        formatCurrency={formatCurrency}
      />
    );

    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Your Share')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Largest Expense')).toBeInTheDocument();
  });

  it('should display correct stat values', () => {
    renderWithTheme(
      <ExpenseSummaryCard
        expenseStats={defaultStats}
        dateFilter="all"
        onDateFilterChange={jest.fn()}
        customDates={{ startDate: '', endDate: '' }}
        onCustomDateChange={jest.fn()}
        formatCurrency={formatCurrency}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  it('should display Expense Summary title', () => {
    renderWithTheme(
      <ExpenseSummaryCard
        expenseStats={defaultStats}
        dateFilter="all"
        onDateFilterChange={jest.fn()}
        customDates={{ startDate: '', endDate: '' }}
        onCustomDateChange={jest.fn()}
        formatCurrency={formatCurrency}
      />
    );

    expect(screen.getByText('Expense Summary')).toBeInTheDocument();
  });

  it('should render date filter dropdown', () => {
    renderWithTheme(
      <ExpenseSummaryCard
        expenseStats={defaultStats}
        dateFilter="all"
        onDateFilterChange={jest.fn()}
        customDates={{ startDate: '', endDate: '' }}
        onCustomDateChange={jest.fn()}
        formatCurrency={formatCurrency}
      />
    );

    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should handle zero values gracefully', () => {
    const zeroStats = {
      totalCount: 0,
      totalAmount: 0,
      yourShare: 0,
      categoriesUsed: 0,
      largestExpense: 0,
    };

    renderWithTheme(
      <ExpenseSummaryCard
        expenseStats={zeroStats}
        dateFilter="all"
        onDateFilterChange={jest.fn()}
        customDates={{ startDate: '', endDate: '' }}
        onCustomDateChange={jest.fn()}
        formatCurrency={formatCurrency}
      />
    );

    expect(screen.getByText('Expense Summary')).toBeInTheDocument();
  });
});
