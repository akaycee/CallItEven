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

import ManageUsers from './ManageUsers';

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

const mockUsersList = [
  {
    _id: 'admin1',
    name: 'Admin User',
    email: 'admin@example.com',
    isAdmin: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'user2',
    name: 'John Doe',
    email: 'john@example.com',
    isAdmin: false,
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  {
    _id: 'user3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isAdmin: false,
    createdAt: '2024-01-15T00:00:00.000Z',
  },
];

const renderManageUsers = (authValue = {}) => {
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
          <ManageUsers />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ManageUsers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === '/api/admin/users') {
        return Promise.resolve({ data: mockUsersList });
      }
      if (url === '/api/admin/stats') {
        return Promise.resolve({
          data: { totalUsers: 3, totalExpenses: 10, totalAmount: 1500 },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render manage users page for admin', async () => {
    renderManageUsers();

    await waitFor(() => {
      expect(screen.getByText(/Manage Users/i)).toBeInTheDocument();
    });
  });

  it('should redirect non-admin to dashboard', async () => {
    renderManageUsers({ user: mockRegularUser });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should fetch users on mount', async () => {
    renderManageUsers();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/admin/users');
    });
  });

  it('should fetch stats on mount', async () => {
    renderManageUsers();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/admin/stats');
    });
  });

  it('should display stats cards', async () => {
    renderManageUsers();

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
    });
  });

  it('should display users in a list', async () => {
    renderManageUsers();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('should show Admin chip for admin users', async () => {
    renderManageUsers();

    await waitFor(() => {
      const adminChips = screen.getAllByText('Admin');
      expect(adminChips.length).toBeGreaterThan(0);
    });
  });

  it('should show User chip for regular users', async () => {
    renderManageUsers();

    await waitFor(() => {
      const userChips = screen.getAllByText('User');
      expect(userChips.length).toBeGreaterThan(0);
    });
  });

  it('should display stat values correctly', async () => {
    renderManageUsers();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    renderManageUsers();

    // Should not crash
    await waitFor(() => {
      expect(screen.getByText(/Manage Users/i)).toBeInTheDocument();
    });
  });
});
