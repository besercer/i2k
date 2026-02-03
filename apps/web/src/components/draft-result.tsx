'use client';

import React, { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import type { DraftResponse } from '@i2k/shared';

interface DraftResultProps {
  draft: DraftResponse;
  onReset: () => void;
}

export function DraftResult({ draft, onReset }: DraftResultProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: 'Kopiert!',
        description: `${fieldName} wurde in die Zwischenablage kopiert.`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: 'Fehler',
        description: 'Konnte nicht kopieren. Bitte manuell kopieren.',
        variant: 'destructive',
      });
    }
  };

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, fieldName)}
    >
      {copiedField === fieldName ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  const selectedTitle = draft.titleVariants[selectedTitleIndex];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Deine Anzeige ist fertig!
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Neu
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Titel wählen</label>
            <CopyButton text={selectedTitle.title} fieldName="Titel" />
          </div>
          <div className="space-y-2">
            {draft.titleVariants.map((variant, i) => (
              <button
                key={i}
                onClick={() => setSelectedTitleIndex(i)}
                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                  i === selectedTitleIndex
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
              >
                <p className="font-medium">{variant.title}</p>
                <span className="text-xs text-muted-foreground">
                  {variant.style === 'NEUTRAL' && 'Neutral'}
                  {variant.style === 'URGENT' && 'Dringend'}
                  {variant.style === 'FRIENDLY' && 'Freundlich'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Beschreibung</label>
            <CopyButton text={draft.description} fieldName="Beschreibung" />
          </div>
          <Textarea
            value={draft.description}
            readOnly
            className="min-h-[200px] resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {draft.description.length} / 1.200 Zeichen
          </p>
        </div>

        {/* Bullet Points */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Stichpunkte</label>
            <CopyButton
              text={draft.bulletPoints.map((b) => `• ${b}`).join('\n')}
              fieldName="Stichpunkte"
            />
          </div>
          <ul className="space-y-1 text-sm">
            {draft.bulletPoints.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span>•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Search Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Such-Tags</label>
            <CopyButton
              text={draft.searchTags.join(', ')}
              fieldName="Tags"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.searchTags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 text-sm bg-muted rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Preis</p>
          <p className="text-3xl font-bold">{draft.suggestedPrice.toFixed(0)} €</p>
        </div>

        {/* Copy All Button */}
        <Button
          className="w-full"
          onClick={() => {
            const fullText = `${selectedTitle.title}\n\n${draft.description}\n\n${draft.bulletPoints.map((b) => `• ${b}`).join('\n')}\n\nTags: ${draft.searchTags.join(', ')}\n\nPreis: ${draft.suggestedPrice.toFixed(0)} €`;
            copyToClipboard(fullText, 'Alles');
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          Alles kopieren
        </Button>

        {/* Meta Info */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            {draft.metadata.gameTitle} • {draft.metadata.condition} • {draft.metadata.language}
          </p>
          <p>
            {draft.metadata.isComplete ? 'Vollständig' : 'Möglicherweise unvollständig'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
