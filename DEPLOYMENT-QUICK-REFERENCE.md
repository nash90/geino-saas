# Deployment Quick Reference

## 🚀 Quick Deploy Commands

### Staging (Your Account)

```bash
# Backend
cd backend/worker
pnpm secrets:staging      # Upload secrets (first time only)
pnpm deploy:staging       # Deploy worker

# Frontend
cd frontend/web-app
pnpm deploy:staging       # Build and deploy to Pages
```

### Production (Client's Account)

```bash
# Switch account first
wrangler logout && wrangler login

# Backend
cd backend/worker
pnpm secrets:production   # Upload secrets (first time only)
pnpm deploy:production    # Deploy worker

# Frontend
cd frontend/web-app
pnpm deploy:production    # Build and deploy to Pages
```

---

## 📝 Environment Files Checklist

Before deploying, ensure these files are configured:

### Backend
- [ ] `backend/worker/.env.local` - Local development
- [ ] `backend/worker/.env.staging` - Staging credentials
- [ ] `backend/worker/.env.production` - Production credentials (client's)

### Frontend
- [ ] `frontend/web-app/.env.local` - Local API URL
- [ ] `frontend/web-app/.env.staging` - Staging API URL
- [ ] `frontend/web-app/.env.production` - Production API URL (client's)

---

## 🔑 Secrets Management

### View Current Secrets
```bash
# Staging
wrangler secret list --config wrangler.staging.jsonc

# Production
wrangler secret list --config wrangler.production.jsonc
```

### Update Individual Secret
```bash
# Staging
echo "new-secret-value" | wrangler secret put SECRET_NAME --config wrangler.staging.jsonc

# Production
echo "new-secret-value" | wrangler secret put SECRET_NAME --config wrangler.production.jsonc
```

### Delete Secret
```bash
wrangler secret delete SECRET_NAME --config wrangler.staging.jsonc
```

---

## 🔍 Monitoring & Logs

### Worker Logs (Real-time)
```bash
# Staging
pnpm tail:staging

# Production
pnpm tail:production
```

### Pages Deployment List
```bash
# Staging
wrangler pages deployment list --project-name geino-saas-staging

# Production
wrangler pages deployment list --project-name geino-saas-prod
```

### Worker Deployments
```bash
# Staging
wrangler deployments list --config wrangler.staging.jsonc

# Production
wrangler deployments list --config wrangler.production.jsonc
```

---

## 🗄️ Database Operations

### Generate Migration
```bash
cd backend/worker
pnpm db:generate
```

### Apply Migration
```bash
# Update DATABASE_URL to use direct connection (port 5432)
# Then run:
pnpm db:migrate
```

### Open Drizzle Studio
```bash
pnpm db:studio
```

---

## 🌐 Custom Domain Setup

### Worker Custom Domain
1. Cloudflare Dashboard → Workers & Pages → [worker-name]
2. Settings → Triggers → Custom Domains
3. Add domain (e.g., `api.staging.geinosaas.yamacity.com`)

### Pages Custom Domain
1. Cloudflare Dashboard → Workers & Pages → [pages-project]
2. Custom domains → Set up a custom domain
3. Add domain (e.g., `staging.geinosaas.yamacity.com`)

---

## 🔄 Rollback

### Rollback Worker
```bash
wrangler rollback --config wrangler.staging.jsonc --message "Rollback reason"
```

### Rollback Pages
Use Cloudflare Dashboard:
Workers & Pages → [project] → Deployments → Previous deployment → Rollback

---

## ⚠️ Common Issues

### "Unauthorized" Error
```bash
wrangler logout
wrangler login
```

### "Build failed" Error
```bash
# Test build locally
cd frontend/web-app
pnpm build:staging
# Check dist/ folder
ls -la dist/
```

### CORS Error
Update allowed origins in `backend/worker/src/index.ts` and redeploy

### Database Connection Error
- Verify DATABASE_URL uses connection pooler (port 6543)
- Check Supabase project is not paused
- Ensure correct transaction mode in connection string

---

## 📊 Deployment URLs

### Staging (Your Cloudflare Account)
- Frontend: `https://geinosaas.yamacity.com`
- API: `https://api.geinosaas.yamacity.com`

### Production (Client's Cloudflare Account - TBD)
- Frontend: `https://app.client-domain.com`
- API: `https://api.client-domain.com`

---

## 🔐 Required Secrets

All environments need these secrets set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

---

## 📱 Account Switching

### Check Current Account
```bash
wrangler whoami
```

### Switch to Different Account
```bash
wrangler logout
wrangler login
# Use client's browser to authenticate
```

### Use API Token (Alternative)
```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

---

**For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
