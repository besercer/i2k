'use client';

import React, { useState, useCallback } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import { CandidatePicker } from '@/components/candidate-picker';
import { PricingView } from '@/components/pricing-view';
import { DraftResult } from '@/components/draft-result';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import type {
  GetScanResponse,
  PricingResponse,
  DraftResponse,
  AiCandidate,
  GameCondition,
  GameLanguage,
} from '@i2k/shared';

type AppStep = 'capture' | 'analyzing' | 'confirm' | 'pricing' | 'draft' | 'result';

export default function Home() {
  const { toast } = useToast();
  const [step, setStep] = useState<AppStep>('capture');
  const [isLoading, setIsLoading] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanData, setScanData] = useState<GetScanResponse | null>(null);
  const [pricingData, setPricingData] = useState<PricingResponse | null>(null);
  const [draftData, setDraftData] = useState<DraftResponse | null>(null);
  const [confirmedTitle, setConfirmedTitle] = useState<string>('');

  const handleCapture = useCallback(async (file: File) => {
    setIsLoading(true);
    setStep('analyzing');

    try {
      // Upload the image
      const { scanId } = await api.uploadScan(file);
      setScanId(scanId);

      // Poll for analysis results
      const scan = await api.pollScanStatus(scanId, ['ANALYZED', 'ERROR']);

      if (scan.status === 'ERROR') {
        throw new Error(scan.error || 'Analyse fehlgeschlagen');
      }

      setScanData(scan);
      setStep('confirm');
    } catch (error) {
      console.error('Upload/Analysis error:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
      setStep('capture');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleConfirm = useCallback(async (data: {
    title: string;
    edition?: string;
    language: GameLanguage;
    condition: GameCondition;
    isComplete: boolean;
  }) => {
    if (!scanId) return;

    setIsLoading(true);

    try {
      await api.confirmScan(scanId, data);
      setConfirmedTitle(data.title);
      setStep('pricing');
    } catch (error) {
      console.error('Confirm error:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [scanId, toast]);

  const handleRequestPricing = useCallback(async (
    manualPrices?: { price: number; conditionHint?: string }[]
  ) => {
    if (!scanId) return;

    setIsLoading(true);

    try {
      const pricing = await api.getPricing(scanId, {
        manualPrices: manualPrices ? { prices: manualPrices } : undefined,
      });
      setPricingData(pricing);
    } catch (error) {
      console.error('Pricing error:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [scanId, toast]);

  const handleGenerateDraft = useCallback(async (price: number) => {
    if (!scanId) return;

    setIsLoading(true);
    setStep('draft');

    try {
      const draft = await api.generateDraft(scanId, {
        price,
        shippingAvailable: true,
        paypalAvailable: true,
      });
      setDraftData(draft);
      setStep('result');
    } catch (error) {
      console.error('Draft error:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
      setStep('pricing');
    } finally {
      setIsLoading(false);
    }
  }, [scanId, toast]);

  const handleReset = useCallback(() => {
    setScanId(null);
    setScanData(null);
    setPricingData(null);
    setDraftData(null);
    setConfirmedTitle('');
    setStep('capture');
  }, []);

  const getStepProgress = () => {
    const steps: AppStep[] = ['capture', 'analyzing', 'confirm', 'pricing', 'draft', 'result'];
    const currentIndex = steps.indexOf(step);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Brettspiel Scanner</h1>
        <p className="text-muted-foreground text-sm">
          Foto aufnehmen → Spiel erkennen → Anzeige erstellen
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-md mx-auto mb-8">
        <Progress value={getStepProgress()} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span className={step === 'capture' || step === 'analyzing' ? 'text-primary font-medium' : ''}>
            Foto
          </span>
          <span className={step === 'confirm' ? 'text-primary font-medium' : ''}>
            Bestätigen
          </span>
          <span className={step === 'pricing' ? 'text-primary font-medium' : ''}>
            Preis
          </span>
          <span className={step === 'draft' || step === 'result' ? 'text-primary font-medium' : ''}>
            Anzeige
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="fade-in">
        {(step === 'capture' || step === 'analyzing') && (
          <CameraCapture
            onCapture={handleCapture}
            isLoading={isLoading || step === 'analyzing'}
          />
        )}

        {step === 'confirm' && scanData?.candidates && (
          <CandidatePicker
            candidates={scanData.candidates as AiCandidate[]}
            evidence={scanData.evidence as { visibleText: string[]; visualCues: string[] }}
            onConfirm={handleConfirm}
            isLoading={isLoading}
          />
        )}

        {step === 'pricing' && (
          <PricingView
            pricing={pricingData}
            gameTitle={confirmedTitle}
            onRequestPricing={handleRequestPricing}
            onContinue={handleGenerateDraft}
            isLoading={isLoading}
          />
        )}

        {step === 'draft' && (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <p className="text-lg font-medium">Anzeige wird erstellt...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Optimierte Texte werden generiert
              </p>
            </div>
          </div>
        )}

        {step === 'result' && draftData && (
          <DraftResult draft={draftData} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
