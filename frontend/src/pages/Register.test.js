import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import Register from './Register';
import axios from 'axios';

jest.mock('axios');

const theme = createTheme();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderRegister = (authValue = {}) => {
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
          <Register />
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getPasswordField = () => document.querySelector('input[name="password"]');
  const getConfirmPasswordField = () => document.querySelector('input[name="confirmPassword"]');

  it('should render registration form', () => {
    renderRegister();

    expect(screen.getByText('Join CallItEven')).toBeInTheDocument();
    expect(screen.getByText('Create your account and start splitting')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordField()).toBeInTheDocument();
    expect(getConfirmPasswordField()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should have link to login page', () => {
    renderRegister();

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Login').closest('a')).toHaveAttribute('href', '/login');
  });

  it('should show error when passwords do not match', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: 'name', value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'john@example.com' },
    });
    fireEvent.change(getPasswordField(), {
      target: { name: 'password', value: 'password123' },
    });
    fireEvent.change(getConfirmPasswordField(), {
      target: { name: 'confirmPassword', value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    // Should not make API call
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: 'name', value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'john@example.com' },
    });
    fireEvent.change(getPasswordField(), {
      target: { name: 'password', value: '12345' },
    });
    fireEvent.change(getConfirmPasswordField(), {
      target: { name: 'confirmPassword', value: '12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should call register API on valid form submit', async () => {
    const mockLogin = jest.fn();
    const mockData = {
      _id: '123',
      name: 'John',
      email: 'john@example.com',
      token: 'fake-token',
    };
    axios.post.mockResolvedValue({ data: mockData });

    renderRegister({ login: mockLogin });

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: 'name', value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'john@example.com' },
    });
    fireEvent.change(getPasswordField(), {
      target: { name: 'password', value: 'password123' },
    });
    fireEvent.change(getConfirmPasswordField(), {
      target: { name: 'confirmPassword', value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockData);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display server error on failed registration', async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: 'User already exists with this email' } },
    });

    renderRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: 'name', value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'john@example.com' },
    });
    fireEvent.change(getPasswordField(), {
      target: { name: 'password', value: 'password123' },
    });
    fireEvent.change(getConfirmPasswordField(), {
      target: { name: 'confirmPassword', value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('User already exists with this email')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    let resolvePromise;
    axios.post.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));

    renderRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: 'name', value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'john@example.com' },
    });
    fireEvent.change(getPasswordField(), {
      target: { name: 'password', value: 'password123' },
    });
    fireEvent.change(getConfirmPasswordField(), {
      target: { name: 'confirmPassword', value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });

    resolvePromise({ data: { token: 'test' } });
  });

  it('should toggle password visibility', () => {
    renderRegister();

    const passwordInput = getPasswordField();
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the visibility toggle
    const toggleButtons = screen.getAllByRole('button');
    const visibilityToggle = toggleButtons.find(btn => btn.querySelector('svg'));
    if (visibilityToggle) {
      fireEvent.click(visibilityToggle);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});
