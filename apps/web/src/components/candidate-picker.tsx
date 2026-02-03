'use client';

import React, { useState } from 'react';
import { Check, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Progress } from './ui/progress';
import type { AiCandidate, GameCondition, GameLanguage } from '@i2k/shared';

interface CandidatePickerProps {
  candidates: AiCandidate[];
  evidence?: {
    visibleText: string[];
    visualCues: string[];
  };
  onConfirm: (data: {
    title: string;
    edition?: string;
    language: GameLanguage;
    condition: GameCondition;
    isComplete: boolean;
  }) => void;
  isLoading?: boolean;
}

const CONDITIONS: { value: GameCondition; label: string }[] = [
  { value: 'NEW', label: 'Neu (originalverpackt)' },
  { value: 'LIKE_NEW', label: 'Wie neu' },
  { value: 'VERY_GOOD', label: 'Sehr gut' },
  { value: 'GOOD', label: 'Gut' },
  { value: 'ACCEPTABLE', label: 'Akzeptabel' },
];

const LANGUAGES: { value: GameLanguage; label: string }[] = [
  { value: 'DE', label: 'Deutsch' },
  { value: 'EN', label: 'Englisch' },
  { value: 'FR', label: 'Französisch' },
  { value: 'ES', label: 'Spanisch' },
  { value: 'IT', label: 'Italienisch' },
  { value: 'NL', label: 'Niederländisch' },
  { value: 'OTHER', label: 'Andere' },
];

export function CandidatePicker({
  candidates,
  evidence,
  onConfirm,
  isLoading,
}: CandidatePickerProps) {
  const bestCandidate = candidates[0];
  const alternatives = candidates.slice(1);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(bestCandidate?.title || '');
  const [edition, setEdition] = useState(bestCandidate?.edition || '');
  const [language, setLanguage] = useState<GameLanguage>(
    bestCandidate?.languageGuess || 'DE'
  );
  const [condition, setCondition] = useState<GameCondition>('GOOD');
  const [isComplete, setIsComplete] = useState(true);

  const selectCandidate = (candidate: AiCandidate) => {
    setTitle(candidate.title);
    setEdition(candidate.edition || '');
    setLanguage(candidate.languageGuess || 'DE');
  };

  const handleConfirm = () => {
    onConfirm({
      title,
      edition: edition || undefined,
      language,
      condition,
      isComplete,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Spiel erkannt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best Match */}
        {bestCandidate && !isEditing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bester Treffer</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Bearbeiten
              </Button>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold text-lg">{title}</h3>
              {edition && (
                <p className="text-sm text-muted-foreground">{edition}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Progress value={bestCandidate.confidence} className="h-2 flex-1" />
                <span className="text-sm font-medium">{bestCandidate.confidence}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Spieltitel eingeben"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edition">Edition (optional)</Label>
              <Input
                id="edition"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="z.B. Jubiläumsausgabe"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <Check className="w-4 h-4 mr-1" />
              Fertig
            </Button>
          </div>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && !isEditing && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Alternativen</span>
            <div className="space-y-2">
              {alternatives.map((alt, i) => (
                <button
                  key={i}
                  onClick={() => selectCandidate(alt)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{alt.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {alt.confidence}%
                    </span>
                  </div>
                  {alt.edition && (
                    <span className="text-sm text-muted-foreground">
                      {alt.edition}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        {evidence && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Erkannte Hinweise</span>
            <div className="flex flex-wrap gap-1">
              {evidence.visibleText.map((text, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-primary/10 rounded-full"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Game Details */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Sprache</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as GameLanguage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zustand</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as GameCondition)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isComplete"
              checked={isComplete}
              onChange={(e) => setIsComplete(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="isComplete" className="cursor-pointer">
              Spiel ist vollständig
            </Label>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          className="w-full"
          disabled={!title || isLoading}
        >
          {isLoading ? 'Wird verarbeitet...' : 'Bestätigen & Preis ermitteln'}
        </Button>
      </CardContent>
    </Card>
  );
}
