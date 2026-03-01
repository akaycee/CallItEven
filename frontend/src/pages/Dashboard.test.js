import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

// Mock index.js to avoid createRoot error and provide ColorModeContext
jest.mock('../index', () => {
  const React = require('react');
  return { ColorModeContext: React.createContext({ toggleColorMode: jest.fn() }) };
});

import Dashboard from './Dashboard';

jest.mock('axios');

// Mock chart.js to avoid canvas errors in tests
jest.mock('react-chartjs-2', () => ({
  Pie: function MockPie() { return null; },
  Doughnut: function MockDoughnut() { return null; },
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  ArcElement: class {},
  Tooltip: class {},
  Legend: class {},
}));

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

const renderDashboard = (authValue = {}) => {
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
          <Dashboard />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the default API responses
    axios.get.mockImplementation((url) => {
      if (url === '/api/expenses') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/expenses/balance/summary') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render app bar with title', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Call It Even')).toBeInTheDocument();
    });
  });

  it('should fetch expenses on mount', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/expenses');
    });
  });

  it('should fetch balance summary on mount', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/expenses/balance/summary');
    });
  });

  it('should display balance summary card', async () => {
    const balances = [
      {
        user: { _id: 'user2', name: 'Alice', email: 'alice@test.com' },
        amount: 50,
        type: 'owes_you',
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === '/api/expenses') return Promise.resolve({ data: [] });
      if (url === '/api/expenses/balance/summary') return Promise.resolve({ data: balances });
      return Promise.resolve({ data: [] });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Balance Summary')).toBeInTheDocument();
    });
  });

  it('should display expense summary section when expenses exist', async () => {
    const expenses = [
      {
        _id: 'exp1',
        description: 'Lunch',
        totalAmount: 50,
        paidBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
        createdBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
        splitType: 'equal',
        splits: [
          { user: { _id: 'user1', name: 'Test User', email: 'test@example.com' }, amount: 25 },
          { user: { _id: 'user2', name: 'Alice', email: 'alice@test.com' }, amount: 25 },
        ],
        category: 'Food & Dining',
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === '/api/expenses') return Promise.resolve({ data: expenses });
      if (url === '/api/expenses/balance/summary') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Expense Summary')).toBeInTheDocument();
    });
  });

  it('should show FAB button for creating expenses', async () => {
    renderDashboard();

    await waitFor(() => {
      // The FAB has an AddIcon
      const fabButtons = screen.getAllByRole('button');
      expect(fabButtons.length).toBeGreaterThan(0);
    });
  });

  it('should display expenses when data is loaded', async () => {
    const expenses = [
      {
        _id: 'exp1',
        description: 'Dinner',
        totalAmount: 100,
        paidBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
        createdBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
        splitType: 'equal',
        splits: [
          { user: { _id: 'user1', name: 'Test User', email: 'test@example.com' }, amount: 50 },
          { user: { _id: 'user2', name: 'Alice', email: 'alice@test.com' }, amount: 50 },
        ],
        category: 'Food & Dining',
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === '/api/expenses') return Promise.resolve({ data: expenses });
      if (url === '/api/expenses/balance/summary') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dinner')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render user avatar', async () => {
    renderDashboard();

    await waitFor(() => {
      const avatars = document.querySelectorAll('.MuiAvatar-root');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  it('should handle API error gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    renderDashboard();

    // Should not crash and should still show app bar
    await waitFor(() => {
      expect(screen.getByText('Call It Even')).toBeInTheDocument();
    });
  });

  it('should show empty balance summary message when no balances', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No outstanding balances/i)).toBeInTheDocument();
    });
  });
});
