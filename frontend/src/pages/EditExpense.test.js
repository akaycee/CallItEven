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

import EditExpense from './EditExpense';

jest.mock('axios');

const theme = createTheme();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'expense123' }),
}));

const mockUser = {
  _id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  token: 'fake-token',
  isAdmin: false,
};

const mockExpense = {
  _id: 'expense123',
  description: 'Dinner',
  totalAmount: 100,
  paidBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
  createdBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
  splitType: 'equal',
  splits: [
    { user: { _id: 'user1', name: 'Test User', email: 'test@example.com' }, amount: 50, percentage: 50 },
    { user: { _id: 'user2', name: 'Alice', email: 'alice@test.com' }, amount: 50, percentage: 50 },
  ],
  category: 'Food & Dining',
  createdAt: '2024-01-15T00:00:00.000Z',
};

const renderEditExpense = (authValue = {}) => {
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
          <EditExpense />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('EditExpense Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === '/api/categories') {
        return Promise.resolve({ data: ['Food & Dining', 'Transportation', 'Other'] });
      }
      if (url === `/api/expenses/expense123`) {
        return Promise.resolve({ data: mockExpense });
      }
      if (url.includes('/api/users/search')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render edit expense form', async () => {
    renderEditExpense();

    await waitFor(() => {
      expect(screen.getByText(/Edit Expense/i)).toBeInTheDocument();
    });
  });

  it('should fetch expense data on mount', async () => {
    renderEditExpense();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/expenses/expense123');
    });
  });

  it('should fetch categories on mount', async () => {
    renderEditExpense();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/categories');
    });
  });

  it('should populate form with existing expense data', async () => {
    renderEditExpense();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Dinner')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });
  });

  it('should show error for non-creator', async () => {
    const differentUser = {
      _id: 'user3',
      name: 'Not Creator',
      email: 'notcreator@example.com',
      token: 'fake-token',
      isAdmin: false,
    };

    renderEditExpense({ user: differentUser });

    await waitFor(() => {
      expect(screen.getByText('You are not authorized to edit this expense')).toBeInTheDocument();
    });
  });

  it('should have an update button', async () => {
    renderEditExpense();

    await waitFor(() => {
      const updateButton = screen.getByRole('button', { name: /update expense/i });
      expect(updateButton).toBeInTheDocument();
    });
  });
});
