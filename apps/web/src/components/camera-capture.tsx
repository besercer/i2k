'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  isLoading?: boolean;
}

export function CameraCapture({ onCapture, isLoading }: CameraCaptureProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setMode('camera');
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      // Fallback to file upload
      fileInputRef.current?.click();
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `capture-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
      setMode('preview');
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Bitte nur Bilder hochladen');
      return;
    }

    // Validate file size (12MB max)
    if (file.size > 12 * 1024 * 1024) {
      alert('Bild zu groß (max. 12MB)');
      return;
    }

    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode('preview');
  }, []);

  const reset = useCallback(() => {
    stopCamera();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCapturedFile(null);
    setMode('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stopCamera, previewUrl]);

  const confirmCapture = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  }, [capturedFile, onCapture]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        {mode === 'idle' && (
          <div className="flex flex-col gap-4">
            <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Foto aufnehmen oder hochladen</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={startCamera}
                className="flex-1"
                disabled={isLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Kamera
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </Button>
            </div>
          </div>
        )}

        {mode === 'camera' && (
          <div className="flex flex-col gap-4">
            <div className="camera-container bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={reset}
                variant="outline"
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                onClick={capturePhoto}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Foto aufnehmen
              </Button>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex flex-col gap-4">
            <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Vorschau"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={reset}
                variant="outline"
                size="icon"
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={confirmCapture}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Wird analysiert...' : 'Analysieren'}
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
