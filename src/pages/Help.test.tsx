// Help Page Tests
// Tests for static help documentation page

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/helpers';
import Help from './Help';

describe('Help Page', () => {
  describe('Rendering', () => {
    it('should render help guide header', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/help guide/i)).toBeInTheDocument();
      expect(screen.getByText(/simple guide for teachers/i)).toBeInTheDocument();
    });

    it('should render welcome section', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/welcome to essayease/i)).toBeInTheDocument();
      expect(screen.getByText(/helpful assistant for grading 6th grade essays/i)).toBeInTheDocument();
    });
  });

  describe('Quick Start Section', () => {
    it('should render quick start heading', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/quick start: grade your first essay/i)).toBeInTheDocument();
    });

    it('should describe three upload options', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/text:/i)).toBeInTheDocument();
      expect(screen.getByText(/image\/pdf:/i)).toBeInTheDocument();
      expect(screen.getByText(/docx:/i)).toBeInTheDocument();
    });
  });

  describe('Advanced Features Section', () => {
    it('should render advanced features heading', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/advanced features/i)).toBeInTheDocument();
    });

    it('should describe dashboard features', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/other dashboard features/i)).toBeInTheDocument();
      expect(screen.getByText(/sort:/i)).toBeInTheDocument();
      expect(screen.getByText(/search:/i)).toBeInTheDocument();
      expect(screen.getByText(/export:/i)).toBeInTheDocument();
    });

    it('should describe AI settings', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/ai settings \(advanced\)/i)).toBeInTheDocument();
      expect(screen.getByText(/essay grading prompt/i)).toBeInTheDocument();
      expect(screen.getByText(/ocr cleanup prompt/i)).toBeInTheDocument();
      expect(screen.getByText(/rubric enhancement prompt/i)).toBeInTheDocument();
    });
  });

  describe('Tips & Tricks Section', () => {
    it('should render tips heading', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/tips & tricks/i)).toBeInTheDocument();
    });

  });

  describe('Questions Section', () => {
    it('should render questions section', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/still have questions\?/i)).toBeInTheDocument();
    });

    it('should provide basic steps summary', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/enter student name/i)).toBeInTheDocument();
      expect(screen.getByText(/add grading rules/i)).toBeInTheDocument();
      expect(screen.getByText(/upload essay/i)).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render with proper structure', () => {
      const { container } = renderWithProviders(<Help />);

      // Should have cards
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
