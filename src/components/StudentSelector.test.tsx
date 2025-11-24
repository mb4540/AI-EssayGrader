// StudentSelector Component Tests
// Tests for bridge-integrated student selection with PII protection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentSelector from './StudentSelector';
import * as useBridgeModule from '../hooks/useBridge';
import type { BridgeEntry } from '../bridge/bridgeTypes';

// Mock the useBridge hook
vi.mock('../hooks/useBridge');

describe('StudentSelector Component', () => {
  const mockOnChange = vi.fn();
  
  const mockStudents: BridgeEntry[] = [
    { uuid: 'uuid-001', name: 'Alice Johnson', localId: 'A001', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { uuid: 'uuid-002', name: 'Bob Smith', localId: 'B002', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { uuid: 'uuid-003', name: 'Charlie Brown', localId: 'C003', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { uuid: 'uuid-004', name: 'Diana Prince', localId: 'D004', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ];

  const mockBridge = {
    students: mockStudents,
    isLocked: false,
    hasFileHandle: false,
    supportsFileSystem: true,
    createNew: vi.fn(),
    unlock: vi.fn(),
    lock: vi.fn(),
    addStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
    findByUuid: vi.fn((uuid: string) => mockStudents.find(s => s.uuid === uuid) || null),
    findByLocalId: vi.fn(),
    findByName: vi.fn(),
    save: vi.fn(),
    exportFile: vi.fn(),
    importFile: vi.fn(),
    importCsv: vi.fn(),
    getClassPeriods: vi.fn(() => []),
    addClassPeriod: vi.fn(),
    removeClassPeriod: vi.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBridgeModule.useBridge).mockReturnValue(mockBridge);
  });

  describe('Normal Operation', () => {
    it('should render search input with label', () => {
      render(<StudentSelector value="" onChange={mockOnChange} />);

      expect(screen.getByText(/student \*/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search by name or id/i)).toBeInTheDocument();
    });

    it('should show all students in dropdown when focused', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
        expect(screen.getByText('Diana Prince')).toBeInTheDocument();
      });
    });

    it('should filter students by name', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.type(input, 'alice');

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
      });
    });

    it('should filter students by local ID', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.type(input, 'B002');

      await waitFor(() => {
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      });
    });

    it('should be case-insensitive when filtering', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.type(input, 'CHARLIE');

      await waitFor(() => {
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
      });
    });

    it('should show "no students found" message when search has no results', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.type(input, 'NonexistentStudent');

      await waitFor(() => {
        expect(screen.getByText(/no students found matching "nonexistentstudent"/i)).toBeInTheDocument();
      });
    });

    it('should call onChange when student is selected', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      const aliceButton = screen.getByText('Alice Johnson').closest('button');
      await user.click(aliceButton!);

      expect(mockOnChange).toHaveBeenCalledWith('uuid-001', {
        name: 'Alice Johnson',
        localId: 'A001',
      });
    });

    it('should display selected student with check icon', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });

      const bobButton = screen.getByText('Bob Smith').closest('button');
      await user.click(bobButton!);

      // Input should show selected student
      expect(input).toHaveValue('Bob Smith (B002)');
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
      });

      const charlieButton = screen.getByText('Charlie Brown').closest('button');
      await user.click(charlieButton!);

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      });
    });

    it('should clear selection when input is cleared', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.type(input, 'Diana');

      await waitFor(() => {
        expect(screen.getByText('Diana Prince')).toBeInTheDocument();
      });

      const dianaButton = screen.getByText('Diana Prince').closest('button');
      await user.click(dianaButton!);

      // Clear the input
      await user.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should show UUID preview for selected student', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      const aliceButton = screen.getByText('Alice Johnson').closest('button');
      await user.click(aliceButton!);

      // Should show truncated UUID
      expect(screen.getByText(/uuid: uuid-001/i)).toBeInTheDocument();
      expect(screen.getByText(/never sent with name/i)).toBeInTheDocument();
    });

    it('should load selected student when value prop is provided', () => {
      render(<StudentSelector value="uuid-002" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      expect(input).toHaveValue('Bob Smith (B002)');
      expect(mockBridge.findByUuid).toHaveBeenCalledWith('uuid-002');
    });

    it('should display error message when provided', () => {
      render(<StudentSelector value="" onChange={mockOnChange} error="Student is required" />);

      expect(screen.getByText('Student is required')).toBeInTheDocument();
    });

    it('should apply error styling to input when error exists', () => {
      render(<StudentSelector value="" onChange={mockOnChange} error="Required" />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      expect(input).toHaveClass('border-red-300');
    });
  });

  describe('Bridge Locked State', () => {
    beforeEach(() => {
      vi.mocked(useBridgeModule.useBridge).mockReturnValue({
        ...mockBridge,
        isLocked: true,
      });
    });

    it('should show locked warning when bridge is locked', () => {
      render(<StudentSelector value="" onChange={mockOnChange} />);

      expect(screen.getByText('Bridge Locked')).toBeInTheDocument();
      expect(screen.getByText(/please unlock your student bridge/i)).toBeInTheDocument();
    });

    it('should show link to bridge manager when locked', () => {
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const link = screen.getByRole('button', { name: /go to bridge manager/i });
      expect(link).toBeInTheDocument();
    });

    it('should not show search input when bridge is locked', () => {
      render(<StudentSelector value="" onChange={mockOnChange} />);

      expect(screen.queryByPlaceholderText(/search by name or id/i)).not.toBeInTheDocument();
    });
  });

  describe('Empty Bridge State', () => {
    beforeEach(() => {
      vi.mocked(useBridgeModule.useBridge).mockReturnValue({
        ...mockBridge,
        students: [],
      });
    });

    it('should show empty state when no students exist', () => {
      render(<StudentSelector value="" onChange={mockOnChange} />);

      expect(screen.getByText('No Students Yet')).toBeInTheDocument();
      expect(screen.getByText(/add students to your bridge/i)).toBeInTheDocument();
    });

    it('should show link to add students when empty', () => {
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const link = screen.getByRole('button', { name: /add students/i });
      expect(link).toBeInTheDocument();
    });

    it('should not show search input when bridge is empty', () => {
      render(<StudentSelector value="" onChange={mockOnChange} />);

      expect(screen.queryByPlaceholderText(/search by name or id/i)).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Behavior', () => {
    it('should close dropdown on blur with delay', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Blur the input
      await user.tab();

      // Dropdown should close after delay
      await waitFor(() => {
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      }, { timeout: 300 });
    });

    it('should show dropdown when input is focused', async () => {
      const user = userEvent.setup();
      render(<StudentSelector value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search by name or id/i);
      
      // Initially no dropdown
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();

      // Focus input
      await user.click(input);

      // Dropdown should appear
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });
  });
});
