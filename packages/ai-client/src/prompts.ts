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
// OpenAI Structured Outputs requires additionalProperties: false on all objects
export const JSON_SCHEMAS = {
  recognition: {
    type: 'object',
    required: ['best', 'alternatives', 'evidence', 'needsConfirmation'],
    additionalProperties: false,
    properties: {
      best: {
        type: 'object',
        required: ['title', 'edition', 'languageGuess', 'confidence'],
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          edition: { type: ['string', 'null'] },
          languageGuess: { type: ['string', 'null'], enum: ['DE', 'EN', 'FR', 'ES', 'IT', 'NL', 'OTHER', null] },
          confidence: { type: 'integer' }
        }
      },
      alternatives: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'edition', 'confidence'],
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            edition: { type: ['string', 'null'] },
            confidence: { type: 'integer' }
          }
        }
      },
      evidence: {
        type: 'object',
        required: ['visibleText', 'visualCues'],
        additionalProperties: false,
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
    required: ['normalizedTitle', 'keywords', 'editionHints'],
    additionalProperties: false,
    properties: {
      normalizedTitle: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } },
      editionHints: { type: ['string', 'null'] }
    }
  },

  pricing: {
    type: 'object',
    required: ['recommendedPrice', 'quickSalePrice', 'negotiationAnchor', 'rangeLow', 'rangeHigh', 'reasoningBullets', 'confidence'],
    additionalProperties: false,
    properties: {
      recommendedPrice: { type: 'number' },
      quickSalePrice: { type: 'number' },
      negotiationAnchor: { type: 'number' },
      rangeLow: { type: 'number' },
      rangeHigh: { type: 'number' },
      reasoningBullets: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'integer' }
    }
  },

  listing: {
    type: 'object',
    required: ['titleVariants', 'description', 'bulletPoints', 'searchTags'],
    additionalProperties: false,
    properties: {
      titleVariants: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'style'],
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            style: { type: 'string', enum: ['NEUTRAL', 'URGENT', 'FRIENDLY'] }
          }
        }
      },
      description: { type: 'string' },
      bulletPoints: { type: 'array', items: { type: 'string' } },
      searchTags: { type: 'array', items: { type: 'string' } }
    }
  }
};
