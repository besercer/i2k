# i2k - Brettspiel Scanner

Eine PWA-Webapp zur automatischen Erkennung von Brettspielen per Foto und Generierung von verkaufsstarken Kleinanzeigen-Texten.

## Features

- **Foto-Upload/Kamera**: Mobile-first PWA mit Kamera-Integration
- **KI-Spielerkennung**: Automatische Identifikation von Brettspielen via Vision AI
- **Preisempfehlung**: Analyse basierend auf manuellen Vergleichspreisen
- **Anzeigen-Generator**: Optimierte Titel und Beschreibungen für Kleinanzeigen

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Fastify, TypeScript
- **Database**: PostgreSQL, Prisma
- **AI**: OpenAI GPT-4o (Vision + Structured Outputs)
- **Infrastructure**: Docker, pnpm Monorepo, Turborepo

## Projektstruktur

```
i2k/
├── apps/
│   ├── api/          # Fastify Backend
│   └── web/          # Next.js PWA Frontend
├── packages/
│   ├── shared/       # Types, Schemas (Zod)
│   ├── database/     # Prisma Client
│   └── ai-client/    # LLM Abstraction
├── docker-compose.yml
└── turbo.json
```

## Schnellstart

### Voraussetzungen

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose
- OpenAI API Key (oder `AI_PROVIDER=mock` für Tests)

### Installation

```bash
# Dependencies installieren
pnpm install

# Prisma Client generieren
pnpm db:generate

# Packages bauen
pnpm build
```

### Entwicklung

```bash
# Docker Services starten (PostgreSQL, Redis)
docker compose up db redis -d

# Prisma Migrationen ausführen
pnpm db:migrate

# Dev-Server starten
pnpm dev
```

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/docs

### Tests

```bash
# Alle Tests ausführen
pnpm test

# Mit Coverage
pnpm test:coverage
```

### Docker (Production)

```bash
# .env Datei erstellen
cp .env.example .env
# OPENAI_API_KEY setzen

# Alle Services starten
docker compose up -d
```

## API Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/v1/scans` | Bild hochladen |
| GET | `/v1/scans/:id` | Scan-Status abrufen |
| POST | `/v1/scans/:id/confirm` | Spiel bestätigen |
| POST | `/v1/scans/:id/pricing` | Preisempfehlung |
| POST | `/v1/scans/:id/draft` | Anzeige generieren |

## Umgebungsvariablen

| Variable | Beschreibung | Default |
|----------|--------------|---------|
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `AI_PROVIDER` | `openai` oder `mock` | `openai` |
| `DATABASE_URL` | PostgreSQL URL | - |
| `REDIS_URL` | Redis URL | - |

## Lizenz

MIT
