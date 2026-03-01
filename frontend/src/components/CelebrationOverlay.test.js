import React from 'react';
import { render, screen } from '@testing-library/react';
import { FullCelebration, PartialCelebration } from './CelebrationOverlay';

describe('CelebrationOverlay', () => {
  describe('FullCelebration', () => {
    it('should render when show is true', () => {
      render(<FullCelebration show={true} />);

      expect(screen.getByText('All Evened Up!')).toBeInTheDocument();
      expect(screen.getByText('Payment recorded successfully ✨')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      const { container } = render(<FullCelebration show={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('PartialCelebration', () => {
    it('should render when show is true', () => {
      render(<PartialCelebration show={true} />);

      expect(screen.getByText('Progress! Cha-ching!')).toBeInTheDocument();
      expect(screen.getByText('Every little bit counts! 🎯')).toBeInTheDocument();
      expect(screen.getByText('💸')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      const { container } = render(<PartialCelebration show={false} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
