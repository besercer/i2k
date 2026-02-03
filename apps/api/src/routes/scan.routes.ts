import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { scanService } from '../services/scan.service';
import {
  ConfirmScanRequestSchema,
  PricingRequestSchema,
  DraftRequestSchema,
  GameCondition,
  GameLanguage
} from '@i2k/shared';
import { AppError } from '../plugins/error-handler';
import { ErrorCodes } from '@i2k/shared';

export const scanRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // POST /v1/scans - Upload new image for scanning
  app.post('/', {
    schema: {
      tags: ['scans'],
      summary: 'Upload an image for board game recognition',
      consumes: ['multipart/form-data'],
      response: {
        201: {
          type: 'object',
          properties: {
            scanId: { type: 'string', format: 'uuid' },
            status: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'No file uploaded', 400);
    }

    const sessionId = request.headers['x-session-id'] as string | undefined;

    const result = await scanService.createScan(
      data.file,
      data.mimetype,
      data.filename,
      sessionId
    );

    return reply.status(201).send(result);
  });

  // GET /v1/scans/:id - Get scan status and results
  app.get<{ Params: { id: string } }>('/:id', {
    schema: {
      tags: ['scans'],
      summary: 'Get scan status and recognition results',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            candidates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  edition: { type: 'string' },
                  languageGuess: { type: 'string' },
                  confidence: { type: 'integer' }
                }
              }
            },
            evidence: {
              type: 'object',
              properties: {
                visibleText: { type: 'array', items: { type: 'string' } },
                visualCues: { type: 'array', items: { type: 'string' } }
              }
            },
            confirmedTitle: { type: 'string' },
            confirmedEdition: { type: 'string' },
            confirmedLanguage: { type: 'string' },
            confirmedCondition: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const scan = await scanService.getScan(id);

    return reply.send({
      id: scan.id,
      status: scan.status,
      createdAt: scan.createdAt.toISOString(),
      candidates: scan.aiCandidates || undefined,
      evidence: scan.aiEvidence || undefined,
      confirmedTitle: scan.confirmedTitle || undefined,
      confirmedEdition: scan.confirmedEdition || undefined,
      confirmedLanguage: scan.confirmedLanguage || undefined,
      confirmedCondition: scan.confirmedCondition || undefined,
      error: scan.errorMessage || undefined
    });
  });

  // POST /v1/scans/:id/confirm - Confirm or edit the recognized game
  app.post<{ Params: { id: string }; Body: unknown }>('/:id/confirm', {
    schema: {
      tags: ['scans'],
      summary: 'Confirm or edit the recognized game details',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['title', 'language', 'condition', 'isComplete'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          edition: { type: 'string', maxLength: 100 },
          language: { type: 'string', enum: ['DE', 'EN', 'FR', 'ES', 'IT', 'NL', 'OTHER'] },
          condition: { type: 'string', enum: ['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE'] },
          isComplete: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            scanId: { type: 'string', format: 'uuid' },
            normalizedTitle: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            status: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const body = ConfirmScanRequestSchema.parse(request.body);

    const result = await scanService.confirmScan(id, {
      title: body.title,
      edition: body.edition,
      language: body.language as GameLanguage,
      condition: body.condition as GameCondition,
      isComplete: body.isComplete
    });

    return reply.send(result);
  });

  // POST /v1/scans/:id/pricing - Get price suggestions
  app.post<{ Params: { id: string }; Body: unknown }>('/:id/pricing', {
    schema: {
      tags: ['scans'],
      summary: 'Calculate price suggestions based on market data',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          manualPrices: {
            type: 'array',
            items: {
              type: 'object',
              required: ['price'],
              properties: {
                price: { type: 'number', minimum: 0 },
                conditionHint: { type: 'string' },
                source: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            scanId: { type: 'string', format: 'uuid' },
            recommendedPrice: { type: 'number' },
            quickSalePrice: { type: 'number' },
            negotiationAnchor: { type: 'number' },
            rangeLow: { type: 'number' },
            rangeHigh: { type: 'number' },
            samples: { type: 'array' },
            reasoningBullets: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'integer' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const body = PricingRequestSchema.parse(request.body || {});

    const result = await scanService.calculatePricing(id, {
      manualPrices: body.manualPrices?.prices
    });

    return reply.send(result);
  });

  // POST /v1/scans/:id/draft - Generate listing draft
  app.post<{ Params: { id: string }; Body: unknown }>('/:id/draft', {
    schema: {
      tags: ['scans'],
      summary: 'Generate Kleinanzeigen-optimized listing draft',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['price'],
        properties: {
          price: { type: 'number', minimum: 0 },
          pickupLocation: { type: 'string', maxLength: 100 },
          shippingAvailable: { type: 'boolean' },
          paypalAvailable: { type: 'boolean' },
          additionalNotes: { type: 'string', maxLength: 500 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            scanId: { type: 'string', format: 'uuid' },
            titleVariants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  style: { type: 'string' }
                }
              }
            },
            description: { type: 'string' },
            bulletPoints: { type: 'array', items: { type: 'string' } },
            searchTags: { type: 'array', items: { type: 'string' } },
            suggestedPrice: { type: 'number' },
            metadata: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const body = DraftRequestSchema.parse(request.body);

    const result = await scanService.generateDraft(id, {
      price: body.price,
      pickupLocation: body.pickupLocation,
      shippingAvailable: body.shippingAvailable,
      paypalAvailable: body.paypalAvailable,
      additionalNotes: body.additionalNotes
    });

    return reply.send(result);
  });
};
