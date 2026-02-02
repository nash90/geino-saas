# Geino SaaS Deployment Guide

This guide covers deploying the Geino SaaS application to Cloudflare Workers (backend) and Cloudflare Pages (frontend) across multiple environments.

## 📋 Table of Contents

- [Environment Overview](#environment-overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## 🌍 Environment Overview

### Local Development
- **Backend**: `http://localhost:8787` (Wrangler Dev)
- **Frontend**: `http://localhost:5173` (Vite Dev Server)
- **Database**: Supabase (Staging instance)

### Staging
- **Backend Worker**: `https://api.geinosaas.yamacity.com`
- **Frontend Pages**: `https://geinosaas.yamacity.com`
- **Database**: Supabase (Staging instance)
- **Cloudflare Account**: Your account (already logged in)

### Production
- **Backend Worker**: `https://api.client-domain.com` (TBD)
- **Frontend Pages**: `https://app.client-domain.com` (TBD)
- **Database**: Supabase (Client's instance - TBD)
- **Cloudflare Account**: Client's account (requires profile switch)

---

## ✅ Prerequisites

### Required Tools
- Node.js 18+ and pnpm
- Wrangler CLI (`pnpm add -g wrangler`)
- Cloudflare account with Workers and Pages enabled
- Supabase project with database set up

### Required Credentials
- Cloudflare account API token
- Supabase project URL
- Supabase service role key
- Database connection pooler URL (transaction mode)

---

## 🛠️ Initial Setup

### 1. Configure Environment Files

#### Backend (.env files)

**For Local Development** (`backend/worker/.env.local`):
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
APP_URL=http://localhost:5173
```

**For Staging** (`backend/worker/.env.staging`):
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
APP_URL=https://geinosaas.yamacity.com
WORKER_NAME=geino-saas-staging
R2_BUCKET_NAME=geino-saas-staging-uploads
```

**For Production** (`backend/worker/.env.production`):
```bash
SUPABASE_URL=https://client-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=client-service-role-key-here
DATABASE_URL=postgresql://postgres.client-project-ref:client-password@aws-0-region.pooler.supabase.com:6543/postgres
APP_URL=https://app.client-domain.com
WORKER_NAME=geino-saas-prod
R2_BUCKET_NAME=geino-saas-prod-uploads
```

#### Frontend (.env files)

**For Local** (`frontend/web-app/.env.local`):
```bash
VITE_API_URL=http://localhost:8787
```

**For Staging** (`frontend/web-app/.env.staging`):
```bash
VITE_API_URL=https://api.geinosaas.yamacity.com
NODE_ENV=production
```

**For Production** (`frontend/web-app/.env.production`):
```bash
VITE_API_URL=https://api.client-domain.com
NODE_ENV=production
```

### 2. Verify Cloudflare Login

```bash
# Check current account
wrangler whoami

# If not logged in
wrangler login
```

---

## 🚀 Staging Deployment

### Step 1: Deploy Backend Worker

```bash
cd backend/worker

# 1. Upload secrets to Cloudflare Workers
pnpm secrets:staging

# 2. Deploy the worker
pnpm deploy:staging

# 3. Verify deployment
curl https://api.staging.geinosaas.yamacity.com
```

**Expected Output**: JSON response with `{ "message": "Geino SaaS API is running", "version": "1.0.0" }`

### Step 2: Setup Custom Domain for Worker

1. Go to Cloudflare Dashboard
2. Navigate to **Workers & Pages** > `geino-saas-staging`
3. Click **Settings** > **Triggers** > **Custom Domains**
4. Add: `api.geinosaas.yamacity.com`

Cloudflare will automatically provision SSL certificate.

### Step 3: Deploy Frontend to Pages

```bash
cd frontend/web-app

# First deployment (creates the Pages project)
pnpm pages:create:staging

# Build and deploy
pnpm deploy:staging
```

### Step 4: Setup Custom Domain for Pages

1. Go to Cloudflare Dashboard
2. Navigate to **Workers & Pages** > `geino-saas-staging`
3. Click **Custom domains**
4. Add: `geinosaas.yamacity.com`

### Step 5: Run Database Migrations

```bash
cd backend/worker

# Generate migration (if schema changed)
pnpm db:generate

# Apply migrations to Supabase
# Update DATABASE_URL in .env to use direct connection (port 5432)
pnpm db:migrate
```

### Step 6: Verify Staging Deployment

1. Open `https://geinosaas.yamacity.com`
2. Test login functionality
3. Test task creation and management
4. Check browser console for errors

### Monitoring Staging

```bash
# View real-time logs
cd backend/worker
pnpm tail:staging

# Check Pages deployment logs
wrangler pages deployment list --project-name geino-saas-staging
```

---

## 🏭 Production Deployment

### Prerequisites

1. **Client Credentials Ready**:
   - Cloudflare account credentials
   - Supabase project created
   - Custom domain configured in Cloudflare

2. **Update Configuration Files**:
   - `backend/worker/.env.production`
   - `backend/worker/wrangler.production.jsonc`
   - `frontend/web-app/.env.production`

### Step 1: Switch to Client's Cloudflare Account

```bash
# Method 1: Logout and re-login
wrangler logout
wrangler login
# (Use client's credentials)

# Method 2: Use CLOUDFLARE_API_TOKEN environment variable
export CLOUDFLARE_API_TOKEN="client-api-token-here"
```

### Step 2: Deploy Backend Worker

```bash
cd backend/worker

# 1. Upload secrets to client's account
pnpm secrets:production

# 2. Deploy worker
pnpm deploy:production

# 3. Verify deployment
curl https://api.client-domain.com
```

### Step 3: Setup Custom Domain (Client's Cloudflare)

1. In client's Cloudflare Dashboard
2. Navigate to **Workers & Pages** > `geino-saas-prod`
3. Click **Settings** > **Triggers** > **Custom Domains**
4. Add: `api.client-domain.com`

### Step 4: Deploy Frontend to Pages

```bash
cd frontend/web-app

# Create Pages project in client's account
pnpm pages:create:production

# Build and deploy
pnpm deploy:production
```

### Step 5: Setup Frontend Custom Domain

1. In client's Cloudflare Dashboard
2. Navigate to **Workers & Pages** > `geino-saas-prod`
3. Add custom domain: `app.client-domain.com`

### Step 6: Database Setup & Migrations

```bash
cd backend/worker

# Run migrations on client's Supabase
# Ensure DATABASE_URL in .env.production points to client's DB
pnpm db:migrate
```

### Step 7: Create System Admin User

```bash
# In client's Supabase SQL Editor, run:
UPDATE users SET system_role_code = 1
WHERE email = 'client-admin@domain.com';
```

### Step 8: Production Verification

1. ✅ Test login with client's admin account
2. ✅ Create test organization
3. ✅ Create test project
4. ✅ Create test tasks
5. ✅ Test all CRUD operations
6. ✅ Verify permissions (Admin, Org Manager, PM, Genba, Geino)
7. ✅ Test task status drag-and-drop
8. ✅ Check error logging

---

## 🔧 Troubleshooting

### Worker Deployment Issues

**Error: "Unauthorized"**
```bash
# Re-authenticate
wrangler logout
wrangler login
```

**Error: "Secret not found"**
```bash
# List current secrets
wrangler secret list --config wrangler.staging.jsonc

# Re-upload missing secret
echo "secret-value" | wrangler secret put SECRET_NAME --config wrangler.staging.jsonc
```

**Error: "Database connection failed"**
- Verify DATABASE_URL uses connection pooler (port 6543, transaction mode)
- Check Supabase project is not paused
- Verify IP restrictions in Supabase settings

### Pages Deployment Issues

**Error: "Build failed"**
```bash
# Test build locally first
cd frontend/web-app
pnpm build:staging

# Check dist/ folder created
ls -la dist/
```

**Error: "VITE_API_URL not defined"**
- Ensure `.env.staging` or `.env.production` exists
- Verify `--mode staging` flag in build command
- Check environment variables are prefixed with `VITE_`

### CORS Errors

Update worker's CORS configuration in `backend/worker/src/index.ts`:

```typescript
cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://geinosaas.yamacity.com',
      'https://app.client-domain.com',
    ];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
})
```

Then redeploy the worker.

---

## 🔄 Rollback Procedures

### Rollback Worker Deployment

```bash
# List recent deployments
wrangler deployments list --config wrangler.staging.jsonc

# Rollback to previous version
wrangler rollback --config wrangler.staging.jsonc --message "Rollback due to issue XYZ"
```

### Rollback Pages Deployment

```bash
# List deployments
wrangler pages deployment list --project-name geino-saas-staging

# Rollback via Cloudflare Dashboard:
# Workers & Pages > geino-saas-staging > Deployments >
# Click "..." on previous deployment > "Rollback to this deployment"
```

### Database Rollback

```bash
# If using Drizzle migrations, manually revert in Supabase SQL Editor
# Or restore from Supabase backup:
# Supabase Dashboard > Database > Backups > Restore
```

---

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] Run tests: `pnpm test`
- [ ] Run TypeScript check: `pnpm check`
- [ ] Update version number in package.json
- [ ] Review and update CHANGELOG.md
- [ ] Backup current production database

### Staging Deployment

- [ ] Deploy worker: `pnpm deploy:staging`
- [ ] Deploy frontend: `pnpm deploy:staging`
- [ ] Run smoke tests
- [ ] Verify all features working
- [ ] Check error logs

### Production Deployment

- [ ] Get client approval for deployment
- [ ] Schedule maintenance window
- [ ] Deploy worker: `pnpm deploy:production`
- [ ] Deploy frontend: `pnpm deploy:production`
- [ ] Run full regression tests
- [ ] Monitor error rates for 1 hour
- [ ] Send deployment notification

### Post-Deployment

- [ ] Verify all critical paths
- [ ] Monitor performance metrics
- [ ] Check error tracking dashboard
- [ ] Update documentation if needed
- [ ] Tag release in Git

---

## 🔐 Security Best Practices

1. **Never commit .env files** - All .env* files are gitignored except .env.example
2. **Rotate secrets regularly** - Update Supabase keys every 90 days
3. **Use Cloudflare Access** - Protect staging environment with Cloudflare Access
4. **Enable WAF rules** - Configure Web Application Firewall in Cloudflare
5. **Monitor logs** - Set up alerts for suspicious activity

---

## 📞 Support

For deployment issues, contact:
- Cloudflare Support: https://support.cloudflare.com
- Supabase Support: https://supabase.com/support

---

**Last Updated**: 2025-12-11
