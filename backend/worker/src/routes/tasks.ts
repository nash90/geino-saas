import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import type { Env, AuthUser } from '../types';
import type { DbClient } from '../db/client';

// Task handlers
import { listTasksHandler } from '../handlers/tasks/listTasksHandler';
import { getTaskHandler } from '../handlers/tasks/getTaskHandler';
import { createTaskHandler } from '../handlers/tasks/createTaskHandler';
import { updateTaskHandler } from '../handlers/tasks/updateTaskHandler';
import { updateTaskStatusHandler } from '../handlers/tasks/updateTaskStatusHandler';
import { deleteTaskHandler } from '../handlers/tasks/deleteTaskHandler';
import { duplicateTaskHandler } from '../handlers/tasks/duplicateTaskHandler';

// Comment handlers
import { listCommentsHandler } from '../handlers/tasks/listCommentsHandler';
import { addCommentHandler } from '../handlers/tasks/addCommentHandler';
import { updateCommentHandler } from '../handlers/tasks/updateCommentHandler';
import { deleteCommentHandler } from '../handlers/tasks/deleteCommentHandler';

// Calendar handler
import { getCalendarTasksHandler } from '../handlers/tasks/getCalendarTasksHandler';

// Upload handlers
import { generateUploadUrlHandler } from '../handlers/uploads/generateUploadUrlHandler';
import { confirmUploadHandler } from '../handlers/uploads/confirmUploadHandler';
import { getDownloadUrlHandler } from '../handlers/uploads/getDownloadUrlHandler';
import { deleteAttachmentHandler } from '../handlers/uploads/deleteAttachmentHandler';

const tasksRoute = new Hono<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>();

// Middleware to authenticate all task routes
tasksRoute.use('*', async (c, next) => {
  try {
    await authenticate(c);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// Project-scoped task operations
tasksRoute.get('/projects/:projectId/tasks', listTasksHandler); // List tasks with filtering
tasksRoute.post('/projects/:projectId/tasks', createTaskHandler); // Create task (PM+ or Genba for Hold)

// Task CRUD operations
tasksRoute.get('/tasks/:taskId', getTaskHandler); // Get task with details
tasksRoute.patch('/tasks/:taskId', updateTaskHandler); // Update task (PM+ or owner for Genba)
tasksRoute.patch('/tasks/:taskId/status', updateTaskStatusHandler); // Update status (for drag-drop)
tasksRoute.delete('/tasks/:taskId', deleteTaskHandler); // Delete task (PM+ only)
tasksRoute.post('/tasks/:taskId/duplicate', duplicateTaskHandler); // Duplicate task

// Comment operations
tasksRoute.get('/tasks/:taskId/comments', listCommentsHandler); // List comments with attachments
tasksRoute.post('/tasks/:taskId/comments', addCommentHandler); // Add comment
tasksRoute.patch('/comments/:commentId', updateCommentHandler); // Update comment (owner only)
tasksRoute.delete('/comments/:commentId', deleteCommentHandler); // Delete comment (owner or PM+)

// Calendar view
tasksRoute.get('/calendar/tasks', getCalendarTasksHandler); // Get tasks grouped by date

// File upload operations
tasksRoute.post('/uploads/generate-upload-url', generateUploadUrlHandler); // Generate R2 signed upload URL
tasksRoute.post('/uploads/confirm', confirmUploadHandler); // Confirm upload and create attachment record
tasksRoute.get('/uploads/:attachmentId/download-url', getDownloadUrlHandler); // Get R2 signed download URL
tasksRoute.delete('/uploads/:attachmentId', deleteAttachmentHandler); // Delete attachment (owner or PM+)

export default tasksRoute;
