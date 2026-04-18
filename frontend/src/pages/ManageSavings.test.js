import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ManageSavings from './ManageSavings';
import { AuthContext } from '../context/AuthContext';

jest.mock('axios');

const renderPage = (contextValue = {}) => {
  const defaultContext = {
    user: { _id: '1', name: 'Test', email: 'test@example.com' },
    familyGroup: null,
    fetchFamilyGroup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    ...contextValue,
  };

  return render(
    <AuthContext.Provider value={defaultContext}>
      <MemoryRouter>
        <ManageSavings />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ManageSavings', () => {
  it('should render the page title', () => {
    renderPage();
    expect(screen.getByText('Savings Goals')).toBeInTheDocument();
  });
});
