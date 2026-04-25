import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ManageFamily from './ManageFamily';
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
        <ManageFamily />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ManageFamily', () => {
  it('should render create form when no family group', () => {
    renderPage();
    expect(screen.getByText('Create Your Family')).toBeInTheDocument();
    expect(screen.getByLabelText(/Family Name/)).toBeInTheDocument();
  });

  it('should render family details when family exists', () => {
    renderPage({
      familyGroup: {
        _id: 'fam1',
        name: 'Smith Family',
        createdBy: { _id: '1' },
        members: [
          { _id: '1', name: 'Test', email: 'test@example.com' },
          { _id: '2', name: 'Partner', email: 'partner@example.com' },
        ],
      },
    });

    expect(screen.getByText('Test (You)')).toBeInTheDocument();
    expect(screen.getByText('Partner')).toBeInTheDocument();
  });
});
