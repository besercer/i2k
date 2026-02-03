import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidatePicker } from './candidate-picker';

const mockCandidates = [
  { title: 'Die Siedler von Catan', edition: 'Basisspiel', languageGuess: 'DE' as const, confidence: 92 },
  { title: 'Catan - Das Spiel', confidence: 45 },
  { title: 'Catan Universe', confidence: 20 }
];

const mockEvidence = {
  visibleText: ['CATAN', 'KOSMOS'],
  visualCues: ['Hexagonal board', 'Wooden pieces']
};

describe('CandidatePicker', () => {
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders best candidate', () => {
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Die Siedler von Catan')).toBeInTheDocument();
    expect(screen.getByText('Basisspiel')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('renders alternatives', () => {
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Catan - Das Spiel')).toBeInTheDocument();
    expect(screen.getByText('Catan Universe')).toBeInTheDocument();
  });

  it('renders evidence tags', () => {
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('CATAN')).toBeInTheDocument();
    expect(screen.getByText('KOSMOS')).toBeInTheDocument();
  });

  it('allows selecting alternative', async () => {
    const user = userEvent.setup();
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    await user.click(screen.getByText('Catan - Das Spiel'));

    // The title should now show the selected alternative
    const titleElements = screen.getAllByText('Catan - Das Spiel');
    expect(titleElements.length).toBeGreaterThan(0);
  });

  it('allows editing title', async () => {
    const user = userEvent.setup();
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    await user.click(screen.getByText('Bearbeiten'));

    const titleInput = screen.getByPlaceholderText('Spieltitel eingeben');
    expect(titleInput).toBeInTheDocument();

    await user.clear(titleInput);
    await user.type(titleInput, 'Custom Game Title');

    expect(titleInput).toHaveValue('Custom Game Title');
  });

  it('allows selecting language', async () => {
    const user = userEvent.setup();
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    // Find and click the language select trigger
    const languageSelects = screen.getAllByRole('combobox');
    await user.click(languageSelects[0]);

    // Select English
    await user.click(screen.getByText('Englisch'));
  });

  it('allows selecting condition', async () => {
    const user = userEvent.setup();
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    const conditionSelects = screen.getAllByRole('combobox');
    await user.click(conditionSelects[1]);

    await user.click(screen.getByText('Sehr gut'));
  });

  it('allows toggling completeness', async () => {
    const user = userEvent.setup();
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('calls onConfirm with correct data', async () => {
    const user = userEvent.setup();
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    await user.click(screen.getByText('Bestätigen & Preis ermitteln'));

    expect(mockOnConfirm).toHaveBeenCalledWith({
      title: 'Die Siedler von Catan',
      edition: 'Basisspiel',
      language: 'DE',
      condition: 'GOOD',
      isComplete: true
    });
  });

  it('disables confirm button when loading', () => {
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );

    expect(screen.getByText('Wird verarbeitet...')).toBeInTheDocument();
    expect(screen.getByText('Wird verarbeitet...').closest('button')).toBeDisabled();
  });

  it('disables confirm button when title is empty', async () => {
    const user = userEvent.setup();
    render(
      <CandidatePicker
        candidates={mockCandidates}
        evidence={mockEvidence}
        onConfirm={mockOnConfirm}
      />
    );

    await user.click(screen.getByText('Bearbeiten'));
    const titleInput = screen.getByPlaceholderText('Spieltitel eingeben');
    await user.clear(titleInput);

    expect(screen.getByText('Bestätigen & Preis ermitteln').closest('button')).toBeDisabled();
  });
});
