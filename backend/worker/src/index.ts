import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDbClient } from './db/client';
import { Profiler } from './lib/profiler';
import auth from './routes/auth';
import users from './routes/users';
import organizations from './routes/organizations';
import projects from './routes/projects';
import tasks from './routes/tasks';
import type { Env } from './types';
import type { DbClient } from './db/client';

const app = new Hono<{ Bindings: Env; Variables: { db: DbClient; profiler: Profiler } }>();

// CORS middleware
app.use('*', cors({
  origin: (origin) => {
    // Allow localhost and production domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://geinosaas.yamacity.com', // Staging
      // Production domains will be added when deploying to client's account
    ];
    
    // Allow Cloudflare Pages preview deployments (*.pages.dev)
    if (origin && origin.includes('.pages.dev')) {
      return origin;
    }
    
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// Database middleware - attach db client and profiler to context
app.use('*', async (c, next) => {
  // Only profile specific routes
  const shouldProfile = c.req.path.startsWith('/api/projects');
  const profiler = new Profiler();
  
  const db = createDbClient(c.env.DATABASE_URL);
  profiler.checkpoint('DB client create');
  
  c.set('db', db);
  c.set('profiler', profiler);

  try {
    await next();
    profiler.checkpoint('Handler execute');
  } finally {
    // Close database connection
    await db.$client?.end?.();
    profiler.checkpoint('DB close');
    
    // Only log profiling for targeted routes
    if (shouldProfile) {
      console.log(`\n[${c.req.method} ${c.req.path}]`);
      console.log(profiler.report());
    }
  }
});

// Health check
app.get('/', (c) => {
  return c.json({ message: 'Geino SaaS API is running', version: '1.0.0' });
});

// Mount routes
app.route('/api/auth', auth);
app.route('/api/users', users);
app.route('/api/organizations', organizations);
app.route('/api/projects', projects);
app.route('/api', tasks); // Tasks routes include /projects/:projectId/tasks, /tasks, /comments, /calendar, /uploads

export default app;
