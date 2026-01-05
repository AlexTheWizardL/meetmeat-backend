# MeetMeAt Backend

Conference poster generator API.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your database credentials and OpenAI API key

docker compose up -d      # Start PostgreSQL
npm run start:dev         # Start API at http://localhost:3000
```

Swagger docs: http://localhost:3000/api/docs

## Tech Stack

- **Framework:** NestJS 11 + TypeORM
- **Database:** PostgreSQL
- **AI:** OpenAI (GPT-4 Vision + DALL-E 3)
- **Storage:** Local / S3 (swappable via env)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /events/parse` | Parse event from URL using AI |
| `POST /templates/generate` | Generate poster templates |
| `GET/POST /profiles` | Manage user profiles |
| `GET/POST /posters` | Manage posters |
| `POST /posters/:id/export` | Export for social media |

## Scripts

```bash
npm run start:dev   # Development with watch
npm run test        # Unit tests (99 tests)
npm run test:e2e    # E2E tests
npm run lint        # Lint and fix
npm run build       # Production build
```

## Architecture

```
src/
├── common/           # Base entity, utilities
├── config/           # Validated configuration
└── modules/
    ├── ai/           # OpenAI provider (GPT-4 + DALL-E)
    │   └── providers/
    │       ├── openai.provider.ts
    │       ├── openai-client.ts
    │       ├── event-parser.ts
    │       └── image-generator.ts
    ├── storage/      # Local/S3 providers
    ├── profiles/     # User profiles
    ├── events/       # Event parsing
    ├── templates/    # AI-generated templates
    └── posters/      # Poster management
```

## Environment Variables

See `.env.example`. Key variables:

- `OPENAI_API_KEY`: Required for AI features
- `STORAGE_PROVIDER`: `local` or `s3`
- `DATABASE_*`: PostgreSQL connection

## License

MIT
