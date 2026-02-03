export const PROMPTS = {
  recognition: {
    system: `Du bist ein präziser Produkt-Identifikationsassistent für Brettspiele.
Antworte ausschließlich im vorgegebenen JSON-Schema.
Wenn du unsicher bist, liefere mehrere Kandidaten und senke die Confidence.
Erfinde keine Editionen/Verlage, wenn du sie nicht aus dem Bild ableiten kannst.`,
    user: `Analysiere das Foto. Erkenne Titel und falls möglich Edition/Sprache.
Gib eine Kandidatenliste mit Confidence (0–100) zurück.
Extrahiere sichtbaren Text (z.B. Titel, Verlag, Untertitel) als Evidence.`
  },

  normalization: {
    system: `Du normalisierst Brettspiel-Titel für Datenhaltung.
Keine Fantasie-Zusätze. Gib Varianten/Keywords zurück.
Antworte ausschließlich im JSON-Format.`,
    user: (userInput: string, originalSuggestion?: string) =>
      `Normalisiere den folgenden Brettspiel-Titel:
User-Eingabe: "${userInput}"
${originalSuggestion ? `Ursprünglicher Vorschlag: "${originalSuggestion}"` : ''}

Gib zurück:
- normalizedTitle: Der korrekte, vollständige Titel
- keywords: Suchbegriffe (Array)
- editionHints: Hinweise auf Edition falls erkennbar`
  },

  pricing: {
    system: `Du bist ein Pricing-Analyst für Gebraucht-Brettspiele in Deutschland.
Nutze ausschließlich die übergebenen PriceSamples und den Zustand.
Gib eine Empfehlung (Schnellverkauf vs. Verhandlung) + kurze Begründung.
Antworte ausschließlich im JSON-Format.
Alle Preise in EUR.`,
    user: (
      gameTitle: string,
      condition: string,
      isComplete: boolean,
      samples: { source: string; price: number; conditionHint?: string }[]
    ) => `Spiel: ${gameTitle}
Zustand: ${condition}
Vollständig: ${isComplete ? 'Ja' : 'Nein'}

Preis-Samples:
${samples.map(s => `- ${s.source}: ${s.price}€ ${s.conditionHint ? `(${s.conditionHint})` : ''}`).join('\n')}

Berechne:
- recommendedPrice: Empfohlener Verkaufspreis
- quickSalePrice: Schnellverkaufspreis (sofort weg)
- negotiationAnchor: Startpreis für Verhandlung
- rangeLow/rangeHigh: Realistische Preisspanne
- reasoningBullets: Kurze Begründungspunkte (Array)
- confidence: Wie sicher bist du? (0-100)`
  },

  listing: {
    system: `Du schreibst verkaufsstarke Kleinanzeigen-Texte auf Deutsch.
Klar, freundlich, ehrlich. Keine unseriösen Versprechen.
Nutze kurze Absätze, Zustand/Umfang/Abholung/Versand/PayPal-Hinweise.
Antworte ausschließlich im JSON-Format.`,
    user: (params: {
      gameTitle: string;
      edition?: string;
      condition: string;
      language: string;
      isComplete: boolean;
      price: number;
      pickupLocation?: string;
      shippingAvailable: boolean;
      paypalAvailable: boolean;
      additionalNotes?: string;
    }) => `Spiel: ${params.gameTitle}${params.edition ? ` (${params.edition})` : ''}
Zustand: ${params.condition}
Vollständig: ${params.isComplete ? 'Ja' : 'Nein/Unsicher'}
Sprache: ${params.language}
${params.pickupLocation ? `Abholung: ${params.pickupLocation}` : 'Nur Versand'}
Versand möglich: ${params.shippingAvailable ? 'Ja' : 'Nein'}
PayPal: ${params.paypalAvailable ? 'Ja' : 'Nein'}
Preis: ${params.price}€
${params.additionalNotes ? `Zusätzliche Hinweise: ${params.additionalNotes}` : ''}

Erstelle:
1) titleVariants: 3 Titel-Varianten (max 65 Zeichen), mit style: NEUTRAL, URGENT, FRIENDLY
2) description: Beschreibung (max 1.200 Zeichen)
3) bulletPoints: 5 Bulletpoints
4) searchTags: 5 Such-Tags`
  }
};

// JSON Schemas for structured outputs
export const JSON_SCHEMAS = {
  recognition: {
    type: 'object',
    required: ['best', 'alternatives', 'evidence', 'needsConfirmation'],
    properties: {
      best: {
        type: 'object',
        required: ['title', 'confidence'],
        properties: {
          title: { type: 'string' },
          edition: { type: 'string' },
          languageGuess: { type: 'string', enum: ['DE', 'EN', 'FR', 'ES', 'IT', 'NL', 'OTHER'] },
          confidence: { type: 'integer', minimum: 0, maximum: 100 }
        }
      },
      alternatives: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'confidence'],
          properties: {
            title: { type: 'string' },
            edition: { type: 'string' },
            confidence: { type: 'integer', minimum: 0, maximum: 100 }
          }
        }
      },
      evidence: {
        type: 'object',
        required: ['visibleText', 'visualCues'],
        properties: {
          visibleText: { type: 'array', items: { type: 'string' } },
          visualCues: { type: 'array', items: { type: 'string' } }
        }
      },
      needsConfirmation: { type: 'boolean' }
    }
  },

  normalization: {
    type: 'object',
    required: ['normalizedTitle', 'keywords'],
    properties: {
      normalizedTitle: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } },
      editionHints: { type: 'string' }
    }
  },

  pricing: {
    type: 'object',
    required: ['recommendedPrice', 'quickSalePrice', 'negotiationAnchor', 'rangeLow', 'rangeHigh', 'reasoningBullets', 'confidence'],
    properties: {
      recommendedPrice: { type: 'number' },
      quickSalePrice: { type: 'number' },
      negotiationAnchor: { type: 'number' },
      rangeLow: { type: 'number' },
      rangeHigh: { type: 'number' },
      reasoningBullets: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'integer', minimum: 0, maximum: 100 }
    }
  },

  listing: {
    type: 'object',
    required: ['titleVariants', 'description', 'bulletPoints', 'searchTags'],
    properties: {
      titleVariants: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'style'],
          properties: {
            title: { type: 'string', maxLength: 65 },
            style: { type: 'string', enum: ['NEUTRAL', 'URGENT', 'FRIENDLY'] }
          }
        },
        minItems: 3,
        maxItems: 3
      },
      description: { type: 'string', maxLength: 1500 },
      bulletPoints: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 5 },
      searchTags: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 5 }
    }
  }
};
