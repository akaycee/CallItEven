import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

// Mock chart.js and chartjs-chart-sankey to avoid canvas rendering issues
jest.mock('react-chartjs-2', () => ({
  Chart: (props) => <div data-testid="sankey-chart" data-type={props.type}>Chart</div>,
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
}));

jest.mock('chartjs-chart-sankey', () => ({
  SankeyController: {},
  Flow: {},
}));

import CashFlowSankey from './CashFlowSankey';

const theme = createTheme();

const renderSankey = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <CashFlowSankey {...props} />
    </ThemeProvider>
  );
};

describe('CashFlowSankey', () => {
  it('should render empty state when no data', () => {
    renderSankey();
    expect(screen.getByText('No cash flow data available for this period')).toBeInTheDocument();
  });

  it('should render empty state with empty arrays', () => {
    renderSankey({ incomeBySource: [], expensesByCategory: [] });
    expect(screen.getByText('No cash flow data available for this period')).toBeInTheDocument();
  });

  it('should render chart when data is provided', () => {
    renderSankey({
      incomeBySource: [{ source: 'Salary', total: 5000 }],
      expensesByCategory: [{ category: 'Food', total: 1000 }],
      totalIncome: 5000,
    });

    expect(screen.getByText('Cash Flow Diagram')).toBeInTheDocument();
    expect(screen.getByTestId('sankey-chart')).toBeInTheDocument();
  });

  it('should show legend items', () => {
    renderSankey({
      incomeBySource: [{ source: 'Salary', total: 5000 }],
      expensesByCategory: [{ category: 'Food', total: 1000 }],
      totalIncome: 5000,
    });

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });
});
