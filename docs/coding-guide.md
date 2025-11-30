# Coding Standards and Best Practices

## Project Structure

### Backend (Cloudflare Workers + Hono)

The backend follows a clear separation of concerns:

```
backend/worker/src/
├── handlers/           # Business logic handlers
│   ├── auth/          # Authentication handlers
│   │   ├── register.handler.ts
│   │   ├── login.handler.ts
│   │   ├── logout.handler.ts
│   │   └── ...
│   └── users/         # User management handlers
│       ├── list-users.handler.ts
│       ├── get-user.handler.ts
│       └── ...
├── routes/            # Route definitions (thin layer)
│   ├── auth.ts        # Auth route mapping
│   └── users.ts       # Users route mapping
├── middleware/        # Middleware functions
│   └── auth.ts        # Authentication middleware
├── db/               # Database layer
│   ├── schema.ts     # Drizzle schema definitions
│   └── client.ts     # Database client factory
└── index.ts          # Main application entry
```

### Handler Structure

**CRITICAL RULE**: Each API endpoint MUST have its own handler file.

#### ✅ CORRECT - One handler per file:
```typescript
// handlers/auth/register.handler.ts
export async function registerHandler(c: Context) {
  // Implementation
}

// handlers/auth/login.handler.ts
export async function loginHandler(c: Context) {
  // Implementation
}
```

#### ❌ INCORRECT - Multiple handlers in one file:
```typescript
// routes/auth.ts - DON'T DO THIS
auth.post('/register', async (c) => { /* ... */ });
auth.post('/login', async (c) => { /* ... */ });
auth.post('/logout', async (c) => { /* ... */ });
```

### Route Files

Route files should be **thin** - they only map HTTP methods to handlers:

```typescript
// routes/auth.ts
import { Hono } from 'hono';
import { registerHandler } from '../handlers/auth/register.handler';
import { loginHandler } from '../handlers/auth/login.handler';

const auth = new Hono();

auth.post('/register', registerHandler);
auth.post('/login', loginHandler);

export default auth;
```

### Benefits of This Structure

1. **Testability**: Each handler can be unit tested independently
2. **Maintainability**: Easy to locate and modify specific endpoint logic
3. **Readability**: Clear separation between routing and business logic
4. **Scalability**: New endpoints don't bloat existing files
5. **Team Collaboration**: Reduces merge conflicts

## TypeScript Standards

### Type Safety

- Always use explicit types for function parameters and return values
- Avoid `any` - use `unknown` if type is truly unknown
- Use TypeScript's strict mode

```typescript
// ✅ Good
export async function getUserHandler(
  c: Context<{ Bindings: Env; Variables: { db: DbClient } }>
): Promise<Response> {
  // Implementation
}

// ❌ Bad
export async function getUserHandler(c: any) {
  // Implementation
}
```

### Naming Conventions

- **Handlers**: `{action}{Resource}Handler` - e.g., `registerHandler`, `listUsersHandler`
- **Routes**: `{resource}Route` or just `{resource}` - e.g., `authRoute`, `usersRoute`
- **Middleware**: `{action}Middleware` or just `{action}` - e.g., `authenticate`, `requireSystemAdmin`
- **Types/Interfaces**: PascalCase - e.g., `AuthUser`, `DbClient`
- **Variables/Functions**: camelCase - e.g., `userProfile`, `createDbClient`

## Database (Drizzle ORM)

### Schema Definitions

```typescript
// ✅ Good - Use sql`` for defaults, array-based indexes
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
}, (table) => [
  index('idx_users_email').on(table.email),
]);
```

### Migrations

- Use descriptive names: `pnpm exec drizzle-kit generate --name create_users_table`
- Always test migrations locally before applying to production
- Use direct connection (port 5432) for migrations

## Error Handling

Always return consistent error responses:

```typescript
// ✅ Good
try {
  // Business logic
} catch (error) {
  return c.json({ error: 'Failed to create user' }, 500);
}

// ❌ Bad
try {
  // Business logic
} catch (error) {
  throw error; // Don't throw in Hono handlers
}
```

## Environment Variables

- Use `.env` files (not `.env.local`)
- Never commit `.env` files
- Provide `.env.example` with dummy values
- URL-encode special characters in connection strings

## Authentication

- Use httpOnly cookies for tokens
- Set appropriate cookie attributes: `secure: true`, `sameSite: 'Lax'`
- Implement token refresh logic
- Always validate user authentication in protected routes

## Code Review Checklist

Before submitting code, ensure:

- [ ] Each endpoint has its own handler file
- [ ] Routes are thin and only map to handlers
- [ ] All types are explicitly defined
- [ ] Error handling is consistent
- [ ] Environment variables are documented
- [ ] No sensitive data in commits
- [ ] Tests are written (when applicable)

## Frontend Structure (React + Vite)

```
frontend/web-app/client/src/
├── api/              # API client and endpoint methods
│   ├── client.ts     # Axios instance configuration
│   ├── auth.ts       # Auth API methods
│   └── users.ts      # User API methods
├── components/       # Reusable UI components
├── contexts/         # React contexts (auth, theme, etc.)
├── hooks/           # Custom React hooks
├── pages/           # Page components
└── lib/             # Utility functions
```

## Git Workflow

- Branch naming: `feature/description`, `fix/description`
- Commit messages: Clear, concise, imperative mood
- Always pull before pushing
- Squash commits when appropriate

---

**Remember**: Clean code is not about being clever, it's about being clear and maintainable.
