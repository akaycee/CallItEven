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

import ManageIncome from './ManageIncome';

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

const renderManageIncome = (authValue = {}) => {
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
          <ManageIncome />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ManageIncome Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.startsWith('/api/income')) {
        return Promise.resolve({
          data: [
            {
              _id: 'inc1',
              user: 'user1',
              source: 'Salary',
              amount: 5000,
              date: '2026-03-01T00:00:00.000Z',
              category: 'Employment',
              description: 'Monthly salary',
              isRecurring: true,
              recurrence: { frequency: 'monthly' },
            },
            {
              _id: 'inc2',
              user: 'user1',
              source: 'Freelance',
              amount: 1000,
              date: '2026-03-15T00:00:00.000Z',
              category: 'Freelance',
              description: '',
              isRecurring: false,
            },
          ],
        });
      }
      if (url === '/api/groups') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render the manage income page', async () => {
    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText('Manage Income')).toBeInTheDocument();
    });
  });

  it('should fetch income entries on mount', async () => {
    renderManageIncome();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/income'));
      expect(axios.get).toHaveBeenCalledWith('/api/groups');
    });
  });

  it('should display income entries', async () => {
    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.getByText('Freelance')).toBeInTheDocument();
    });
  });

  it('should display summary stats', async () => {
    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getAllByText('Income Sources').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show recurring badge for recurring income', async () => {
    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText('monthly')).toBeInTheDocument();
    });
  });

  it('should open add dialog when clicking Add Income', async () => {
    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Income/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should create a new income entry', async () => {
    axios.post.mockResolvedValueOnce({
      data: { _id: 'inc3', source: 'Bonus', amount: 2000 },
    });

    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Income/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const sourceInput = dialog.querySelector('input[type="text"]');
    const amountInput = dialog.querySelector('input[type="number"]');

    fireEvent.change(sourceInput, { target: { value: 'Bonus' } });
    fireEvent.change(amountInput, { target: { value: '2000' } });

    const addButtons = screen.getAllByText('Add');
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/income', expect.objectContaining({
        source: 'Bonus',
        amount: 2000,
      }));
    });
  });

  it('should delete an income entry', async () => {
    axios.delete.mockResolvedValueOnce({ data: { message: 'Income deleted successfully' } });

    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete income');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete Income')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/income/inc1');
    });
  });

  it('should redirect to login if not authenticated', () => {
    renderManageIncome({ user: null });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should show empty state when no income', async () => {
    axios.get.mockImplementation((url) => {
      if (url.startsWith('/api/income')) return Promise.resolve({ data: [] });
      if (url === '/api/groups') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderManageIncome();

    await waitFor(() => {
      expect(screen.getByText(/No income entries yet/)).toBeInTheDocument();
    });
  });
});
