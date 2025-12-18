# Geino SaaS Platform

A modern SaaS platform for project and task management built with Cloudflare Workers, Supabase, and React.

## 🏗️ Architecture

### Backend
- **Runtime**: Cloudflare Workers (Serverless)
- **Framework**: Hono.js
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **Auth**: Supabase Auth (Backend-only, httpOnly cookies)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **UI Components**: Radix UI + TailwindCSS
- **State Management**: React Context + Hooks
- **API Client**: Axios

### Deployment
- **Backend**: Cloudflare Workers
- **Frontend**: Cloudflare Pages
- **Database**: Supabase (Managed PostgreSQL)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Cloudflare account
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd geino-saas
   ```

2. **Setup Backend**
   ```bash
   cd backend/worker
   pnpm install

   # Copy and configure environment
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials

   # Run database migrations
   pnpm db:migrate

   # Start development server
   pnpm dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend/web-app
   pnpm install

   # Copy and configure environment
   cp .env.example .env.local
   # Edit .env.local with your backend URL (default: http://localhost:8787)

   # Start development server
   pnpm dev
   ```

4. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8787`

---

## 📦 Deployment

### Staging Deployment (Your Account)

```bash
# Deploy backend
cd backend/worker
pnpm secrets:staging      # First time only
pnpm deploy:staging

# Deploy frontend
cd frontend/web-app
pnpm deploy:staging
```

### Production Deployment (Client's Account)

```bash
# Switch Cloudflare account
wrangler logout && wrangler login

# Deploy backend
cd backend/worker
pnpm secrets:production   # First time only
pnpm deploy:production

# Deploy frontend
cd frontend/web-app
pnpm deploy:production
```

**For detailed deployment instructions**, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [DEPLOYMENT-QUICK-REFERENCE.md](./DEPLOYMENT-QUICK-REFERENCE.md) - Quick commands

---

## 🗂️ Project Structure

```
geino-saas/
├── backend/
│   └── worker/               # Cloudflare Worker (API)
│       ├── src/
│       │   ├── db/          # Database schema and client
│       │   ├── handlers/    # Request handlers
│       │   ├── middleware/  # Auth and CORS middleware
│       │   ├── routes/      # Route definitions
│       │   ├── services/    # Business logic layer
│       │   ├── types/       # TypeScript types
│       │   └── index.ts     # Main entry point
│       ├── scripts/         # Deployment scripts
│       ├── .env.local       # Local environment config
│       ├── .env.staging     # Staging environment config
│       ├── .env.production  # Production environment config
│       ├── wrangler.staging.jsonc     # Staging Wrangler config
│       ├── wrangler.production.jsonc  # Production Wrangler config
│       └── package.json
│
├── frontend/
│   └── web-app/             # React Frontend
│       ├── client/src/
│       │   ├── api/         # API client layer
│       │   ├── components/  # React components
│       │   ├── contexts/    # React contexts
│       │   ├── hooks/       # Custom hooks
│       │   ├── pages/       # Page components
│       │   ├── types/       # TypeScript types
│       │   └── App.tsx      # Main app component
│       ├── .env.local       # Local environment config
│       ├── .env.staging     # Staging environment config
│       ├── .env.production  # Production environment config
│       └── package.json
│
├── DEPLOYMENT.md            # Detailed deployment guide
├── DEPLOYMENT-QUICK-REFERENCE.md  # Quick deploy commands
├── CLAUDE.md               # Coding guidelines for Claude
└── README.md               # This file
```

---

## 🔑 Environment Variables

### Backend (.env files)
```bash
SUPABASE_URL=              # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY= # Supabase service role key (secret)
DATABASE_URL=              # PostgreSQL connection pooler URL
APP_URL=                   # Frontend URL (for CORS)
```

### Frontend (.env files)
```bash
VITE_API_URL=              # Backend API URL
```

---

## 🗄️ Database

### Schema Management

The database schema is managed with Drizzle ORM.

**Generate Migration**:
```bash
cd backend/worker
pnpm db:generate
```

**Apply Migration**:
```bash
pnpm db:migrate
```

**Open Drizzle Studio** (GUI):
```bash
pnpm db:studio
```

---

## 👥 User Roles & Permissions

### System Roles
- **System Admin** (code: 1) - Full access to all organizations and projects
- **Regular User** (code: 2) - Access based on organization/project membership

### Organization Roles
- **Organization Manager** (code: 1) - Manage organization and all projects
- **Organization Member** (code: 2) - View organization, access assigned projects

### Project Roles
- **Project Manager** (code: 1) - Full project access, manage tasks and members
- **Geino User** (code: 2) - View-only access to tasks
- **Genba User** (code: 3) - Can create Hold tasks, edit own tasks, cannot change status

---

## 🧪 Testing

### Backend Tests
```bash
cd backend/worker
pnpm test
```

### Frontend Tests
```bash
cd frontend/web-app
pnpm test
```

### TypeScript Type Checking
```bash
# Backend
cd backend/worker
pnpm check

# Frontend
cd frontend/web-app
pnpm check
```

---

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT-QUICK-REFERENCE.md](./DEPLOYMENT-QUICK-REFERENCE.md) - Quick deploy commands
- [CLAUDE.md](./CLAUDE.md) - Coding standards and architecture patterns

---

## 🔧 Development Scripts

### Backend
```bash
pnpm dev                  # Start development server
pnpm deploy:staging       # Deploy to staging
pnpm deploy:production    # Deploy to production
pnpm secrets:staging      # Upload secrets to staging
pnpm secrets:production   # Upload secrets to production
pnpm tail:staging         # View staging logs
pnpm tail:production      # View production logs
pnpm db:generate          # Generate database migration
pnpm db:migrate           # Apply database migrations
pnpm db:studio            # Open Drizzle Studio
pnpm test                 # Run tests
```

### Frontend
```bash
pnpm dev                  # Start development server
pnpm build:staging        # Build for staging
pnpm build:production     # Build for production
pnpm deploy:staging       # Deploy to Cloudflare Pages (staging)
pnpm deploy:production    # Deploy to Cloudflare Pages (production)
pnpm check                # TypeScript type checking
pnpm format               # Format code with Prettier
```

---

## 🌐 Environments

### Local Development
- Backend: `http://localhost:8787`
- Frontend: `http://localhost:5173`

### Staging
- Backend: `https://api.geinosaas.yamacity.com`
- Frontend: `https://geinosaas.yamacity.com`

### Production
- Backend: `https://api.client-domain.com` (TBD)
- Frontend: `https://app.client-domain.com` (TBD)

---

## 📝 License

Proprietary - All Rights Reserved

---

## 🤝 Support

For technical issues or questions, please refer to the deployment documentation or contact the development team.

---

**Version**: 1.0.0
**Last Updated**: 2025-12-11
