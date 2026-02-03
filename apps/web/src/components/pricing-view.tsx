'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { PricingResponse } from '@i2k/shared';

interface PricingViewProps {
  pricing?: PricingResponse | null;
  gameTitle: string;
  onRequestPricing: (manualPrices?: { price: number; conditionHint?: string }[]) => void;
  onContinue: (price: number) => void;
  isLoading?: boolean;
}

export function PricingView({
  pricing,
  gameTitle,
  onRequestPricing,
  onContinue,
  isLoading,
}: PricingViewProps) {
  const [manualPrices, setManualPrices] = useState<{ price: string; hint: string }[]>([
    { price: '', hint: '' },
  ]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  const addManualPrice = () => {
    if (manualPrices.length < 5) {
      setManualPrices([...manualPrices, { price: '', hint: '' }]);
    }
  };

  const removeManualPrice = (index: number) => {
    setManualPrices(manualPrices.filter((_, i) => i !== index));
  };

  const updateManualPrice = (index: number, field: 'price' | 'hint', value: string) => {
    const updated = [...manualPrices];
    updated[index][field] = value;
    setManualPrices(updated);
  };

  const handleRequestPricing = () => {
    const validPrices = manualPrices
      .filter((p) => p.price && !isNaN(parseFloat(p.price)))
      .map((p) => ({
        price: parseFloat(p.price),
        conditionHint: p.hint || undefined,
      }));

    onRequestPricing(validPrices.length > 0 ? validPrices : undefined);
  };

  const handleContinue = () => {
    if (selectedPrice) {
      onContinue(selectedPrice);
    }
  };

  // If no pricing yet, show manual input
  if (!pricing) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Preisrecherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Hast du Vergleichspreise gefunden? Gib sie ein für eine bessere
            Empfehlung. Oder überspringe diesen Schritt.
          </p>

          <div className="space-y-4">
            <Label>Vergleichspreise (optional)</Label>
            {manualPrices.map((mp, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    type="number"
                    placeholder="Preis in €"
                    value={mp.price}
                    onChange={(e) => updateManualPrice(i, 'price', e.target.value)}
                  />
                  <Input
                    placeholder="Hinweis (z.B. 'sehr gut')"
                    value={mp.hint}
                    onChange={(e) => updateManualPrice(i, 'hint', e.target.value)}
                  />
                </div>
                {manualPrices.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeManualPrice(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {manualPrices.length < 5 && (
              <Button variant="outline" size="sm" onClick={addManualPrice}>
                <Plus className="w-4 h-4 mr-1" />
                Weiteren Preis
              </Button>
            )}
          </div>

          <Button
            onClick={handleRequestPricing}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Wird berechnet...' : 'Preis ermitteln'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show pricing results
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Preisempfehlung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">{gameTitle}</p>
          <p className="text-4xl font-bold text-primary">
            {pricing.recommendedPrice.toFixed(0)} €
          </p>
          <p className="text-sm text-muted-foreground">Empfohlener Preis</p>
        </div>

        {/* Price Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedPrice(pricing.quickSalePrice)}
            className={`p-4 border rounded-lg text-center transition-colors ${
              selectedPrice === pricing.quickSalePrice
                ? 'border-primary bg-primary/10'
                : 'hover:bg-muted/50'
            }`}
          >
            <p className="text-2xl font-semibold">{pricing.quickSalePrice.toFixed(0)} €</p>
            <p className="text-xs text-muted-foreground">Schnellverkauf</p>
          </button>
          <button
            onClick={() => setSelectedPrice(pricing.negotiationAnchor)}
            className={`p-4 border rounded-lg text-center transition-colors ${
              selectedPrice === pricing.negotiationAnchor
                ? 'border-primary bg-primary/10'
                : 'hover:bg-muted/50'
            }`}
          >
            <p className="text-2xl font-semibold">{pricing.negotiationAnchor.toFixed(0)} €</p>
            <p className="text-xs text-muted-foreground">Mit Verhandlung</p>
          </button>
        </div>

        {/* Custom Price */}
        <div className="space-y-2">
          <Label>Oder eigenen Preis wählen:</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={pricing.recommendedPrice.toFixed(0)}
              onChange={(e) => setSelectedPrice(parseFloat(e.target.value) || null)}
              className="flex-1"
            />
            <span className="flex items-center text-muted-foreground">€</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Empfohlene Spanne: {pricing.rangeLow.toFixed(0)} - {pricing.rangeHigh.toFixed(0)} €
          </p>
        </div>

        {/* Reasoning */}
        {pricing.reasoningBullets.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Begründung:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {pricing.reasoningBullets.map((bullet, i) => (
                <li key={i} className="flex gap-2">
                  <span>•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={handleContinue}
          className="w-full"
          disabled={!selectedPrice || isLoading}
        >
          {isLoading ? 'Wird erstellt...' : (
            <>
              Anzeige erstellen
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
