import { describe, it, expect } from 'vitest';
import {
  ScanStatusSchema,
  GameConditionSchema,
  GameLanguageSchema,
  AiCandidateSchema,
  AiEvidenceSchema,
  AiRecognitionResultSchema,
  CreateScanResponseSchema,
  GetScanResponseSchema,
  ConfirmScanRequestSchema,
  ConfirmScanResponseSchema
} from './scan';

describe('ScanStatusSchema', () => {
  it('should accept valid scan statuses', () => {
    const validStatuses = ['UPLOADED', 'ANALYZING', 'ANALYZED', 'PRICING', 'PRICED', 'DRAFTING', 'DRAFTED', 'ERROR'];
    validStatuses.forEach(status => {
      expect(ScanStatusSchema.parse(status)).toBe(status);
    });
  });

  it('should reject invalid scan status', () => {
    expect(() => ScanStatusSchema.parse('INVALID')).toThrow();
  });
});

describe('GameConditionSchema', () => {
  it('should accept valid game conditions', () => {
    const validConditions = ['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE'];
    validConditions.forEach(condition => {
      expect(GameConditionSchema.parse(condition)).toBe(condition);
    });
  });

  it('should reject invalid game condition', () => {
    expect(() => GameConditionSchema.parse('POOR')).toThrow();
  });
});

describe('GameLanguageSchema', () => {
  it('should accept valid languages', () => {
    const validLanguages = ['DE', 'EN', 'FR', 'ES', 'IT', 'NL', 'OTHER'];
    validLanguages.forEach(lang => {
      expect(GameLanguageSchema.parse(lang)).toBe(lang);
    });
  });

  it('should reject invalid language', () => {
    expect(() => GameLanguageSchema.parse('JP')).toThrow();
  });
});

describe('AiCandidateSchema', () => {
  it('should accept valid AI candidate', () => {
    const candidate = {
      title: 'Die Siedler von Catan',
      edition: 'Basisspiel',
      languageGuess: 'DE',
      confidence: 95
    };
    expect(AiCandidateSchema.parse(candidate)).toEqual(candidate);
  });

  it('should accept candidate without optional fields', () => {
    const candidate = {
      title: 'Catan',
      confidence: 80
    };
    expect(AiCandidateSchema.parse(candidate)).toEqual(candidate);
  });

  it('should reject candidate with empty title', () => {
    expect(() => AiCandidateSchema.parse({ title: '', confidence: 80 })).toThrow();
  });

  it('should reject candidate with confidence > 100', () => {
    expect(() => AiCandidateSchema.parse({ title: 'Test', confidence: 150 })).toThrow();
  });

  it('should reject candidate with confidence < 0', () => {
    expect(() => AiCandidateSchema.parse({ title: 'Test', confidence: -5 })).toThrow();
  });
});

describe('AiEvidenceSchema', () => {
  it('should accept valid evidence', () => {
    const evidence = {
      visibleText: ['CATAN', 'KOSMOS'],
      visualCues: ['Hexagonal board', 'Resource cards']
    };
    expect(AiEvidenceSchema.parse(evidence)).toEqual(evidence);
  });

  it('should accept empty arrays', () => {
    const evidence = {
      visibleText: [],
      visualCues: []
    };
    expect(AiEvidenceSchema.parse(evidence)).toEqual(evidence);
  });
});

describe('AiRecognitionResultSchema', () => {
  it('should accept valid recognition result', () => {
    const result = {
      best: {
        title: 'Catan',
        confidence: 90
      },
      alternatives: [
        { title: 'Settlers', confidence: 30 }
      ],
      evidence: {
        visibleText: ['CATAN'],
        visualCues: ['Board game box']
      },
      needsConfirmation: false
    };
    expect(AiRecognitionResultSchema.parse(result)).toEqual(result);
  });
});

describe('CreateScanResponseSchema', () => {
  it('should accept valid create scan response', () => {
    const response = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'UPLOADED'
    };
    expect(CreateScanResponseSchema.parse(response)).toEqual(response);
  });

  it('should reject invalid UUID', () => {
    expect(() => CreateScanResponseSchema.parse({
      scanId: 'not-a-uuid',
      status: 'UPLOADED'
    })).toThrow();
  });
});

describe('GetScanResponseSchema', () => {
  it('should accept valid get scan response', () => {
    const response = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'ANALYZED',
      createdAt: '2024-01-15T12:00:00.000Z',
      candidates: [{ title: 'Catan', confidence: 90 }],
      evidence: { visibleText: ['CATAN'], visualCues: [] }
    };
    expect(GetScanResponseSchema.parse(response)).toEqual(response);
  });

  it('should accept minimal response', () => {
    const response = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'UPLOADED',
      createdAt: '2024-01-15T12:00:00.000Z'
    };
    expect(GetScanResponseSchema.parse(response)).toEqual(response);
  });
});

describe('ConfirmScanRequestSchema', () => {
  it('should accept valid confirm request', () => {
    const request = {
      title: 'Die Siedler von Catan',
      edition: 'Basisspiel',
      language: 'DE',
      condition: 'GOOD',
      isComplete: true
    };
    expect(ConfirmScanRequestSchema.parse(request)).toEqual(request);
  });

  it('should reject title over 200 characters', () => {
    expect(() => ConfirmScanRequestSchema.parse({
      title: 'a'.repeat(201),
      language: 'DE',
      condition: 'GOOD',
      isComplete: true
    })).toThrow();
  });

  it('should accept request without optional edition', () => {
    const request = {
      title: 'Catan',
      language: 'EN',
      condition: 'NEW',
      isComplete: true
    };
    expect(ConfirmScanRequestSchema.parse(request)).toEqual(request);
  });
});

describe('ConfirmScanResponseSchema', () => {
  it('should accept valid confirm response', () => {
    const response = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      normalizedTitle: 'Die Siedler von Catan',
      keywords: ['catan', 'siedler', 'brettspiel'],
      status: 'ANALYZED'
    };
    expect(ConfirmScanResponseSchema.parse(response)).toEqual(response);
  });
});
