import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import Login from './Login';
import axios from 'axios';

jest.mock('axios');

const theme = createTheme();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLogin = (authValue = {}) => {
  const defaultAuth = {
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    ...authValue,
  };

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={defaultAuth}>
          <Login />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    renderLogin();

    expect(screen.getByText('CallItEven')).toBeInTheDocument();
    expect(screen.getByText('Split expenses the easy way')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should have link to register page', () => {
    renderLogin();

    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Sign up').closest('a')).toHaveAttribute('href', '/register');
  });

  it('should update email field on input', () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { name: 'email', value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password field on input', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'password123' } });

    expect(passwordInput).toHaveValue('password123');
  });

  it('should toggle password visibility', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the visibility toggle button
    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('should call login API on form submit', async () => {
    const mockLogin = jest.fn();
    const mockData = {
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
      token: 'fake-token',
    };
    axios.post.mockResolvedValue({ data: mockData });

    renderLogin({ login: mockLogin });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockData);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error on failed login', async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    // Create a promise that won't resolve immediately
    let resolvePromise;
    axios.post.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });

    // Resolve the promise to clean up
    resolvePromise({ data: { token: 'test' } });
  });

  it('should show generic error when no response message', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });
});
