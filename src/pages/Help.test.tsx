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
      expect(screen.getByText(/intelligent grading assistant for all core subjects/i)).toBeInTheDocument();
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

    it('should have tab-specific subsections', () => {
      renderWithProviders(<Help />);

      // Use getAllBy since there are quick links AND headings for each tab
      expect(screen.getAllByText(/dashboard tab/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/grade tab/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/students tab/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should describe dashboard features', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/view modes/i)).toBeInTheDocument();
      expect(screen.getByText(/📋 list view/i)).toBeInTheDocument();
      expect(screen.getByText(/📂 by assignment/i)).toBeInTheDocument();
    });

    it('should describe grade tab features', () => {
      renderWithProviders(<Help />);

      expect(screen.getByRole('heading', { name: /creating assignments/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /draft comparison/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /pdf annotations/i })).toBeInTheDocument();
    });

    it('should describe FERPA and Bridge features', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/ferpa compliance/i)).toBeInTheDocument();
      expect(screen.getByText(/names stay local:/i)).toBeInTheDocument();
      expect(screen.getByText(/managing your bridge file/i)).toBeInTheDocument();
    });

    it('should describe passphrase best practices', () => {
      renderWithProviders(<Help />);

      expect(screen.getByText(/passphrase best practices/i)).toBeInTheDocument();
      expect(screen.getByText(/strong, memorable passphrase/i)).toBeInTheDocument();
      expect(screen.getByText(/lock the bridge/i)).toBeInTheDocument();
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
