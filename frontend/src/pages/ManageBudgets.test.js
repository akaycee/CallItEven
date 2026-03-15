import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

jest.mock('../index', () => {
  const React = require('react');
  return { ColorModeContext: React.createContext({ toggleColorMode: jest.fn() }) };
});

import ManageBudgets from './ManageBudgets';

jest.mock('axios');

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

const renderManageBudgets = (authValue = {}) => {
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
          <ManageBudgets />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ManageBudgets Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === '/api/budgets') {
        return Promise.resolve({
          data: [
            { _id: 'b1', user: 'user1', category: 'Food & Dining', amount: 500 },
            { _id: 'b2', user: 'user1', category: 'Transportation', amount: 200 },
          ],
        });
      }
      if (url === '/api/budgets/summary' || url.startsWith('/api/budgets/summary?')) {
        return Promise.resolve({
          data: [
            { _id: 'b1', category: 'Food & Dining', budgetAmount: 500, spentAmount: 350 },
            { _id: 'b2', category: 'Transportation', budgetAmount: 200, spentAmount: 50 },
          ],
        });
      }
      if (url === '/api/categories') {
        return Promise.resolve({
          data: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Groceries'],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render the manage budgets page', async () => {
    renderManageBudgets();

    await waitFor(() => {
      expect(screen.getByText('Budgets')).toBeInTheDocument();
    });
  });

  it('should fetch budgets on mount', async () => {
    renderManageBudgets();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/budgets');
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/budgets/summary'));
      expect(axios.get).toHaveBeenCalledWith('/api/categories');
    });
  });

  it('should display existing budgets', async () => {
    renderManageBudgets();

    await waitFor(() => {
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
      expect(screen.getByText('Transportation')).toBeInTheDocument();
    });
  });

  it('should display spending progress for each budget', async () => {
    renderManageBudgets();

    await waitFor(() => {
      expect(screen.getByText('$350.00 spent')).toBeInTheDocument();
      expect(screen.getByText('$500.00 budget')).toBeInTheDocument();
      expect(screen.getByText('$50.00 spent')).toBeInTheDocument();
      expect(screen.getByText('$200.00 budget')).toBeInTheDocument();
    });
  });

  it('should show remaining budget amounts', async () => {
    renderManageBudgets();

    await waitFor(() => {
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
      expect(screen.getByText('$350.00 spent')).toBeInTheDocument();
    });

    // Check that remaining text is rendered somewhere
    const remainingElements = screen.getAllByText(/remaining/i);
    expect(remainingElements.length).toBeGreaterThan(0);
  });

  it('should open add budget dialog when clicking Add Budget', async () => {
    renderManageBudgets();

    await waitFor(() => {
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    });

    // The "Add Budget" button contains an Add icon + text
    const addButtons = screen.getAllByRole('button');
    const addBudgetBtn = addButtons.find(btn => btn.textContent.includes('Add Budget'));
    expect(addBudgetBtn).toBeTruthy();

    fireEvent.click(addBudgetBtn);

    await waitFor(() => {
      // The dialog should render a "Cancel" button
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  it('should show empty state when no budgets', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/budgets') return Promise.resolve({ data: [] });
      if (url === '/api/budgets/summary' || url.startsWith('/api/budgets/summary?')) return Promise.resolve({ data: [] });
      if (url === '/api/categories') return Promise.resolve({ data: ['Food & Dining'] });
      return Promise.resolve({ data: [] });
    });

    renderManageBudgets();

    await waitFor(() => {
      expect(screen.getByText(/No budgets set yet/i)).toBeInTheDocument();
    });
  });

  it('should redirect to login when not authenticated', async () => {
    renderManageBudgets({ user: null });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should have an add budget button', async () => {
    renderManageBudgets();

    await waitFor(() => {
      const addButtons = screen.getAllByRole('button');
      const addBudgetBtn = addButtons.find(btn => btn.textContent.includes('Add Budget'));
      expect(addBudgetBtn).toBeTruthy();
    });
  });

  it('should show edit and delete buttons for budgets', async () => {
    renderManageBudgets();

    await waitFor(() => {
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    });

    // Each budget should have edit and delete icon buttons
    const editIcons = document.querySelectorAll('[data-testid="EditIcon"]');
    const deleteIcons = document.querySelectorAll('[data-testid="DeleteIcon"]');
    expect(editIcons.length).toBeGreaterThanOrEqual(2);
    expect(deleteIcons.length).toBeGreaterThanOrEqual(2);
  });
});
