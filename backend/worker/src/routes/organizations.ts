import { Hono } from 'hono';
import { authenticate, requireSystemAdmin } from '../middleware/auth';
import type { PreAuthEnv } from '../types';
import { createOrganizationHandler } from '../handlers/organizations/createOrganizationHandler';
import { listOrganizationsHandler } from '../handlers/organizations/listOrganizationsHandler';
import { getOrganizationHandler } from '../handlers/organizations/getOrganizationHandler';
import { updateOrganizationHandler } from '../handlers/organizations/updateOrganizationHandler';
import { deleteOrganizationHandler } from '../handlers/organizations/deleteOrganizationHandler';
import { addMemberHandler } from '../handlers/organizations/addMemberHandler';
import { removeMemberHandler } from '../handlers/organizations/removeMemberHandler';

const organizationsRoute = new Hono<PreAuthEnv>();

// Middleware to authenticate all organization routes
organizationsRoute.use('*', async (c, next) => {
  try {
    await authenticate(c);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// Organization CRUD routes
organizationsRoute.post('/', requireSystemAdmin(), createOrganizationHandler);
organizationsRoute.get('/', listOrganizationsHandler); // Filtered by access in handler
organizationsRoute.get('/:id', getOrganizationHandler); // Access control in handler
organizationsRoute.patch('/:id', updateOrganizationHandler); // Access control in handler
organizationsRoute.delete('/:id', requireSystemAdmin(), deleteOrganizationHandler);

// Member management routes (System Admin only)
organizationsRoute.post('/:id/members', requireSystemAdmin(), addMemberHandler);
organizationsRoute.delete('/:id/members/:userId', requireSystemAdmin(), removeMemberHandler);

export default organizationsRoute;
