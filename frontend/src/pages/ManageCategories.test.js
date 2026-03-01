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

import ManageCategories from './ManageCategories';

jest.mock('axios');

const theme = createTheme();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockAdminUser = {
  _id: 'admin1',
  name: 'Admin User',
  email: 'admin@example.com',
  token: 'fake-token',
  isAdmin: true,
};

const mockRegularUser = {
  _id: 'user1',
  name: 'Regular User',
  email: 'user@example.com',
  token: 'fake-token',
  isAdmin: false,
};

const renderManageCategories = (authValue = {}) => {
  const defaultAuth = {
    user: mockAdminUser,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    ...authValue,
  };

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={defaultAuth}>
          <ManageCategories />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ManageCategories Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          data: [
            { name: 'Food & Dining', isDefault: true },
            { name: 'Transportation', isDefault: true },
            { name: 'Shopping', isDefault: true },
            { name: 'Entertainment', isDefault: true },
            { name: 'Custom Category', isDefault: false, _id: 'cat1', createdBy: { name: 'Admin', email: 'admin@example.com' } },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render categories page for admin', async () => {
    renderManageCategories();

    await waitFor(() => {
      expect(screen.getByText(/Manage Categories/i)).toBeInTheDocument();
    });
  });

  it('should redirect non-admin to dashboard', async () => {
    renderManageCategories({ user: mockRegularUser });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should fetch categories on mount', async () => {
    renderManageCategories();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/categories?detailed=true');
    });
  });

  it('should display categories list', async () => {
    renderManageCategories();

    await waitFor(() => {
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
      expect(screen.getByText('Transportation')).toBeInTheDocument();
    });
  });

  it('should distinguish default and custom categories', async () => {
    renderManageCategories();

    await waitFor(() => {
      const defaultChips = screen.getAllByText('Default');
      expect(defaultChips.length).toBeGreaterThan(0);
    });
  });

  it('should have add category button', async () => {
    renderManageCategories();

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add category/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    renderManageCategories();

    await waitFor(() => {
      expect(screen.getByText(/Manage Categories/i)).toBeInTheDocument();
    });
  });
});
