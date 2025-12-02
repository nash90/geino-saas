import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import type { Env, AuthUser } from '../types';
import type { DbClient } from '../db/client';
import { createProjectHandler } from '../handlers/projects/createProjectHandler';
import { listProjectsHandler } from '../handlers/projects/listProjectsHandler';
import { getProjectHandler } from '../handlers/projects/getProjectHandler';
import { updateProjectHandler } from '../handlers/projects/updateProjectHandler';
import { deleteProjectHandler } from '../handlers/projects/deleteProjectHandler';
import { addProjectMemberHandler } from '../handlers/projects/addProjectMemberHandler';
import { removeProjectMemberHandler } from '../handlers/projects/removeProjectMemberHandler';

const projectsRoute = new Hono<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>();

// Middleware to authenticate all project routes
projectsRoute.use('*', async (c, next) => {
  try {
    await authenticate(c);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// Project CRUD routes
projectsRoute.post('/', createProjectHandler); // Org Manager or above (checked in handler)
projectsRoute.get('/', listProjectsHandler); // Filtered by access in handler
projectsRoute.get('/:id', getProjectHandler); // Access control in handler
projectsRoute.patch('/:id', updateProjectHandler); // Project Manager or above (checked in handler)
projectsRoute.delete('/:id', deleteProjectHandler); // Org Manager or above (checked in handler)

// Member management routes
projectsRoute.post('/:id/members', addProjectMemberHandler); // Project Manager or above (checked in handler)
projectsRoute.delete('/:id/members/:userId', removeProjectMemberHandler); // Project Manager or above (checked in handler)

export default projectsRoute;
