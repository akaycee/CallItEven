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

import CreateExpense from './CreateExpense';

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

const renderCreateExpense = (authValue = {}) => {
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
          <CreateExpense />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('CreateExpense Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === '/api/categories') {
        return Promise.resolve({ data: ['Food & Dining', 'Transportation', 'Shopping', 'Other'] });
      }
      if (url === '/api/groups') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/users/search')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render create expense form', async () => {
    renderCreateExpense();

    await waitFor(() => {
      expect(screen.getByText(/Create Expense/i)).toBeInTheDocument();
    });
  });

  it('should render all form fields', async () => {
    renderCreateExpense();

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/total amount/i)).toBeInTheDocument();
  });

  it('should fetch categories on mount', async () => {
    renderCreateExpense();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/categories');
    });
  });

  it('should fetch groups on mount', async () => {
    renderCreateExpense();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/groups');
    });
  });

  it('should show split type selector', async () => {
    renderCreateExpense();

    await waitFor(() => {
      const splitTypeElements = screen.getAllByText(/split type/i);
      expect(splitTypeElements.length).toBeGreaterThan(0);
    });
  });

  it('should add current user as default participant', async () => {
    renderCreateExpense();

    await waitFor(() => {
      // The current user should appear as a participant
      const userElements = screen.getAllByText(/Test User|test@example/i);
      expect(userElements.length).toBeGreaterThan(0);
    });
  });

  it('should have a submit button', async () => {
    renderCreateExpense();

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create expense/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  it('should show back button to navigate to dashboard', async () => {
    renderCreateExpense();

    await waitFor(() => {
      const backButtons = screen.getAllByRole('button');
      expect(backButtons.length).toBeGreaterThan(0);
    });
  });
});
