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

import ManageGroups from './ManageGroups';

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

const renderManageGroups = (authValue = {}) => {
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
          <ManageGroups />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ManageGroups Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === '/api/groups') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/users/search')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render groups page', async () => {
    renderManageGroups();

    await waitFor(() => {
      expect(screen.getByText(/My Groups/i)).toBeInTheDocument();
    });
  });

  it('should fetch groups on mount', async () => {
    renderManageGroups();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/groups');
    });
  });

  it('should display groups list when data is loaded', async () => {
    const groups = [
      {
        _id: 'group1',
        name: 'Trip Group',
        members: [
          { _id: 'user1', name: 'Test User', email: 'test@example.com' },
          { _id: 'user2', name: 'Alice', email: 'alice@test.com' },
        ],
        createdBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
        createdAt: '2024-01-15T00:00:00.000Z',
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === '/api/groups') return Promise.resolve({ data: groups });
      return Promise.resolve({ data: [] });
    });

    renderManageGroups();

    await waitFor(() => {
      expect(screen.getByText('Trip Group')).toBeInTheDocument();
    });
  });

  it('should show empty state when no groups', async () => {
    renderManageGroups();

    await waitFor(() => {
      expect(screen.getByText(/no groups/i)).toBeInTheDocument();
    });
  });

  it('should have a create group button', async () => {
    renderManageGroups();

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /create group/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  it('should open create group dialog when button is clicked', async () => {
    renderManageGroups();

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /create group/i });
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    });
  });

  it('should show member count on group cards', async () => {
    const groups = [
      {
        _id: 'group1',
        name: 'Trip Group',
        members: [
          { _id: 'user1', name: 'Test User', email: 'test@example.com' },
          { _id: 'user2', name: 'Alice', email: 'alice@test.com' },
          { _id: 'user3', name: 'Bob', email: 'bob@test.com' },
        ],
        createdBy: { _id: 'user1', name: 'Test User', email: 'test@example.com' },
        createdAt: '2024-01-15T00:00:00.000Z',
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === '/api/groups') return Promise.resolve({ data: groups });
      return Promise.resolve({ data: [] });
    });

    renderManageGroups();

    await waitFor(() => {
      expect(screen.getByText(/3 members/i)).toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    renderManageGroups();

    // Should not crash
    await waitFor(() => {
      expect(screen.getByText(/My Groups/i)).toBeInTheDocument();
    });
  });
});
