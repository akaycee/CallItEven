import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import BudgetOverview from './BudgetOverview';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const formatCurrency = (amount) => `$${Math.abs(amount).toFixed(2)}`;

describe('BudgetOverview', () => {
  it('should render nothing when budgetSummary is empty', () => {
    const { container } = renderWithTheme(
      <BudgetOverview budgetSummary={[]} formatCurrency={formatCurrency} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render budget cards for each category', () => {
    const summary = [
      { category: 'Food & Dining', budgetAmount: 500, spentAmount: 200 },
      { category: 'Transportation', budgetAmount: 200, spentAmount: 150 },
    ];

    renderWithTheme(
      <BudgetOverview budgetSummary={summary} formatCurrency={formatCurrency} />
    );

    expect(screen.getByText('Budgets')).toBeInTheDocument();
    expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
  });

  it('should display spent and budget amounts', () => {
    const summary = [
      { category: 'Food & Dining', budgetAmount: 500, spentAmount: 200 },
    ];

    renderWithTheme(
      <BudgetOverview budgetSummary={summary} formatCurrency={formatCurrency} />
    );

    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('/ $500.00')).toBeInTheDocument();
  });

  it('should show remaining amount when under budget', () => {
    const summary = [
      { category: 'Food & Dining', budgetAmount: 500, spentAmount: 200 },
    ];

    renderWithTheme(
      <BudgetOverview budgetSummary={summary} formatCurrency={formatCurrency} />
    );

    expect(screen.getByText('$300.00 remaining')).toBeInTheDocument();
  });

  it('should show over budget chip and amount when over budget', () => {
    const summary = [
      { category: 'Food & Dining', budgetAmount: 500, spentAmount: 600 },
    ];

    renderWithTheme(
      <BudgetOverview budgetSummary={summary} formatCurrency={formatCurrency} />
    );

    expect(screen.getByText('Over Budget')).toBeInTheDocument();
    expect(screen.getByText('$100.00 over budget')).toBeInTheDocument();
  });

  it('should render progress bars', () => {
    const summary = [
      { category: 'Food & Dining', budgetAmount: 500, spentAmount: 200 },
    ];

    renderWithTheme(
      <BudgetOverview budgetSummary={summary} formatCurrency={formatCurrency} />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '40');
  });

  it('should cap progress bar at 100% when over budget', () => {
    const summary = [
      { category: 'Food & Dining', budgetAmount: 500, spentAmount: 750 },
    ];

    renderWithTheme(
      <BudgetOverview budgetSummary={summary} formatCurrency={formatCurrency} />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
