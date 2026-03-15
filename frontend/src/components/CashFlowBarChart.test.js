import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

// Mock chart.js to avoid canvas rendering issues
jest.mock('react-chartjs-2', () => ({
  Bar: (props) => <div data-testid="bar-chart">Bar Chart</div>,
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  BarElement: {},
  LineElement: {},
  PointElement: {},
  CategoryScale: {},
  LinearScale: {},
  Tooltip: {},
  Legend: {},
  LineController: {},
  BarController: {},
}));

import CashFlowBarChart from './CashFlowBarChart';

const theme = createTheme();

const renderBarChart = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <CashFlowBarChart {...props} />
    </ThemeProvider>
  );
};

describe('CashFlowBarChart', () => {
  it('should render empty state when no data', () => {
    renderBarChart();
    expect(screen.getByText('No monthly data available')).toBeInTheDocument();
  });

  it('should render empty state with empty array', () => {
    renderBarChart({ monthly: [] });
    expect(screen.getByText('No monthly data available')).toBeInTheDocument();
  });

  it('should render chart when data is provided', () => {
    renderBarChart({
      monthly: [
        { month: '2026-01', income: 5000, expenses: 1000, net: 4000 },
        { month: '2026-02', income: 5000, expenses: 1200, net: 3800 },
      ],
    });

    expect(screen.getByText('Income vs Expenses Over Time')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render with single month data', () => {
    renderBarChart({
      monthly: [
        { month: '2026-03', income: 6000, expenses: 2000, net: 4000 },
      ],
    });

    expect(screen.getByText('Income vs Expenses Over Time')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});
