import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraCapture } from './camera-capture';

describe('CameraCapture', () => {
  const mockOnCapture = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state with camera and upload buttons', () => {
    render(<CameraCapture onCapture={mockOnCapture} />);

    expect(screen.getByText('Kamera')).toBeInTheDocument();
    expect(screen.getByText('Hochladen')).toBeInTheDocument();
  });

  it('shows placeholder text in idle state', () => {
    render(<CameraCapture onCapture={mockOnCapture} />);

    expect(screen.getByText(/Foto aufnehmen oder hochladen/i)).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<CameraCapture onCapture={mockOnCapture} isLoading={true} />);

    expect(screen.getByText('Kamera').closest('button')).toBeDisabled();
    expect(screen.getByText('Hochladen').closest('button')).toBeDisabled();
  });

  it('handles file upload', async () => {
    const user = userEvent.setup();
    render(<CameraCapture onCapture={mockOnCapture} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Analysieren')).toBeInTheDocument();
    });
  });

  it('rejects non-image files', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<CameraCapture onCapture={mockOnCapture} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(alertMock).toHaveBeenCalledWith('Bitte nur Bilder hochladen');
    alertMock.mockRestore();
  });

  it('rejects files over 12MB', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<CameraCapture onCapture={mockOnCapture} />);

    // Create a file larger than 12MB
    const largeContent = new Array(13 * 1024 * 1024).fill('a').join('');
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(alertMock).toHaveBeenCalledWith('Bild zu groß (max. 12MB)');
    alertMock.mockRestore();
  });

  it('shows preview after selecting file', async () => {
    const user = userEvent.setup();
    render(<CameraCapture onCapture={mockOnCapture} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText('Vorschau')).toBeInTheDocument();
    });
  });

  it('calls onCapture when confirming', async () => {
    const user = userEvent.setup();
    render(<CameraCapture onCapture={mockOnCapture} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Analysieren')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Analysieren'));

    expect(mockOnCapture).toHaveBeenCalledWith(expect.any(File));
  });

  it('shows loading state when analyzing', async () => {
    const user = userEvent.setup();
    render(<CameraCapture onCapture={mockOnCapture} isLoading={false} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Analysieren')).toBeInTheDocument();
    });

    // Re-render with loading
    const { rerender } = render(<CameraCapture onCapture={mockOnCapture} isLoading={true} />);

    // After uploading again with loading state
    await user.upload(input, file);

    rerender(<CameraCapture onCapture={mockOnCapture} isLoading={true} />);
  });
});
