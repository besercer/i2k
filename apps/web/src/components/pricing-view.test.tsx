import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingView } from './pricing-view';
import type { PricingResponse } from '@i2k/shared';

const mockPricing: PricingResponse = {
  scanId: 'test-scan-id',
  recommendedPrice: 25,
  quickSalePrice: 20,
  negotiationAnchor: 30,
  rangeLow: 18,
  rangeHigh: 35,
  samples: [],
  reasoningBullets: ['Based on market analysis', 'Good condition'],
  confidence: 85
};

describe('PricingView', () => {
  const mockOnRequestPricing = vi.fn();
  const mockOnContinue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('without pricing data', () => {
    it('renders manual price input form', () => {
      render(
        <PricingView
          pricing={null}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Preisrecherche')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Preis in €')).toBeInTheDocument();
    });

    it('allows adding manual prices', async () => {
      const user = userEvent.setup();
      render(
        <PricingView
          pricing={null}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      await user.click(screen.getByText('Weiteren Preis'));

      const priceInputs = screen.getAllByPlaceholderText('Preis in €');
      expect(priceInputs.length).toBe(2);
    });

    it('limits to 5 manual prices', async () => {
      const user = userEvent.setup();
      render(
        <PricingView
          pricing={null}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      // Add 4 more prices (1 already exists)
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Weiteren Preis'));
      }

      // Button should not be visible anymore
      expect(screen.queryByText('Weiteren Preis')).not.toBeInTheDocument();
    });

    it('calls onRequestPricing with entered prices', async () => {
      const user = userEvent.setup();
      render(
        <PricingView
          pricing={null}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      await user.type(screen.getByPlaceholderText('Preis in €'), '25');
      await user.click(screen.getByText('Preis ermitteln'));

      expect(mockOnRequestPricing).toHaveBeenCalledWith([
        { price: 25, conditionHint: undefined }
      ]);
    });

    it('calls onRequestPricing without prices when empty', async () => {
      const user = userEvent.setup();
      render(
        <PricingView
          pricing={null}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      await user.click(screen.getByText('Preis ermitteln'));

      expect(mockOnRequestPricing).toHaveBeenCalledWith(undefined);
    });
  });

  describe('with pricing data', () => {
    it('renders recommended price', () => {
      render(
        <PricingView
          pricing={mockPricing}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('25 €')).toBeInTheDocument();
      expect(screen.getByText('Empfohlener Preis')).toBeInTheDocument();
    });

    it('renders price options', () => {
      render(
        <PricingView
          pricing={mockPricing}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('20 €')).toBeInTheDocument();
      expect(screen.getByText('Schnellverkauf')).toBeInTheDocument();
      expect(screen.getByText('30 €')).toBeInTheDocument();
      expect(screen.getByText('Mit Verhandlung')).toBeInTheDocument();
    });

    it('renders reasoning bullets', () => {
      render(
        <PricingView
          pricing={mockPricing}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Based on market analysis')).toBeInTheDocument();
      expect(screen.getByText('Good condition')).toBeInTheDocument();
    });

    it('allows selecting quick sale price', async () => {
      const user = userEvent.setup();
      render(
        <PricingView
          pricing={mockPricing}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      await user.click(screen.getByText('Schnellverkauf').closest('button')!);
      await user.click(screen.getByText('Anzeige erstellen'));

      expect(mockOnContinue).toHaveBeenCalledWith(20);
    });

    it('allows entering custom price', async () => {
      const user = userEvent.setup();
      render(
        <PricingView
          pricing={mockPricing}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      const customInput = screen.getByPlaceholderText('25');
      await user.type(customInput, '28');
      await user.click(screen.getByText('Anzeige erstellen'));

      expect(mockOnContinue).toHaveBeenCalledWith(28);
    });

    it('disables continue without selected price', () => {
      render(
        <PricingView
          pricing={mockPricing}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Anzeige erstellen').closest('button')).toBeDisabled();
    });

    it('shows loading state', () => {
      render(
        <PricingView
          pricing={mockPricing}
          gameTitle="Catan"
          onRequestPricing={mockOnRequestPricing}
          onContinue={mockOnContinue}
          isLoading={true}
        />
      );

      expect(screen.getByText('Wird erstellt...')).toBeInTheDocument();
    });
  });
});
