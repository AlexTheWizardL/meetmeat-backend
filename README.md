# MeetMeAt Backend

Conference poster generator API - Create branded "I'm attending" posters for social media.

## Quick Start (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys

# 3. Start PostgreSQL (if using Docker)
docker run -d --name meetmeat-db \
  -e POSTGRES_USER=meetmeat \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=meetmeat_dev \
  -p 5432:5432 postgres:15

# 4. Run in development mode
npm run start:dev

# API available at http://localhost:3000
# Swagger docs at http://localhost:3000/api/docs
```

## Tech Stack

- **Framework:** NestJS 11 + TypeORM
- **Database:** PostgreSQL
- **AI:** OpenAI / Anthropic (swappable via env)
- **Storage:** Local / S3 (swappable via env)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /events/parse` | Parse event from URL using AI |
| `POST /templates/generate` | Generate poster templates for event |
| `GET/POST /profiles` | Manage user profiles |
| `GET/POST /posters` | Manage posters |
| `POST /posters/:id/export` | Export for social media |

## Scripts

```bash
npm run start:dev   # Development with watch mode
npm run test        # Run unit tests (98 tests)
npm run test:e2e    # Run e2e tests
npm run lint        # Lint and fix
npm run build       # Production build
```

## Architecture

```
src/
├── common/           # Base entity, utilities (retry logic)
├── config/           # Validated configuration
└── modules/
    ├── ai/           # OpenAI/Anthropic providers
    ├── storage/      # Local/S3 providers
    ├── profiles/     # User profiles
    ├── events/       # Event parsing
    ├── templates/    # AI-generated templates
    └── posters/      # Poster management
```

## Key Features

- **Swappable Providers:** Change AI/Storage via environment variables
- **Retry Logic:** Exponential backoff for AI API calls
- **Soft Delete:** All entities use soft delete with deletedAt
- **Optimized Queries:** Database indices on frequently queried fields
- **Full Validation:** Joi schema validation for config, class-validator for DTOs
- **Comprehensive Tests:** 98 unit tests + 15 e2e tests

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `AI_PROVIDER`: `openai` or `anthropic`
- `STORAGE_PROVIDER`: `local`, `s3`, or `gcs`
- `DATABASE_*`: PostgreSQL connection

## License

MIT
