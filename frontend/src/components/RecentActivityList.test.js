import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { RecentActivityList } from './RecentActivityList';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const formatCurrency = (amount) => {
  if (amount == null) return '$0.00';
  return `$${Number(amount).toFixed(2)}`;
};
const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '';

describe('RecentActivityList', () => {
  const sampleActivity = [
    {
      _id: '1',
      description: 'Dinner out',
      amount: 100,
      totalAmount: 100,
      paidBy: { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
      category: 'Food & Dining',
      date: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      type: 'expense',
      splitType: 'equal',
    },
    {
      _id: '2',
      description: 'Settlement - Cash',
      amount: 50,
      totalAmount: 50,
      paidBy: { _id: 'u2', name: 'Bob', email: 'bob@test.com' },
      category: 'Settlement - Cash',
      date: '2024-01-14T00:00:00.000Z',
      createdAt: '2024-01-14T00:00:00.000Z',
      type: 'settlement',
      splitType: 'equal',
    },
  ];

  it('should render Recent Activity title', () => {
    renderWithTheme(
      <RecentActivityList
        filteredActivity={sampleActivity}
        activityFilter="all"
        onActivityFilterChange={jest.fn()}
        loading={false}
        onExpenseClick={jest.fn()}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('should show loading spinner when loading', () => {
    renderWithTheme(
      <RecentActivityList
        filteredActivity={[]}
        activityFilter="all"
        onActivityFilterChange={jest.fn()}
        loading={true}
        onExpenseClick={jest.fn()}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display activity filter dropdown', () => {
    renderWithTheme(
      <RecentActivityList
        filteredActivity={sampleActivity}
        activityFilter="all"
        onActivityFilterChange={jest.fn()}
        loading={false}
        onExpenseClick={jest.fn()}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    );

    expect(screen.getByText('All Activity')).toBeInTheDocument();
  });

  it('should render expense items', () => {
    renderWithTheme(
      <RecentActivityList
        filteredActivity={sampleActivity}
        activityFilter="all"
        onActivityFilterChange={jest.fn()}
        loading={false}
        onExpenseClick={jest.fn()}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    );

    expect(screen.getByText('Dinner out')).toBeInTheDocument();
    expect(screen.getByText('Settlement - Cash')).toBeInTheDocument();
  });
});
