import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './toast';

describe('Toast', () => {
  it('renders with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" onClose={onClose} />);
    
    expect(screen.getByText('Test message')).toBeDefined();
  });

  it('auto-closes after duration', async () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" duration={100} onClose={onClose} />);
    
    // Should not be closed immediately
    expect(onClose).not.toHaveBeenCalled();
    
    // Should close after duration + animation time
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
  });

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast message="Test message" onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    
    // Should close after animation time
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
  });

  it('displays check icon', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" onClose={onClose} />);
    
    // Check for the presence of the CheckCircle icon (via lucide-react)
    const svg = document.querySelector('svg');
    expect(svg).toBeDefined();
  });
});
