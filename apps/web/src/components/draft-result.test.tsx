import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftResult } from './draft-result';
import type { DraftResponse } from '@i2k/shared';

const mockDraft: DraftResponse = {
  scanId: 'test-scan-id',
  titleVariants: [
    { title: 'Catan - Sehr gut erhalten', style: 'NEUTRAL' },
    { title: 'Catan TOP Zustand!', style: 'URGENT' },
    { title: 'Catan sucht neues Zuhause', style: 'FRIENDLY' }
  ],
  description: 'Verkaufe hier mein Catan Basisspiel in gutem Zustand. Vollständig und aus Nichtraucherhaushalt.',
  bulletPoints: ['Zustand: Gut', 'Vollständig', 'Deutsch', 'Nichtraucher', 'Versand möglich'],
  searchTags: ['catan', 'brettspiel', 'siedler', 'familienspiel', 'kosmos'],
  suggestedPrice: 25,
  metadata: {
    gameTitle: 'Die Siedler von Catan',
    condition: 'GOOD',
    language: 'DE',
    isComplete: true
  }
};

describe('DraftResult', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title variants', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByText('Catan - Sehr gut erhalten')).toBeInTheDocument();
    expect(screen.getByText('Catan TOP Zustand!')).toBeInTheDocument();
    expect(screen.getByText('Catan sucht neues Zuhause')).toBeInTheDocument();
  });

  it('renders style labels for variants', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Dringend')).toBeInTheDocument();
    expect(screen.getByText('Freundlich')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByDisplayValue(/Verkaufe hier mein Catan/)).toBeInTheDocument();
  });

  it('renders bullet points', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByText('Zustand: Gut')).toBeInTheDocument();
    expect(screen.getByText('Vollständig')).toBeInTheDocument();
    expect(screen.getByText('Versand möglich')).toBeInTheDocument();
  });

  it('renders search tags', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByText('catan')).toBeInTheDocument();
    expect(screen.getByText('brettspiel')).toBeInTheDocument();
    expect(screen.getByText('siedler')).toBeInTheDocument();
  });

  it('renders suggested price', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByText('25 €')).toBeInTheDocument();
  });

  it('allows selecting different title', async () => {
    const user = userEvent.setup();
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    // Click on the urgent variant
    await user.click(screen.getByText('Catan TOP Zustand!'));

    // It should now be highlighted (has border-primary class)
    const button = screen.getByText('Catan TOP Zustand!').closest('button');
    expect(button).toHaveClass('border-primary');
  });

  it('copies title to clipboard', async () => {
    const user = userEvent.setup();
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    // Find copy buttons and click the first one (for title)
    const copyButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg')?.classList.contains('lucide-copy')
    );
    await user.click(copyButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Catan - Sehr gut erhalten');
  });

  it('copies all content to clipboard', async () => {
    const user = userEvent.setup();
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    await user.click(screen.getByText('Alles kopieren'));

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const calledWith = (navigator.clipboard.writeText as any).mock.calls[0][0];
    expect(calledWith).toContain('Catan - Sehr gut erhalten');
    expect(calledWith).toContain('Verkaufe hier mein Catan');
    expect(calledWith).toContain('25 €');
  });

  it('shows character count for description', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByText(/\/ 1.200 Zeichen/)).toBeInTheDocument();
  });

  it('renders metadata', () => {
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    expect(screen.getByText(/Die Siedler von Catan/)).toBeInTheDocument();
    expect(screen.getByText(/Vollständig/)).toBeInTheDocument();
  });

  it('calls onReset when clicking Neu button', async () => {
    const user = userEvent.setup();
    render(<DraftResult draft={mockDraft} onReset={mockOnReset} />);

    await user.click(screen.getByText('Neu'));

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });
});
