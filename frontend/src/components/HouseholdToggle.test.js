import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HouseholdToggle from './HouseholdToggle';
import { AuthContext } from '../context/AuthContext';

const renderWithContext = (familyGroup, props = {}) => {
  return render(
    <AuthContext.Provider value={{ familyGroup }}>
      <HouseholdToggle value="personal" onChange={() => {}} {...props} />
    </AuthContext.Provider>
  );
};

describe('HouseholdToggle', () => {
  it('should render nothing when user has no family group', () => {
    const { container } = renderWithContext(null);
    expect(container.firstChild).toBeNull();
  });

  it('should render toggle buttons when user has a family group', () => {
    renderWithContext({ _id: '1', name: 'Smith Family', members: [] });
    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
  });

  it('should use custom familyName prop', () => {
    renderWithContext(
      { _id: '1', name: 'Smith Family', members: [] },
      { familyName: 'Our House' }
    );
    expect(screen.getByText('Our House')).toBeInTheDocument();
  });

  it('should call onChange when toggled', () => {
    const handleChange = jest.fn();
    renderWithContext(
      { _id: '1', name: 'Family', members: [] },
      { onChange: handleChange }
    );
    fireEvent.click(screen.getByText('Family'));
    expect(handleChange).toHaveBeenCalled();
  });
});
