import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

jest.mock('../index', () => {
  const React = require('react');
  return { ColorModeContext: React.createContext({ toggleColorMode: jest.fn() }) };
});

import CashFlow from './CashFlow';

jest.mock('axios');

// Mock the chart components to avoid Chart.js rendering issues in tests
jest.mock('../components/CashFlowSankey', () => {
  return function MockCashFlowSankey({ incomeBySource, expensesByCategory }) {
    return (
      <div data-testid="cash-flow-sankey">
        Sankey: {incomeBySource?.length || 0} sources, {expensesByCategory?.length || 0} categories
      </div>
    );
  };
});

jest.mock('../components/CashFlowBarChart', () => {
  return function MockCashFlowBarChart({ monthly }) {
    return (
      <div data-testid="cash-flow-bar-chart">
        Bar Chart: {monthly?.length || 0} months
      </div>
    );
  };
});

const theme = createTheme();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUser = {
  _id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  token: 'fake-token',
  isAdmin: false,
};

const mockCashFlowData = {
  incomeBySource: [
    { source: 'Salary', total: 5000 },
    { source: 'Freelance', total: 1000 },
  ],
  expensesByCategory: [
    { category: 'Food & Dining', total: 800 },
    { category: 'Transportation', total: 200 },
  ],
  totalIncome: 6000,
  totalExpenses: 1000,
  netSavings: 5000,
  monthly: [
    { month: '2026-01', income: 5000, expenses: 800, net: 4200 },
    { month: '2026-02', income: 6000, expenses: 900, net: 5100 },
    { month: '2026-03', income: 6000, expenses: 1000, net: 5000 },
  ],
};

const renderCashFlow = (authValue = {}) => {
  const defaultAuth = {
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    ...authValue,
  };

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={defaultAuth}>
          <CashFlow />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('CashFlow Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.startsWith('/api/cashflow')) {
        return Promise.resolve({ data: mockCashFlowData });
      }
      if (url === '/api/groups') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render the cash flow page', async () => {
    renderCashFlow();

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Net Savings')).toBeInTheDocument();
    });
  });

  it('should fetch cash flow data on mount', async () => {
    renderCashFlow();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/cashflow'));
    });
  });

  it('should display summary cards with correct values', async () => {
    renderCashFlow();

    await waitFor(() => {
      expect(screen.getByText('$6,000.00')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('+$5,000.00')).toBeInTheDocument();
    });
  });

  it('should render the Sankey chart', async () => {
    renderCashFlow();

    await waitFor(() => {
      expect(screen.getByTestId('cash-flow-sankey')).toBeInTheDocument();
      expect(screen.getByText('Sankey: 2 sources, 2 categories')).toBeInTheDocument();
    });
  });

  it('should render the bar chart', async () => {
    renderCashFlow();

    await waitFor(() => {
      expect(screen.getByTestId('cash-flow-bar-chart')).toBeInTheDocument();
      expect(screen.getByText('Bar Chart: 3 months')).toBeInTheDocument();
    });
  });

  it('should redirect to login if not authenticated', () => {
    renderCashFlow({ user: null });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should show date filter controls', async () => {
    renderCashFlow();

    await waitFor(() => {
      expect(screen.getByText('This Year')).toBeInTheDocument();
    });
  });

  it('should handle negative net savings', async () => {
    axios.get.mockImplementation((url) => {
      if (url.startsWith('/api/cashflow')) {
        return Promise.resolve({
          data: {
            ...mockCashFlowData,
            totalIncome: 1000,
            totalExpenses: 3000,
            netSavings: -2000,
          },
        });
      }
      if (url === '/api/groups') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    renderCashFlow();

    await waitFor(() => {
      expect(screen.getByText('-$2,000.00')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    axios.get.mockImplementation((url) => {
      if (url.startsWith('/api/cashflow')) {
        return Promise.reject({ response: { data: { message: 'Server error' } } });
      }
      if (url === '/api/groups') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    renderCashFlow();

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
