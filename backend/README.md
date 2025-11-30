# Backend Setup Instructions

## Prerequisites

1. Supabase account with a project created
2. Node.js 18+ and pnpm installed
3. Cloudflare account (for deployment)

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   - `SUPABASE_URL`: Your Supabase project URL (found in Project Settings > API)
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (found in Project Settings > API)
   - `DATABASE_URL`: Connection pooler URL in transaction mode (Settings > Database > Connection pooling)

## Database Migration

1. Generate migration SQL files with custom name:
   ```bash
   cd worker
   pnpm exec drizzle-kit generate --name your_migration_name
   ```
   This creates SQL files in `./db-migration/` with format: `TIMESTAMP_your_migration_name.sql`

2. Apply migrations to Supabase:
   ```bash
   pnpm db:migrate
   ```

## Development

1. Install dependencies:
   ```bash
   cd worker
   pnpm install
   ```

2. Set secrets for local development:
   ```bash
   echo "SUPABASE_URL" | wrangler secret put SUPABASE_URL --env dev
   echo "SUPABASE_SERVICE_ROLE_KEY" | wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env dev
   echo "DATABASE_URL" | wrangler secret put DATABASE_URL --env dev
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```
   API runs at http://localhost:8787

## Production Deployment

1. Set production secrets:
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put DATABASE_URL
   ```

2. Deploy to Cloudflare Workers:
   ```bash
   pnpm deploy
   ```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/session` - Get current session
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/update-password` - Update password with token
- `GET /api/users` - List all users (System Admin only)
- `GET /api/users/:id` - Get user by ID (System Admin only)
- `PATCH /api/users/:id` - Update user role (System Admin only)
- `DELETE /api/users/:id` - Delete user (System Admin only)

## Client Handover

When handing over to client's infrastructure:

1. Provide the `db-migration/` folder with all SQL files
2. Client can run migrations in their Supabase instance:
   - Via Supabase SQL Editor (copy/paste SQL)
   - Via Supabase CLI: `supabase db push`
3. Update environment variables with client's Supabase credentials
4. Deploy worker to client's Cloudflare account
