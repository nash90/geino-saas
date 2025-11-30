# Coding Guide

A concise, reusable guide for consistent architecture across projects.

## Table of Contents

1. [Backend](#backend)
2. [Database](#database)
3. [Frontend Web](#frontend-web)
4. [Mobile App](#mobile-app)
5. [General Practices](#general-practices)

---

## Backend

### 1. Project Structure

**Organize backend code with clear separation of concerns**

```
src/
├── database/
│   ├── schema.ts           # Drizzle schema definitions
│   ├── connection.ts       # Database connection setup
│   └── migrations/         # Database migrations
├── services/
│   ├── base/
│   │   └── BaseService.ts  # Abstract base service class
│   ├── auth/
│   │   ├── UserService.ts          # User management
│   │   ├── TokenService.ts         # JWT token operations
│   │   └── AuthenticationService.ts # Authentication logic
│   ├── vocabulary/
│   │   └── VocabularyService.ts    # Vocabulary management
│   └── ServiceFactory.ts   # Service dependency injection
├── types/
│   ├── index.ts           # Main application types
│   ├── service.ts         # Service-related types
│   └── database.ts        # Database-related types
├── utils/
│   ├── crypto.ts          # Cryptography utilities
│   └── validation.ts      # Input validation
└── routes/
    ├── auth.ts            # Authentication routes
    └── vocabulary.ts      # Vocabulary routes
```

### 2. Service Layer Architecture

**Use a modular service architecture with base classes and feature-specific services**

```typescript
// Base service class for common functionality
export abstract class BaseService {
  protected db: DrizzleD1Database;
  protected env: Env;

  constructor(db: DrizzleD1Database, env: Env) {
    this.db = db;
    this.env = env;
  }

  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  protected async handleError(error: unknown, operation: string): Promise<never> {
    console.error(`Error in ${operation}:`, error);
    throw new Error(`${operation} failed`);
  }
}

// Feature-specific services
export class UserService extends BaseService {
  async createUser(data: CreateUserRequest): Promise<ServiceResponse<User>> {
    try {
      const userId = this.generateId();
      const now = this.getCurrentTimestamp();

      const [newUser] = await this.db
        .insert(users)
        .values({
          id: userId,
          email: data.email,
          passwordHash: await this.hashPassword(data.password),
          jlptLevelCode: JLPTLevelCode.N5.code,
          coins: 0,
          subscriptionStatusCode: SubscriptionStatus.FREE.code,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return { success: true, data: newUser };
    } catch (error) {
      return this.handleError(error, 'createUser');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Implementation
  }
}

export class TokenService extends BaseService {
  async generateTokens(userId: string, email: string): Promise<ServiceResponse<TokenPair>> {
    // Implementation
  }

  async refreshToken(refreshToken: string): Promise<ServiceResponse<TokenPair>> {
    // Implementation
  }

  async revokeToken(refreshToken: string): Promise<ServiceResponse<void>> {
    // Implementation
  }
}

// Service factory for dependency injection
export class ServiceFactory {
  private db: DrizzleD1Database;
  private env: Env;

  constructor(db: DrizzleD1Database, env: Env) {
    this.db = db;
    this.env = env;
  }

  getUserService(): UserService {
    return new UserService(this.db, this.env);
  }

  getTokenService(): TokenService {
    return new TokenService(this.db, this.env);
  }

  getVocabularyService(): VocabularyService {
    return new VocabularyService(this.db, this.env);
  }
}
```

**Type Organization:**
- **Centralize types in `types/` folder** with domain-specific files (`authTypes.ts`, `userTypes.ts`, `serviceTypes.ts`)
- **Use `types/models.ts`** with Drizzle's `InferSelectModel` for database models (single source of truth)
- **Keep `types/index.ts`** for convenient re-exports (types have no runtime cost)
- **Use `import type`** for type-only imports to ensure compile-time erasure

**Module Organization:**
- **Avoid barrel exports for services** - use direct imports for explicit dependency tracking
- **Use barrel exports for types** - convenient and no performance impact
- **Split large services** into focused files (70-95 lines, single responsibility principle)

### 3. End-to-End API Testing

**Use environment-aware curl-based testing for comprehensive API validation**

```bash
# Test structure
backend/api-tests/
├── config.sh          # Environment setup & token management
├── register.sh        # User registration test
├── login.sh           # Authentication test
├── refresh.sh         # Token refresh test
├── logout.sh          # Logout test
└── run-all.sh         # Full test suite

# Environment configuration (staging default)
ENVIRONMENT=${ENVIRONMENT:-"staging"}

if [ "$ENVIRONMENT" = "local" ]; then
    API_URL="http://localhost:8787/api/v1/auth"
elif [ "$ENVIRONMENT" = "production" ]; then
    API_URL="https://api-prod.domain.com/api/v1/auth"
else
    API_URL="https://api-staging.domain.com/api/v1/auth"
fi

# Usage examples
./run-all.sh                    # Test staging (default)
ENVIRONMENT=local ./run-all.sh  # Test local development
ENVIRONMENT=production ./run-all.sh  # Test production
```

**Key Testing Patterns:**

1. **Configuration Script** - Sets up environment and fetches tokens
2. **Token Management** - Saves tokens to `.env` for reuse across tests
3. **Environment Switching** - Single codebase tests multiple environments
4. **Response Validation** - Checks JSON structure and error codes
5. **Token Rotation** - Verifies security by testing token invalidation

```bash
# config.sh - Core setup pattern
echo "✅ Test user created/exists"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" ...)
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
echo "ACCESS_TOKEN=$ACCESS_TOKEN" > .env

# Individual test pattern
source .env  # Load saved tokens
RESPONSE=$(curl -s -X POST "$API_URL/endpoint" \
  -H "Authorization: Bearer $ACCESS_TOKEN" ...)
if echo "$RESPONSE" | grep -q "success.*true"; then
  echo "✅ Test PASSED"
else
  echo "❌ Test FAILED"
fi
```

### 4. Service Response Pattern

**Use consistent response patterns across all services**

```typescript
// types/service.ts
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Usage in services
export class UserService extends BaseService {
  async getUserById(id: string): Promise<ServiceResponse<User>> {
    try {
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: user[0]
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch user',
        code: 'DATABASE_ERROR'
      };
    }
  }
}
```

### 5. Service Layer Responsibilities

**Services handle ALL business logic, database operations, and external API calls**

#### What Services Do:

1. **Database Operations** - All CRUD operations, queries, transactions
2. **Data Validation** - Call ValidationService for detailed input checks
3. **Business Logic** - Data manipulation, calculations, aggregations
4. **External APIs** - Supabase Auth, third-party APIs, etc.
5. **Transaction Management** - Multi-step operations with rollback
6. **Error Handling** - Consistent error responses with codes

#### BaseService Features:

```typescript
// services/base/BaseService.ts
export abstract class BaseService {
  protected db: DbClient;
  protected env: Env;

  // Timestamp helpers
  protected getCurrentTimestamp(): Date;
  
  // Pagination helpers
  protected normalizePaginationParams(page?, limit?): PaginationParams;
  protected calculateOffset(page, limit): number;
  protected calculateTotalPages(total, limit): number;
  
  // Response helpers
  protected success<T>(data: T): ServiceResponse<T>;
  protected error(message: string, code?: string): ServiceResponse;
  protected handleError(error: unknown, operation: string): ServiceResponse;
  
  // Transaction wrapper
  protected async withTransaction<T>(callback): Promise<T>;
}
```

#### Service Organization by Feature:

```
backend/worker/src/services/
├── base/
│   └── BaseService.ts          # Common functionality for all services
├── validation/
│   └── ValidationService.ts    # Input validation (email, password, etc.)
├── auth/
│   └── AuthService.ts          # Supabase auth operations
├── users/
│   └── UserService.ts          # User CRUD with pagination
└── index.ts                    # Centralized exports
```

#### Service Response Pattern:

```typescript
// All services return ServiceResponse<T>
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;  // Error code for specific handling
}

// Example: UserService.getUserById()
const result = await userService.getUserById(id);
if (!result.success) {
  // Handle error based on code
  if (result.code === 'USER_NOT_FOUND') return c.json({ error: result.error }, 404);
  return c.json({ error: result.error }, 500);
}
return c.json({ user: result.data });
```

#### Transaction Support:

```typescript
// services/users/UserService.ts
export class UserService extends BaseService {
  async deleteUser(id: string): Promise<ServiceResponse<void>> {
    // Validate input
    const validation = this.validationService.validateUserId(id);
    if (!validation.valid) {
      return this.error(validation.error!, 'INVALID_USER_ID');
    }

    // Execute with transaction-like behavior
    return await this.withTransaction(async (db) => {
      // Delete from database
      const deleted = await db.delete(users).where(eq(users.id, id)).returning();
      if (!deleted.length) {
        return this.error('User not found', 'USER_NOT_FOUND');
      }

      // Delete from Supabase Auth (external API)
      const supabase = createClient(this.env.SUPABASE_URL, this.env.SUPABASE_SERVICE_ROLE_KEY);
      await supabase.auth.admin.deleteUser(id);

      return this.success(undefined);
    });
  }
}
```

#### Validation Service Pattern:

```typescript
// services/validation/ValidationService.ts
export class ValidationService {
  validateEmail(email: string): { valid: boolean; error?: string };
  validatePassword(password: string): { valid: boolean; error?: string };
  validateUserId(id: string): { valid: boolean; error?: string };
  validateRequiredFields(data, fields): { valid: boolean; error?: string; missing?: string[] };
  
  // Composite validations
  validateRegistrationData(data): { valid: boolean; error?: string };
  validateLoginData(data): { valid: boolean; error?: string };
}

// Used in services
const validation = this.validationService.validateRegistrationData(data);
if (!validation.valid) {
  return this.error(validation.error!, 'VALIDATION_ERROR');
}
```

### 2. REST API Framework (Hono)

**Use Hono framework for clear route definitions and middleware support**

```typescript
// Route definition with proper HTTP methods
const businessCoupons = new Hono<{ Bindings: Env }>();

businessCoupons.get('/', async (c) => {
  const auth = await authenticateBusiness(c.req.raw, c.env);
  if (!auth.success) return auth.response;
  
  return getCouponsHandler(auth.context.supabase, auth.context.businessId, c.req.raw);
});

businessCoupons.post('/', async (c) => {
  // POST implementation
});
```

### 3. Folder Structure by Feature

**Organize code by feature with clear separation of concerns**

```
backend/workers/src/
├── routes/
│   ├── business/
│   │   ├── coupons.ts
│   │   ├── applications.ts
│   │   └── profile.ts
│   ├── customer/
│   └── auth/
├── handlers/
│   ├── business/
│   │   ├── coupons/
│   │   │   ├── createCouponHandler.ts
│   │   │   ├── getCouponsHandler.ts
│   │   │   └── updateCouponHandler.ts
│   │   └── applications/
│   └── customer/
├── services/
│   ├── business/
│   │   ├── BusinessCouponService.ts
│   │   └── BusinessApplicationService.ts
│   └── customer/
└── types/
    ├── index.ts
    └── status-codes.ts
```

### 4. Handler Pattern

**Each handler handles a single operation with proper validation and error handling**

```typescript
export async function createCouponHandler(
  request: Request, 
  env: Env, 
  businessId: string, 
  supabase: any
): Promise<Response> {
  try {
    // 1. Parse and validate input
    const body: CreateCouponRequest = await request.json();
    
    // 2. Validate required fields
    const requiredFields = ['title', 'item_name', 'original_price'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateCouponRequest]) {
        return createCorsResponse({ error: `Missing required field: ${field}` }, 400);
      }
    }
    
    // 3. Business logic validation
    if (body.discount_percentage < 0 || body.discount_percentage > 100) {
      return createCorsResponse({ error: 'Invalid discount percentage' }, 400);
    }
    
    // 4. Call service layer
    const couponService = new BusinessCouponService(supabase);
    const result = await couponService.createCoupon(businessId, body);
    
    // 5. Return response
    if (!result.success) {
      return createCorsResponse({ error: result.error }, 500);
    }
    
    return createCorsResponse({
      success: true,
      data: result.data,
      message: 'Coupon created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Error in createCouponHandler:', error);
    return createCorsResponse({ error: 'Internal server error' }, 500);
  }
}
```

#### **CRITICAL RULE: Handler-Service Architecture**

Each handler MUST follow these architectural principles:

1. **One Handler Per File** - Each API endpoint has its own handler file
2. **Handlers Call Services** - Business logic lives in service layer
3. **Services Handle Data** - Database operations, transactions, and validation in services

##### Service Layer Architecture

```
backend/worker/src/
├── handlers/              # HTTP request handling (thin layer)
│   ├── auth/
│   │   ├── registerHandler.ts      # Calls AuthService.register()
│   │   ├── loginHandler.ts         # Calls AuthService.login()
│   │   └── updatePasswordHandler.ts # Calls AuthService.updatePassword()
│   └── users/
│       ├── listUsersHandler.ts     # Calls UserService.listUsers()
│       ├── getUserHandler.ts       # Calls UserService.getUserById()
│       ├── updateUserHandler.ts    # Calls UserService.updateUserRole()
│       └── deleteUserHandler.ts    # Calls UserService.deleteUser()
├── services/              # Business logic (thick layer)
│   ├── base/
│   │   └── BaseService.ts         # Common functionality
│   ├── validation/
│   │   └── ValidationService.ts   # Input validation
│   ├── auth/
│   │   └── AuthService.ts         # Auth operations
│   └── users/
│       └── UserService.ts         # User CRUD operations
```

##### Handler Context Types

Use centralized context types instead of verbose inline types:

```typescript
// types/index.ts - Centralized context types
export type BaseContext = Context<{
  Bindings: Env;
  Variables: { db: DbClient };
}>;

export type AuthContext = Context<{
  Bindings: Env;
  Variables: { db: DbClient; user: AuthUser };
}>;

export type OptionalAuthContext = Context<{
  Bindings: Env;
  Variables: { db: DbClient; user?: AuthUser };
}>;
```

#### ✅ CORRECT - Handler delegates to service:
```typescript
// handlers/auth/registerHandler.ts
import { RegistrationService } from '../../services/auth/RegistrationService';
import type { BaseContext } from '../../types';

export async function registerHandler(c: BaseContext) {
  const { email, password, firstname, lastname } = await c.req.json();
  
  const db = c.get('db');
  const authService = new AuthService(db, c.env);
  
  // Call service layer - no business logic in handler
  const result = await authService.register({
    email, password, firstname, lastname
  });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ message: 'Registration successful!' });
}

// services/auth/AuthService.ts
export class AuthService extends BaseService {
  async register(data: RegistrationData): Promise<ServiceResponse<User>> {
    // Validation
    const validation = this.validationService.validateRegistrationData(data);
    if (!validation.valid) {
      return this.error(validation.error!, 'VALIDATION_ERROR');
    }

    // Supabase auth
    const { data: authData, error } = await this.supabase.auth.signUp({...});
    
    // Database transaction
    const [newUser] = await this.db.insert(users).values({...}).returning();
    
    return this.success(newUser);
  }
}
```

##### ❌ INCORRECT - Business logic in handler:
```typescript
// handlers/auth/registerHandler.ts - DON'T DO THIS
export async function registerHandler(c: Context) {
  const { email, password, firstname, lastname } = await c.req.json();
  
  // ❌ Validation in handler
  if (!email || !password) {
    return c.json({ error: 'Missing fields' }, 400);
  }
  
  // ❌ Direct Supabase operations in handler
  const supabase = createClient(c.env.SUPABASE_URL, ...);
  const { data, error } = await supabase.auth.signUp({...});
  
  // ❌ Direct database operations in handler
  await db.insert(users).values({...});
  
  return c.json({ message: 'Success' });
}
```

#### Route Files Should Be Thin

Route files should **only map HTTP methods to handlers**:

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

#### Benefits of One Handler Per File

1. **Testability**: Each handler can be unit tested independently
2. **Maintainability**: Easy to locate and modify specific endpoint logic
3. **Readability**: Clear separation between routing and business logic
4. **Scalability**: New endpoints don't bloat existing files
5. **Team Collaboration**: Reduces merge conflicts

### 5. Type Management

**Keep all types in dedicated types folder, organized by feature or in main index.ts**

```typescript
// types/index.ts
export interface Coupon {
  id: string;
  business_id: string;
  title: string;
  original_price: number;
  discount_percentage: number;
  commission_percentage: number;
  platform_requirement_code: PlatformRequirementCode;
  status_code: CouponStatusCode;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponRequest {
  title: string;
  item_name: string;
  original_price: number;
  discount_percentage: number;
  commission_percentage: number;
  platform_requirement_code: PlatformRequirementCode;
}
```

### 6. Status Codes and Enums

**Use numeric codes with typed constants for database status fields**

```typescript
// types/status-codes.ts
export const CouponStatus = {
  ACTIVE: { code: 0, label: 'Active', key: 'active' },
  PAUSED: { code: 1, label: 'Paused', key: 'paused' },
  EXPIRED: { code: 2, label: 'Expired', key: 'expired' },
  DELETED: { code: 3, label: 'Deleted', key: 'deleted' }
} as const;

export const UserRole = {
  BUSINESS: { code: 0, label: 'Business', key: 'business' },
  INFLUENCER: { code: 1, label: 'Influencer', key: 'influencer' },
  CUSTOMER: { code: 2, label: 'Customer', key: 'customer' },
  ADMIN: { code: 3, label: 'Admin', key: 'admin' }
} as const;

// Utility functions for conversions
export const getStatusCodeByKey = {
  couponStatus: (key: string) => {
    const status = Object.values(CouponStatus).find(s => s.key === key);
    return status ? status.code : 0;
  },
  userRole: (key: string) => {
    const role = Object.values(UserRole).find(r => r.key === key);
    return role ? role.code : 0;
  }
};
```

### 7. Authentication Middleware

**Make reusable authentication helpers that can be injected into protected routes**

```typescript
// middleware/businessAuth.ts
export async function authenticateBusiness(request: Request, env: Env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        response: createCorsResponse({ error: 'Missing or invalid authorization header' }, 401)
      };
    }

    const token = authHeader.substring(7);
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        response: createCorsResponse({ error: 'Invalid token' }, 401)
      };
    }

    return {
      success: true,
      context: {
        user,
        businessId: user.id,
        supabase
      }
    };
  } catch (error) {
    return {
      success: false,
      response: createCorsResponse({ error: 'Authentication failed' }, 401)
    };
  }
}
```

### 8 function vs class

**No need to use class where not needed, its enough to make service layer class, but handlers routes, component etc is better as arrow functions**

### 8 Authentication

**Make auth endpoints with JWT and long term refresh token standards, along with access token**


---

## Database Guidelines

### 1. Migration and ORM Tools

**Use proper migration tools and type-safe database access**

```typescript
// For local development: Use Kysely or similar ORM
// For Cloudflare Workers: Use D1 with proper typing

// Database schema should be version controlled
// Use migration scripts for schema changes
// Keep schema.sql file updated with latest structure
```

### 2. Caching Strategy

**Use Cloudflare KV for caching frequently accessed data**

```typescript
// Cache user sessions, frequently accessed lookups
export class CacheService {
  constructor(private kv: KVNamespace) {}
  
  async getUserSession(userId: string) {
    const cached = await this.kv.get(`user:${userId}`, 'json');
    if (cached) return cached;
    
    // Fetch from database and cache
    const user = await this.fetchUserFromDB(userId);
    await this.kv.put(`user:${userId}`, JSON.stringify(user), { expirationTtl: 3600 });
    return user;
  }
}
```

### 3. Database Schema Standards

- Never use db triggers unless explicit mention cause of difficultly in migration to other type of dbs (webhooks are better for async callback)
- Use UUID primary keys
- Include `created_at` and `updated_at` timestamps
- Use numeric status codes (0, 1, 2, 3) instead of strings for types, item status etc representation
- No need to use foreign keys or check constraints in db layer, as we will do it in app layer by validation and type checks to make db simple and reusable
- migration is done by migration command line tools provided by orm like drizzle, kysely (first priority) or knex, so always maintain migration scripts
- In backend add a folder called database and inside database add folder called migrations which has the migration files
- Have the latest schema in latest_schema.sql inside database folder, update this schema file every time we umake changes to schema so that we can refer to it for latest status of the db in staging or development mode


---

## Frontend Architecture

### 1. Project Structure

**Organize code by feature with clear separation of concerns**

```
frontend/web-app/client/src/
├── api/                    # API client and service layer
│   ├── client.ts          # Axios/fetch client with interceptors
│   ├── tasks.ts           # Task-related API calls
│   ├── projects.ts        # Project-related API calls
│   ├── auth.ts            # Authentication API calls
│   ├── organizations.ts   # Organization API calls
│   └── index.ts           # Export all APIs
├── components/
│   ├── auth/              # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── AuthGuard.tsx
│   ├── tasks/             # Task-related components
│   │   ├── TaskCard.tsx
│   │   ├── TaskColumn.tsx
│   │   ├── TaskDetailModal.tsx
│   │   ├── CreateTaskModal.tsx
│   │   └── CommentSection.tsx
│   ├── projects/          # Project-related components
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   └── CreateProjectModal.tsx
│   ├── layout/            # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── ui/                # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── common/            # Shared components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── Empty.tsx
├── pages/                 # Route/page components
│   ├── TaskBoard.tsx
│   ├── Projects.tsx
│   ├── CalendarView.tsx
│   ├── Login.tsx
│   └── NotFound.tsx
├── hooks/                 # Custom React hooks
│   ├── api/              # API-related hooks
│   │   ├── useTasks.ts
│   │   ├── useProjects.ts
│   │   └── useAuth.ts
│   ├── useComposition.ts
│   ├── useMobile.tsx
│   └── usePersistFn.ts
├── contexts/              # React contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── UIContext.tsx
├── types/                 # TypeScript type definitions
│   ├── index.ts          # Re-exports all types
│   ├── entities.ts       # Business entities (User, Task, Project)
│   ├── api.ts            # API request/response types
│   ├── enums.ts          # Enums and status codes
│   └── ui.ts             # UI-specific types
├── lib/                   # Utilities and helpers
│   ├── utils.ts          # General utilities (cn helper)
│   ├── query-client.ts   # React Query client setup
│   └── validation.ts     # Zod schemas
└── App.tsx
```

### 2. Component Size Guidelines

**Break large page components into smaller, reusable components**

**Component Size Limits:**
- **Page components**: Max 200 lines (if exceeding, decompose into sub-components)
- **Feature components**: Max 150 lines
- **UI components**: Max 100 lines

```tsx
// ❌ Bad - Everything in one 718-line component
// pages/TaskBoard.tsx (718 lines)
export default function TaskBoard() {
  // Massive component with:
  // - Task state management
  // - Drag and drop logic
  // - Modal rendering
  // - Comment handling
  // - File upload
  // All in one file!
  return (/* 700+ lines of JSX */);
};

// ✅ Good - Decomposed into focused components
// pages/TaskBoard/TaskBoard.tsx (100 lines)
export default function TaskBoard() {
  const { data: tasks } = useTasks(projectId);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="task-board">
      <TaskBoardHeader 
        projectId={projectId}
        onCreateTask={() => setCreateDialogOpen(true)}
      />
      
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          <TaskColumn 
            title="Hold" 
            tasks={tasks.filter(t => t.status_code === TaskStatus.HOLD.code)}
          />
          <TaskColumn 
            title="To Do" 
            tasks={tasks.filter(t => t.status_code === TaskStatus.TODO.code)}
          />
          <TaskColumn 
            title="In Progress" 
            tasks={tasks.filter(t => t.status_code === TaskStatus.IN_PROGRESS.code)}
          />
          <TaskColumn 
            title="Done" 
            tasks={tasks.filter(t => t.status_code === TaskStatus.DONE.code)}
          />
        </div>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
      
      {createDialogOpen && (
        <CreateTaskModal 
          projectId={projectId}
          onClose={() => setCreateDialogOpen(false)} 
        />
      )}
    </div>
  );
}

// components/tasks/TaskColumn.tsx (50 lines)
// components/tasks/TaskCard.tsx (80 lines)
// components/tasks/TaskDetailModal.tsx (150 lines)
// components/tasks/CreateTaskModal.tsx (120 lines)
// components/tasks/CommentSection.tsx (100 lines)
```

### 3. State Management Strategy

**Use the right tool for the right job - no need for Zustand/Redux if not for complex UI**

#### **A. Server State → React Query (TanStack Query)**

**Use React Query for ALL data from backend APIs**

```tsx
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Create custom query hooks for each feature:**

```tsx
// hooks/api/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api';
import { toast } from 'sonner';

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getById(taskId),
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.project_id] });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, statusCode }: { id: string; statusCode: number }) =>
      tasksApi.updateStatus(id, statusCode),
    // Optimistic update for better UX
    onMutate: async ({ id, statusCode }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old?.map(task => task.id === id ? { ...task, status_code: statusCode } : task)
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      toast.error('Failed to update task status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
  });
}
```

**Usage in components:**

```tsx
// pages/TaskBoard.tsx
export default function TaskBoard() {
  const { data: tasks, isLoading, error } = useTasks(projectId);
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const { mutate: createTask } = useCreateTask();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as number;
    
    // Optimistic update happens automatically
    updateStatus({ id: taskId, statusCode: newStatus });
  };

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorAlert error={error} />;

  return (/* JSX */);
}
```

#### **B. Global UI State → React Context**

**Use Context API for authentication, theme, and simple global UI state**

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await authApi.getSession();
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('access_token', response.data.accessToken);
    localStorage.setItem('refresh_token', response.data.refreshToken);
    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) return false;
      
      const response = await authApi.refreshToken(refresh);
      localStorage.setItem('access_token', response.data.accessToken);
      return true;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Protected Routes:**

```tsx
// components/auth/ProtectedRoute.tsx
import { Navigate } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { UserRoleCode } from '@/types/enums';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRoleCode[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role_code)) {
    return <Navigate to="/403" />; // Forbidden
  }

  return <>{children}</>;
}
```

**Usage in App:**

```tsx
// App.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types';

<Route path="/admin/*">
  <ProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN.code]}>
    <AdminDashboard />
  </ProtectedRoute>
</Route>

<Route path="/projects">
  <ProtectedRoute>
    <Projects />
  </ProtectedRoute>
</Route>
```

#### **C. Local Component State → useState/useReducer**

**Use useState for simple local state, useReducer for complex local state**

```tsx
// Simple local state
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [searchQuery, setSearchQuery] = useState('');

// Complex local state with useReducer
type FormState = {
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  errors: Record<string, string>;
};

type FormAction = 
  | { type: 'SET_FIELD'; field: keyof FormState; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const [formState, dispatch] = useReducer(formReducer, initialState);
```

#### **D. Form State → React Hook Form + Zod**

**Use React Hook Form for all forms with Zod validation**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  type_code: z.number().optional(),
  priority_code: z.number().optional(),
  assigned_to: z.string().uuid().optional(),
  deadline: z.string().datetime().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function CreateTaskForm({ projectId }: { projectId: string }) {
  const { mutate: createTask } = useCreateTask();
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    createTask({ ...data, project_id: projectId });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More form fields */}
        <Button type="submit">Create Task</Button>
      </form>
    </Form>
  );
}
```

#### **State Management Decision Matrix**

| State Type | Solution | Why | Example |
|------------|----------|-----|---------|
| **Server Data** (tasks, projects, users) | React Query | Auto-caching, refetching, sync | `useTasks()`, `useProjects()` |
| **Authentication** (user, token) | Context API | Simple global state, no performance issues | `useAuth()` |
| **Theme** (light/dark) | Context API | Already implemented, simple toggle | `useTheme()` |
| **UI State** (modals, sidebar) | useState | Component-local or lift up if needed | `const [open, setOpen] = useState(false)` |
| **Form State** | React Hook Form | Specialized, validation, performance | `useForm<TaskFormData>()` |

**❌ DO NOT use Zustand/Redux unless:**
- You add real-time collaboration (multiple users editing simultaneously)
- You have complex shared state across 10+ components
- Context causes performance issues (measure first!)
- You need offline-first support

### 4. API Integration Layer

**Create centralized API client with proper error handling and authentication**

#### **A. API Client Setup**

```typescript
// api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response.data, // Return only data
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${originalRequest.baseURL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data.data;
        localStorage.setItem('access_token', accessToken);
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### **B. Feature-Based API Services**

**Organize API calls by domain/feature**

```typescript
// api/tasks.ts
import apiClient from './client';
import type { Task, CreateTaskRequest, UpdateTaskRequest, ApiResponse } from '@/types';

export const tasksApi = {
  list: (projectId: string): Promise<ApiResponse<Task[]>> =>
    apiClient.get(`/projects/${projectId}/tasks`),
  
  getById: (taskId: string): Promise<ApiResponse<Task>> =>
    apiClient.get(`/tasks/${taskId}`),
  
  create: (data: CreateTaskRequest): Promise<ApiResponse<Task>> =>
    apiClient.post('/tasks', data),
  
  update: (id: string, data: UpdateTaskRequest): Promise<ApiResponse<Task>> =>
    apiClient.patch(`/tasks/${id}`, data),
  
  updateStatus: (id: string, statusCode: number): Promise<ApiResponse<Task>> =>
    apiClient.patch(`/tasks/${id}/status`, { status_code: statusCode }),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/tasks/${id}`),
  
  addComment: (taskId: string, data: { text: string; mentioned_emails?: string[] }): Promise<ApiResponse<Comment>> =>
    apiClient.post(`/tasks/${taskId}/comments`, data),
  
  getComments: (taskId: string): Promise<ApiResponse<Comment[]>> =>
    apiClient.get(`/tasks/${taskId}/comments`),
};

// api/projects.ts
export const projectsApi = {
  list: (organizationId?: string): Promise<ApiResponse<Project[]>> =>
    apiClient.get('/projects', { params: { organizationId } }),
  
  getById: (id: string): Promise<ApiResponse<Project>> =>
    apiClient.get(`/projects/${id}`),
  
  create: (data: CreateProjectRequest): Promise<ApiResponse<Project>> =>
    apiClient.post('/projects', data),
  
  update: (id: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> =>
    apiClient.patch(`/projects/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/projects/${id}`),
  
  getMembers: (projectId: string): Promise<ApiResponse<ProjectMember[]>> =>
    apiClient.get(`/projects/${projectId}/members`),
};

// api/auth.ts
export const authApi = {
  register: (data: { email: string; password: string; firstname: string; lastname: string }): Promise<ApiResponse<User>> =>
    apiClient.post('/auth/register', data),
  
  login: (data: { email: string; password: string }): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> =>
    apiClient.post('/auth/login', data),
  
  logout: (): Promise<ApiResponse<void>> =>
    apiClient.post('/auth/logout'),
  
  getSession: (): Promise<ApiResponse<User>> =>
    apiClient.get('/auth/session'),
  
  refreshToken: (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> =>
    apiClient.post('/auth/refresh', { refreshToken }),
  
  resetPassword: (email: string): Promise<ApiResponse<void>> =>
    apiClient.post('/auth/reset-password', { email }),
  
  resetPasswordConfirm: (token: string, newPassword: string): Promise<ApiResponse<void>> =>
    apiClient.post('/auth/reset-password/confirm', { token, newPassword }),
};

// api/organizations.ts
export const organizationsApi = {
  list: (): Promise<ApiResponse<Organization[]>> =>
    apiClient.get('/organizations'),
  
  getById: (id: string): Promise<ApiResponse<Organization>> =>
    apiClient.get(`/organizations/${id}`),
  
  create: (data: CreateOrganizationRequest): Promise<ApiResponse<Organization>> =>
    apiClient.post('/organizations', data),
  
  update: (id: string, data: UpdateOrganizationRequest): Promise<ApiResponse<Organization>> =>
    apiClient.patch(`/organizations/${id}`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/organizations/${id}`),
};

// api/uploads.ts
export const uploadsApi = {
  upload: async (file: File): Promise<ApiResponse<{ url: string; filename: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getSignedUrl: (fileId: string): Promise<ApiResponse<{ url: string }>> =>
    apiClient.get(`/uploads/${fileId}/signed-url`),
};

// api/notifications.ts
export const notificationsApi = {
  list: (): Promise<ApiResponse<Notification[]>> =>
    apiClient.get('/notifications'),
  
  markAsRead: (id: string): Promise<ApiResponse<void>> =>
    apiClient.patch(`/notifications/${id}`, { read: true }),
  
  markAllAsRead: (): Promise<ApiResponse<void>> =>
    apiClient.post('/notifications/mark-all-read'),
};

// api/index.ts - Export all
export { tasksApi } from './tasks';
export { projectsApi } from './projects';
export { authApi } from './auth';
export { organizationsApi } from './organizations';
export { uploadsApi } from './uploads';
export { notificationsApi } from './notifications';
```

#### **C. Error Handling Pattern**

```typescript
// ✅ Good - Explicit error handling in components
import { toast } from 'sonner';

export function TaskList({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useTasks(projectId);

  if (isLoading) {
    return <Skeleton count={5} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load tasks. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return <Empty message="No tasks found" icon={<ListTodo />} />;
  }

  return (
    <div className="space-y-2">
      {data.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}

// ✅ Good - Mutations with toast feedback
const { mutate: createTask, isPending } = useCreateTask();

const handleSubmit = (data: TaskFormData) => {
  createTask(data, {
    onSuccess: () => {
      toast.success('Task created successfully');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });
};
```

### 5. TypeScript Type Organization

**Centralize all types in dedicated types/ folder**

#### **A. Type Structure**

```
types/
├── index.ts           # Re-exports all types
├── entities.ts        # Business entities (User, Task, Project, etc.)
├── api.ts             # API request/response types
├── enums.ts           # Enums and status codes
└── ui.ts              # UI-specific types
```

#### **B. Entity Types**

```typescript
// types/entities.ts
export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role_code: UserRoleCode;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status_code: ProjectStatusCode;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status_code: TaskStatusCode;
  type_code: TaskTypeCode | null;
  priority_code: TaskPriorityCode | null;
  color: string | null;
  assigned_to: string | null;
  created_by: string;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  text: string; // Contains @[Name](email) format for mentions
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  comment_id: string | null;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type_code: NotificationTypeCode;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
```

#### **C. Typed Constants (Preferred over Enums)**

**Use typed constants with `as const` for better flexibility and type inference**

```typescript
// types/enums.ts

// Task Status
export const TaskStatus = {
  TODO: { code: 1, label: 'To Do', key: 'todo', color: 'gray' },
  IN_PROGRESS: { code: 2, label: 'In Progress', key: 'in_progress', color: 'blue' },
  DONE: { code: 3, label: 'Done', key: 'done', color: 'green' },
  WAITING: { code: 4, label: 'Waiting', key: 'waiting', color: 'yellow' },
  HOLD: { code: 5, label: 'Hold', key: 'hold', color: 'orange' },
} as const;

// User Role
export const UserRole = {
  SYSTEM_ADMIN: { code: 1, label: 'System Admin', key: 'system_admin' },
  ORGANIZATION_MANAGER: { code: 2, label: 'Organization Manager', key: 'organization_manager' },
  PROJECT_MANAGER: { code: 3, label: 'Project Manager', key: 'project_manager' },
  GEINO_USER: { code: 4, label: 'Geino User', key: 'geino_user' },
  GENBA_USER: { code: 5, label: 'Genba User', key: 'genba_user' },
} as const;

// Task Priority
export const TaskPriority = {
  LOW: { code: 1, label: 'Low', key: 'low', color: 'green', icon: '🟢' },
  MEDIUM: { code: 2, label: 'Medium', key: 'medium', color: 'yellow', icon: '🟡' },
  HIGH: { code: 3, label: 'High', key: 'high', color: 'orange', icon: '🟠' },
  URGENT: { code: 4, label: 'Urgent', key: 'urgent', color: 'red', icon: '🔴' },
} as const;

// Task Type
export const TaskType = {
  FEATURE: { code: 1, label: 'Feature', key: 'feature', color: 'blue' },
  BUG: { code: 2, label: 'Bug', key: 'bug', color: 'red' },
  TASK: { code: 3, label: 'Task', key: 'task', color: 'gray' },
  IMPROVEMENT: { code: 4, label: 'Improvement', key: 'improvement', color: 'purple' },
} as const;

// Project Status
export const ProjectStatus = {
  ACTIVE: { code: 1, label: 'Active', key: 'active', color: 'green' },
  COMPLETED: { code: 2, label: 'Completed', key: 'completed', color: 'blue' },
  ARCHIVED: { code: 3, label: 'Archived', key: 'archived', color: 'gray' },
} as const;

// Notification Type
export const NotificationType = {
  TASK_ASSIGNED: { code: 1, label: 'Task Assigned', key: 'task_assigned' },
  TASK_STATUS_CHANGED: { code: 2, label: 'Task Status Changed', key: 'task_status_changed' },
  COMMENT_CREATED: { code: 3, label: 'Comment Created', key: 'comment_created' },
  COMMENT_MENTIONED: { code: 4, label: 'Comment Mentioned', key: 'comment_mentioned' },
  PROJECT_INVITED: { code: 5, label: 'Project Invited', key: 'project_invited' },
  ROLE_ASSIGNED: { code: 6, label: 'Role Assigned', key: 'role_assigned' },
} as const;

// Extract types from constants
export type TaskStatusCode = typeof TaskStatus[keyof typeof TaskStatus]['code'];
export type TaskStatusKey = typeof TaskStatus[keyof typeof TaskStatus]['key'];
export type UserRoleCode = typeof UserRole[keyof typeof UserRole]['code'];
export type UserRoleKey = typeof UserRole[keyof typeof UserRole]['key'];
export type TaskPriorityCode = typeof TaskPriority[keyof typeof TaskPriority]['code'];
export type TaskTypeCode = typeof TaskType[keyof typeof TaskType]['code'];
export type ProjectStatusCode = typeof ProjectStatus[keyof typeof ProjectStatus]['code'];
export type NotificationTypeCode = typeof NotificationType[keyof typeof NotificationType]['code'];

// Helper functions for bidirectional lookup
export const getTaskStatusByCode = (code: number) =>
  Object.values(TaskStatus).find(s => s.code === code);

export const getTaskStatusByKey = (key: string) =>
  Object.values(TaskStatus).find(s => s.key === key);

export const getUserRoleByCode = (code: number) =>
  Object.values(UserRole).find(r => r.code === code);

export const getUserRoleByKey = (key: string) =>
  Object.values(UserRole).find(r => r.key === key);

export const getTaskPriorityByCode = (code: number) =>
  Object.values(TaskPriority).find(p => p.code === code);

export const getTaskTypeByCode = (code: number) =>
  Object.values(TaskType).find(t => t.code === code);

export const getProjectStatusByCode = (code: number) =>
  Object.values(ProjectStatus).find(s => s.code === code);

export const getNotificationTypeByCode = (code: number) =>
  Object.values(NotificationType).find(n => n.code === code);

// Get all values as arrays (useful for Select dropdowns)
export const taskStatusOptions = Object.values(TaskStatus);
export const userRoleOptions = Object.values(UserRole);
export const taskPriorityOptions = Object.values(TaskPriority);
export const taskTypeOptions = Object.values(TaskType);
export const projectStatusOptions = Object.values(ProjectStatus);
```

**Why Typed Constants over Enums?**

1. **Better Flexibility**: Each constant can hold multiple properties (code, label, key, color, icon)
2. **Easier Conversions**: Built-in bidirectional lookup (code ↔ key ↔ label)
3. **Better JSON Serialization**: Works naturally with API responses
4. **Tree-Shaking Friendly**: Only imported values are bundled
5. **Rich Metadata**: Can add colors, icons, sort order, etc.
6. **No Namespace Pollution**: Clear separation between types and values

**Usage Examples:**

```typescript
// ✅ Creating tasks with status
const newTask = {
  title: 'Build feature',
  status_code: TaskStatus.TODO.code, // 1
  priority_code: TaskPriority.HIGH.code, // 3
};

// ✅ Display status label from code
const task = { status_code: 2 };
const status = getTaskStatusByCode(task.status_code);
console.log(status?.label); // 'In Progress'
console.log(status?.color); // 'blue'

// ✅ Use in Select dropdown
import { taskStatusOptions } from '@/types/enums';

<Select>
  {taskStatusOptions.map(status => (
    <SelectItem key={status.key} value={status.code.toString()}>
      <span className={`text-${status.color}-600`}>{status.label}</span>
    </SelectItem>
  ))}
</Select>

// ✅ Display badge with color
const status = getTaskStatusByCode(task.status_code);
<Badge className={`bg-${status?.color}-100 text-${status?.color}-700`}>
  {status?.label}
</Badge>

// ✅ Check permission by role
import { UserRole } from '@/types/enums';

if (user.role_code === UserRole.SYSTEM_ADMIN.code) {
  // Allow access
}

// ✅ Filter by key
const todoTasks = tasks.filter(t => {
  const status = getTaskStatusByCode(t.status_code);
  return status?.key === 'todo';
});
```
```

#### **D. API Request/Response Types**

```typescript
// types/api.ts
import type { Task, Project, User, Organization, Comment, Notification } from './entities';

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Task API types
export interface CreateTaskRequest {
  project_id: string;
  title: string;
  description?: string;
  type_code?: number;
  priority_code?: number;
  assigned_to?: string;
  deadline?: string;
  status_code?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  type_code?: number;
  priority_code?: number;
  assigned_to?: string;
  deadline?: string;
  status_code?: number;
}

// Project API types
export interface CreateProjectRequest {
  organization_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  members: Array<{
    user_id: string;
    role_code: number; // 1: project_manager, 2: geino_user, 3: genba_user
  }>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status_code?: number;
}

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

// Organization API types
export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  manager_ids: string[]; // User IDs to assign as Organization Managers
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

// Comment API types
export interface CreateCommentRequest {
  text: string;
  mentioned_emails?: string[]; // Emails of mentioned users
}

// Upload API types
export interface UploadResponse {
  url: string;
  filename: string;
  file_size: number;
  mime_type: string;
}
```

#### **E. UI-Specific Types**

```typescript
// types/ui.ts
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  width?: string;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface FilterParams {
  search?: string;
  status?: number;
  assignee?: string;
  startDate?: string;
  endDate?: string;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}
```

#### **F. Index Re-exports**

```typescript
// types/index.ts
// Entities
export type {
  User,
  Organization,
  Project,
  Task,
  Comment,
  Attachment,
  Notification,
} from './entities';

// Typed Constants & Types
export {
  TaskStatus,
  UserRole,
  TaskPriority,
  TaskType,
  ProjectStatus,
  NotificationType,
  getTaskStatusByCode,
  getTaskStatusByKey,
  getUserRoleByCode,
  getUserRoleByKey,
  getTaskPriorityByCode,
  getTaskTypeByCode,
  getProjectStatusByCode,
  getNotificationTypeByCode,
  taskStatusOptions,
  userRoleOptions,
  taskPriorityOptions,
  taskTypeOptions,
  projectStatusOptions,
} from './enums';

export type {
  TaskStatusCode,
  TaskStatusKey,
  UserRoleCode,
  UserRoleKey,
  TaskPriorityCode,
  TaskTypeCode,
  ProjectStatusCode,
  NotificationTypeCode,
} from './enums';

// API types
export type {
  ApiResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateCommentRequest,
  UploadResponse,
} from './api';

// UI types
export type {
  SelectOption,
  TableColumn,
  PaginationParams,
  FilterParams,
  SortParams,
} from './ui';
```

**Usage:**

```typescript
// ✅ Good - Import from centralized types
import { Task, TaskStatus, getTaskStatusByCode, type TaskStatusCode } from '@/types';

// Use typed constant
const newTask = {
  title: 'Build feature',
  status_code: TaskStatus.TODO.code, // Type-safe, with metadata
};

// Use helper function
const status = getTaskStatusByCode(newTask.status_code);
console.log(status?.label); // 'To Do'
console.log(status?.color); // 'gray'

// ❌ Bad - Types defined inline in components
interface Task {
  id: string;
  title: string;
  // ... duplicated across files
}
```

### 6. Environment Variables & Configuration

**Validate environment variables at startup with type safety**

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url('Invalid API URL'),
  VITE_APP_ID: z.string().min(1, 'App ID is required'),
  VITE_APP_TITLE: z.string().min(1, 'App title is required'),
  VITE_APP_LOGO: z.string().url().optional(),
  VITE_ANALYTICS_ENDPOINT: z.string().url().optional(),
  VITE_ANALYTICS_WEBSITE_ID: z.string().optional(),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_APP_ID: import.meta.env.VITE_APP_ID,
      VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
      VITE_APP_LOGO: import.meta.env.VITE_APP_LOGO,
      VITE_ANALYTICS_ENDPOINT: import.meta.env.VITE_ANALYTICS_ENDPOINT,
      VITE_ANALYTICS_WEBSITE_ID: import.meta.env.VITE_ANALYTICS_WEBSITE_ID,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Environment validation failed');
    }
    throw error;
  }
}

export const env = validateEnv();

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>;
```

**Usage:**

```typescript
// ✅ Good - Type-safe, validated env access
import { env } from '@/lib/env';

const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
});

// ❌ Bad - Direct access, no validation, no types
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

**.env.example:**

```bash
# API Configuration
VITE_API_URL=http://localhost:8787/api/v1

# App Configuration
VITE_APP_ID=geino_saas_dev
VITE_APP_TITLE="Geino SaaS - Project Management"
VITE_APP_LOGO=https://placehold.co/40x40/3b82f6/ffffff?text=G

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=analytics_geino_saas
```

### 7. Form Handling with React Hook Form + Zod

**Use React Hook Form for ALL forms with Zod validation**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Define validation schema
const taskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters'),
  description: z.string().optional(),
  type_code: z.number().optional(),
  priority_code: z.number().min(1).max(4).optional(),
  assigned_to: z.string().uuid('Invalid user ID').optional(),
  deadline: z.string().datetime().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function CreateTaskForm({ projectId, onSuccess }: Props) {
  const { mutate: createTask, isPending } = useCreateTask();
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      type_code: undefined,
      priority_code: undefined,
      assigned_to: undefined,
      deadline: undefined,
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTask(
      { ...data, project_id: projectId },
      {
        onSuccess: () => {
          form.reset();
          onSuccess();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter task description" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* More form fields */}
        
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Task'}
        </Button>
      </form>
    </Form>
  );
}
```

**Validation Schema Library:**

```typescript
// lib/validation.ts
import { z } from 'zod';

// Reusable schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const uuidSchema = z.string().uuid('Invalid ID format');

// Task schemas
export const createTaskSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type_code: z.number().min(1).max(4).optional(),
  priority_code: z.number().min(1).max(4).optional(),
  assigned_to: uuidSchema.optional(),
  deadline: z.string().datetime().optional(),
});

// Project schemas
export const createProjectSchema = z.object({
  organization_id: uuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  members: z.array(z.object({
    user_id: uuidSchema,
    role_code: z.number().min(1).max(3),
  })),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['end_date'] }
);

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstname: z.string().min(1, 'First name is required').max(255),
  lastname: z.string().min(1, 'Last name is required').max(255),
});
```

---

## General Best Practices

### 1. Error Handling & Loading States

**Implement consistent patterns across the application**

#### **Loading States**

```typescript
// ✅ Good - Skeleton loaders for better UX
import { Skeleton } from '@/components/ui/skeleton';

export function TaskList({ projectId }: Props) {
  const { data: tasks, isLoading, error } = useTasks(projectId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // ... rest of component
}
```

#### **Error States**

```typescript
// ✅ Good - User-friendly error messages
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message || 'Failed to load tasks. Please try again.'}
      </AlertDescription>
    </Alert>
  );
}
```

#### **Empty States**

```typescript
// ✅ Good - Helpful empty states
import { Empty } from '@/components/common/Empty';
import { ListTodo } from 'lucide-react';

if (!data || data.length === 0) {
  return (
    <Empty 
      icon={<ListTodo className="w-12 h-12" />}
      title="No tasks found"
      description="Create your first task to get started"
      action={
        <Button onClick={onCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      }
    />
  );
}
```

#### **Mutation Feedback**

```typescript
// ✅ Good - Toast notifications for user actions
import { toast } from 'sonner';

const { mutate: deleteTask } = useDeleteTask();

const handleDelete = (taskId: string) => {
  deleteTask(taskId, {
    onSuccess: () => {
      toast.success('Task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });
};
```

#### **Global Error Boundary**

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Send to error monitoring service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </AlertDescription>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. Performance Optimization

#### **A. React Performance**

```typescript
// ✅ Good - Memoize expensive computations
import { useMemo } from 'react';

export function TaskList({ tasks, filter }: Props) {
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => filter.status ? task.status_code === filter.status : true)
      .filter(task => filter.assignee ? task.assigned_to === filter.assignee : true)
      .sort((a, b) => a.priority_code - b.priority_code);
  }, [tasks, filter]);

  return (/* JSX */);
}

// ✅ Good - Memoize callbacks passed to children
import { useCallback } from 'react';

export function TaskBoard() {
  const { mutate: updateStatus } = useUpdateTaskStatus();
  
  const handleTaskUpdate = useCallback((taskId: string, statusCode: number) => {
    updateStatus({ id: taskId, statusCode });
  }, [updateStatus]);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onUpdate={handleTaskUpdate} // Stable reference
        />
      ))}
    </div>
  );
}

// ✅ Good - Memoize expensive components
import { memo } from 'react';

export const TaskCard = memo(({ task, onUpdate }: Props) => {
  return (/* JSX */);
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.status_code === nextProps.task.status_code;
});
```

#### **B. Code Splitting & Lazy Loading**

```typescript
// ✅ Good - Lazy load routes
import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';

const TaskBoard = lazy(() => import('@/pages/TaskBoard'));
const Projects = lazy(() => import('@/pages/Projects'));
const CalendarView = lazy(() => import('@/pages/CalendarView'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Switch>
        <Route path="/taskboard" component={TaskBoard} />
        <Route path="/projects" component={Projects} />
        <Route path="/calendar" component={CalendarView} />
      </Switch>
    </Suspense>
  );
}

// ✅ Good - Lazy load heavy components
const TaskDetailModal = lazy(() => import('@/components/tasks/TaskDetailModal'));

export function TaskBoard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      {/* Task board content */}
      
      {selectedTask && (
        <Suspense fallback={<Spinner />}>
          <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
        </Suspense>
      )}
    </>
  );
}
```

#### **C. Bundle Size Optimization**

```typescript
// ✅ Good - Import only what you need
import { format } from 'date-fns';
import { Plus, Edit, Trash } from 'lucide-react';

// ❌ Bad - Import entire library
import * as dateFns from 'date-fns';
import * as Icons from 'lucide-react';

// Check bundle size
// pnpm build && pnpm vite-bundle-visualizer
```

#### **D. Image Optimization**

```typescript
// ✅ Good - Lazy load images
<img 
  src={task.image_url} 
  alt={task.title}
  loading="lazy"
  className="w-full h-48 object-cover"
/>

// ✅ Good - Use appropriate image formats
// - WebP for photos
// - SVG for icons/logos
// - PNG for transparency
```

### 3. Backend Integration Checklist

**Complete this checklist before starting backend integration**

#### **Pre-Integration Setup**
- [ ] Install dependencies: `pnpm add @tanstack/react-query axios zod react-hook-form @hookform/resolvers`
- [ ] Create `api/` folder with client.ts and feature services
- [ ] Create `types/` folder (entities.ts, api.ts, enums.ts, ui.ts)
- [ ] Set up React Query in main.tsx with QueryClientProvider
- [ ] Create AuthContext and useAuth hook
- [ ] Add environment variable validation (lib/env.ts)
- [ ] Create custom query hooks for each feature (hooks/api/)
- [ ] Set up axios interceptors for auth token and refresh
- [ ] Add error boundary at root level
- [ ] Set up toast notifications (Sonner already added)

#### **During Integration**
- [ ] Replace MOCK_TASKS with useTasks() hook
- [ ] Replace MOCK_PROJECTS with useProjects() hook
- [ ] Replace MOCK_NOTIFICATIONS with useNotifications() hook
- [ ] Replace MOCK_CALENDAR_TASKS with API call
- [ ] Implement optimistic updates for drag-and-drop
- [ ] Add loading skeletons to all data-fetching components
- [ ] Add error states with user-friendly messages
- [ ] Add empty states with helpful CTAs
- [ ] Test authentication flow (login, logout, token refresh)
- [ ] Test all CRUD operations (create, read, update, delete)
- [ ] Handle file uploads with Cloudflare R2 signed URLs
- [ ] Implement @mention parsing and notification

#### **Post-Integration**
- [ ] Remove all mock data files (shared/const.ts)
- [ ] Test with real backend API (staging environment)
- [ ] Add request/response logging in development
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Performance audit (React DevTools, Lighthouse)
- [ ] Bundle size check (vite-bundle-visualizer)
- [ ] Update technical spec with actual API endpoints
- [ ] Document any API changes or deviations from spec

### 4. Accessibility Guidelines

**Ensure the application is accessible to all users**

```typescript
// ✅ Good - Proper ARIA labels
<button
  aria-label="Delete task"
  onClick={handleDelete}
>
  <Trash className="w-4 h-4" />
</button>

// ✅ Good - Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Click me
</div>

// ✅ Good - Focus management in modals
import { useEffect, useRef } from 'react';

export function Modal({ isOpen, onClose, children }: Props) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      firstFocusableRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Modal Title</DialogTitle>
        <Button ref={firstFocusableRef}>First Button</Button>
        {children}
      </DialogContent>
    </Dialog>
  );
}

// ✅ Good - Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/tasks">Tasks</a></li>
  </ul>
</nav>
```

### 5. Version Control

**Use conventional commit messages and proper branching strategy**

```bash
# Commit message format
feat(tasks): add drag and drop functionality to task board
fix(auth): resolve token refresh infinite loop
refactor(api): migrate to TanStack Query
docs(guide): update frontend architecture section
chore(deps): update dependencies
style(tasks): improve task card layout

# Branch naming
feature/task-board-drag-drop
fix/calendar-date-picker
refactor/api-client-structure
docs/update-contributing-guide
```

### 6. Security Practices

#### **Frontend Security**

```typescript
// ✅ Good - Sanitize user input before rendering
import DOMPurify from 'isomorphic-dompurify';

export function CommentText({ comment }: Props) {
  const sanitizedHtml = DOMPurify.sanitize(comment.text);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}

// ✅ Good - Validate file uploads
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

export function FileUpload({ onUpload }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, GIF, PDF');
      return;
    }

    onUpload(file);
  };

  return <input type="file" onChange={handleFileChange} />;
}

// ✅ Good - Never expose sensitive data
// Store tokens in httpOnly cookies (backend) or secure localStorage
// Never log tokens or sensitive data
// Use environment variables for API keys
```

#### **General Security**
- Always validate input on both frontend and backend
- Use proper authentication and authorization
- Sanitize data before database operations
- Use HTTPS in production
- Keep dependencies updated (`pnpm audit`)
- Implement rate limiting on backend
- Use Content Security Policy (CSP) headers

### 7. Testing Strategy (Future Implementation)

```typescript
// Unit tests with Vitest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  it('renders task title', () => {
    const task = { id: '1', title: 'Test Task', status_code: 1 };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('calls onUpdate when edited', async () => {
    const onUpdate = vi.fn();
    const task = { id: '1', title: 'Test Task', status_code: 1 };
    render(<TaskCard task={task} onUpdate={onUpdate} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    // ... interact with form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });
});
```

### 8. Documentation

- Always keep documentation in `docs/` folder
- Update technical spec when adding features
- Document complex business logic with JSDoc comments
- Keep README.md up to date with setup instructions

### 9. Sprint Flow

- Check user stories in sprint doc
- Update app progress doc upon completing a feature
- Development order for end-to-end features:
  1. Database migrations
  2. Backend API/services
  3. Frontend integration
  4. Testing and QA

### 10. Code Navigation

- Always use absolute paths from project root (`@/components`, not `../../components`)
- Use TypeScript "Go to Definition" for navigation
- Leverage IDE search (Cmd+P for files, Cmd+Shift+F for text)

---

## Summary

This coding guide should be followed for all new features and gradually applied to existing code during refactoring sessions. Regular code reviews should ensure adherence to these standards.

**Key Principles:**
1. **Type Safety**: Use TypeScript strictly, no `any` types
2. **State Management**: React Query for server state, Context for global UI state, useState for local state
3. **Component Size**: Keep components small (< 200 lines), decompose when needed
4. **API Layer**: Centralized API client with feature-based services
5. **Error Handling**: Consistent patterns with loading, error, and empty states
6. **Performance**: Memoization, code splitting, lazy loading
7. **Accessibility**: Proper ARIA labels, keyboard navigation, focus management
8. **Security**: Input validation, XSS prevention, secure token storage

The sample code in this document provides examples; improve and adapt as needed for your specific use cases.

## Others 

# Service Layer Architecture Diagram

## Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          HTTP Request                                │
│                     (POST /api/auth/register)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       HANDLER LAYER (Thin)                           │
│                   handlers/auth/registerHandler.ts                   │
├─────────────────────────────────────────────────────────────────────┤
│  Responsibilities:                                                   │
│  ✓ Extract request data (body, params, query)                       │
│  ✓ Instantiate service with dependencies (db, env)                  │
│  ✓ Call service method                                              │
│  ✓ Map ServiceResponse to HTTP response                             │
│  ✓ Set HTTP status codes                                            │
│  ✓ Set cookies (for auth endpoints)                                 │
│                                                                      │
│  ✗ NO business logic                                                │
│  ✗ NO database operations                                           │
│  ✗ NO validation logic                                              │
│  ✗ NO external API calls                                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ authService.register(data)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER (Thick)                          │
│                     services/auth/AuthService.ts                     │
├─────────────────────────────────────────────────────────────────────┤
│  Responsibilities:                                                   │
│  ✓ Business logic and data manipulation                             │
│  ✓ Database operations (CRUD, queries, transactions)                │
│  ✓ External API calls (Supabase Auth, etc.)                         │
│  ✓ Data aggregation and calculations                                │
│  ✓ Error handling with structured responses                         │
│                                                                      │
│  Calls:                                                              │
│  → ValidationService for input validation                           │
│  → BaseService utilities (timestamps, pagination, etc.)             │
│  → Database (via Drizzle ORM)                                       │
│  → External APIs (Supabase client)                                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌────────────────┐    ┌────────────────────┐    ┌───────────────────┐
│  VALIDATION    │    │   DATABASE         │    │  EXTERNAL API     │
│  SERVICE       │    │   (Drizzle ORM)    │    │  (Supabase Auth)  │
├────────────────┤    ├────────────────────┤    ├───────────────────┤
│ • validateEmail│    │ • insert()         │    │ • signUp()        │
│ • validatePass │    │ • update()         │    │ • signIn()        │
│ • validateUUID │    │ • delete()         │    │ • resetPassword() │
│ • validateData │    │ • query.findMany() │    │ • updateUser()    │
└────────────────┘    │ • count()          │    │ • deleteUser()    │
                      └────────────────────┘    └───────────────────┘
                                 │
                                 │ ServiceResponse<T>
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE RESPONSE                                │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                   │
│    success: boolean,                                                 │
│    data?: T,                                                         │
│    error?: string,                                                   │
│    code?: string  // e.g., 'USER_NOT_FOUND', 'VALIDATION_ERROR'     │
│  }                                                                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ return to handler
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       HANDLER LAYER                                  │
│                  (Map to HTTP Response)                              │
├─────────────────────────────────────────────────────────────────────┤
│  if (!result.success) {                                              │
│    return c.json({ error: result.error }, statusCode);              │
│  }                                                                   │
│  return c.json({ message: 'Success', data: result.data });          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        HTTP Response                                 │
│                    200 OK / 400 Bad Request                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Layer Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                        Handler Layer                          │
│                                                               │
│  Can depend on:                                              │
│  ✓ Services (UserService, AuthService, etc.)                │
│  ✓ Context (Hono Context)                                   │
│  ✓ Types                                                     │
│                                                               │
│  Cannot depend on:                                           │
│  ✗ Database directly                                         │
│  ✗ External APIs directly                                    │
│  ✗ Validation logic directly                                 │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ depends on
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        Service Layer                          │
│                                                               │
│  Can depend on:                                              │
│  ✓ BaseService (inheritance)                                 │
│  ✓ ValidationService (composition)                           │
│  ✓ Database (Drizzle ORM)                                   │
│  ✓ External APIs (Supabase, etc.)                           │
│  ✓ Other Services (if needed)                               │
│  ✓ Types                                                     │
│                                                               │
│  Cannot depend on:                                           │
│  ✗ Handlers                                                  │
│  ✗ HTTP Context                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ depends on
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      Base Service Layer                       │
│                                                               │
│  Provides:                                                   │
│  • Common utilities (timestamps, pagination, etc.)           │
│  • Error handling helpers                                    │
│  • Response builders (success, error)                        │
│  • Transaction wrapper                                       │
│  • Database and environment access                           │
└──────────────────────────────────────────────────────────────┘
```

## Service Inheritance

```
                    ┌─────────────────┐
                    │   BaseService   │
                    │                 │
                    │ • db            │
                    │ • env           │
                    │ • success()     │
                    │ • error()       │
                    │ • handleError() │
                    │ • pagination    │
                    └────────┬────────┘
                             │
                             │ extends
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │ AuthService  │ │ UserService  │ │ OtherService │
      │              │ │              │ │              │
      │ • register() │ │ • listUsers()│ │ • ...        │
      │ • login()    │ │ • getUser()  │ │              │
      │ • reset()    │ │ • update()   │ │              │
      │ • update()   │ │ • delete()   │ │              │
      └──────────────┘ └──────────────┘ └──────────────┘
              │              │              │
              │              │              │
              │ uses         │ uses         │ uses
              ▼              ▼              ▼
         ┌────────────────────────────────────┐
         │       ValidationService            │
         │                                    │
         │ • validateEmail()                  │
         │ • validatePassword()               │
         │ • validateUserId()                 │
         │ • validateRegistrationData()       │
         └────────────────────────────────────┘
```

## Transaction Flow (Delete User Example)

```
Handler
  │
  │ deleteUser(id)
  ▼
UserService.deleteUser(id)
  │
  ├─► 1. Validate user ID
  │   └─► ValidationService.validateUserId(id)
  │
  ├─► 2. Start transaction
  │   └─► withTransaction(async (db) => {
  │
  ├─► 3. Delete from database
  │   └─► db.delete(users).where(eq(users.id, id))
  │       │
  │       ├─► Success: Continue
  │       └─► Fail: Return error
  │
  ├─► 4. Delete from Supabase Auth
  │   └─► supabase.auth.admin.deleteUser(id)
  │       │
  │       ├─► Success: Commit transaction
  │       └─► Fail: Log error (already deleted from DB)
  │
  └─► 5. Return ServiceResponse
      └─► { success: true, data: undefined }
```

## Folder Structure

```
backend/worker/src/
├── handlers/                    # HTTP Layer (Thin)
│   ├── auth/
│   │   ├── registerHandler.ts   # Calls AuthService.register()
│   │   ├── loginHandler.ts      # Calls AuthService.login()
│   │   ├── resetPasswordHandler.ts
│   │   └── updatePasswordHandler.ts
│   └── users/
│       ├── listUsersHandler.ts  # Calls UserService.listUsers()
│       ├── getUserHandler.ts    # Calls UserService.getUserById()
│       ├── updateUserHandler.ts # Calls UserService.updateUserRole()
│       └── deleteUserHandler.ts # Calls UserService.deleteUser()
│
├── services/                    # Business Logic Layer (Thick)
│   ├── base/
│   │   └── BaseService.ts       # Base class with common utilities
│   ├── validation/
│   │   └── ValidationService.ts # Input validation logic
│   ├── auth/
│   │   └── AuthService.ts       # Supabase auth operations
│   ├── users/
│   │   └── UserService.ts       # User CRUD operations
│   └── index.ts                 # Centralized exports
│
├── db/
│   ├── schema.ts                # Drizzle schema definitions
│   └── client.ts                # Database client setup
│
├── middleware/
│   └── auth.ts                  # Authentication middleware
│
└── routes/
    ├── auth.ts                  # Route definitions (thin)
    └── users.ts                 # Route definitions (thin)
```

## Key Principles

1. **Handlers are Thin**
   - Only HTTP concerns
   - No business logic
   - ~10-20 lines per handler

2. **Services are Thick**
   - All business logic
   - All database operations
   - All external API calls
   - ~50-200 lines per service

3. **Validation is Centralized**
   - One ValidationService
   - Consistent rules across all endpoints
   - Easy to maintain and test

4. **Errors are Consistent**
   - ServiceResponse pattern
   - Error codes for specific handling
   - Structured error messages

5. **Dependencies are Clear**
   - Handlers depend on Services
   - Services depend on BaseService and ValidationService
   - No circular dependencies

6. **Code is Testable**
   - Services can be unit tested independently
   - Mock database and external APIs
   - Test validation logic separately

7. **Architecture is Scalable**
   - Easy to add new services
   - Easy to add new handlers
   - Clear patterns to follow
