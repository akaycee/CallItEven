import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ManageInvestments from './ManageInvestments';
import { AuthContext } from '../context/AuthContext';

jest.mock('axios');
jest.mock('react-chartjs-2', () => ({ Doughnut: () => <div data-testid="doughnut-chart" /> }));

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
        <ManageInvestments />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ManageInvestments', () => {
  it('should render the page title', () => {
    renderPage();
    expect(screen.getByText('Investments')).toBeInTheDocument();
  });
});
