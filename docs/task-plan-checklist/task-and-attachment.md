# Implementation Plan: Task Management System (US-12 to US-16)

## Overview

This plan covers the implementation of User Stories 12-16, which provide comprehensive task management functionality including:
- Task creation and editing with assignments and deadlines
- Drag-and-drop status updates on a Kanban board
- Task duplication
- Calendar view for tasks
- Role-based access control for task operations

**Note:** Email notifications are deferred to a future implementation using Cloudflare Queues (per user request).

---

## Current State Analysis

### What Exists
✅ **Frontend UI (Fully Built)**
- Kanban board with drag-and-drop functionality (TaskBoard.tsx - 700+ lines)
- Calendar view with month/week toggles (CalendarView.tsx)
- Task creation/edit modals with all required fields
- Comment sections in task detail view
- Uses mock data - no backend integration

✅ **Backend Architecture Patterns**
- Service layer pattern (BaseService, CommandService, QueryService)
- Thin handler pattern with permission checks
- AuthorizationService with role-based access control
- Project and organization management as reference implementations

✅ **Access Control Infrastructure**
- projectMembers table with projectRoleCode (1=PM, 2=Geino, 3=Genba)
- AuthorizationService.isProjectManagerOrAbove()
- Frontend usePermissions() hook

### What's Missing
❌ **Backend Task System**
- No tasks table in database schema
- No TaskStatus/TaskType/TaskPriority code definitions
- No TaskService, handlers, or routes
- No task-related types or models

❌ **Frontend Integration**
- No api/tasks.ts client
- No Task/TaskComment type definitions
- TaskBoard uses mock data instead of API calls
- No permission-based UI controls for task operations

---

## File Upload Architecture (Cloudflare R2 + Signed URLs)

### Overview

Based on your requirements, file attachments will be handled using **Cloudflare R2** (S3-compatible object storage) with **signed URLs** for both upload and download operations. This approach provides:

1. **Secure uploads:** Frontend gets a signed upload URL, uploads directly to R2
2. **Secure downloads:** Backend generates signed download URLs with expiration
3. **Scalability:** Direct R2 uploads bypass worker bandwidth limits
4. **Access control:** Only users with task access can generate download URLs

### Upload Flow

```
1. User selects file in Task Create or Comment section
2. Frontend calls: POST /api/uploads/generate-upload-url
   Body: { fileName, fileSize, mimeType, taskId?, commentId? }
3. Backend validates user access to task
4. Backend generates R2 signed upload URL (PUT method, 5-minute expiration)
5. Backend returns: { uploadId, uploadUrl, fileKey }
6. Frontend uploads file directly to R2 using signed URL (PUT request)
7. Frontend calls: POST /api/uploads/confirm
   Body: { uploadId, fileKey }
8. Backend creates attachment record in database
9. Backend returns: Attachment object
```

### Download Flow

```
1. User clicks attachment in UI
2. Frontend calls: GET /api/uploads/{attachmentId}/download-url
3. Backend validates user access to task
4. Backend generates R2 signed download URL (GET method, 1-hour expiration)
5. Backend returns: { downloadUrl }
6. Frontend redirects or opens downloadUrl in new tab
7. File downloads directly from R2
```

### R2 Bucket Structure

```
/tasks/{taskId}/images/{uuid}-{filename}      (Task-level attachments)
/tasks/{taskId}/comments/{uuid}-{filename}    (Comment attachments)
```

### Security Considerations

- Signed URLs expire (upload: 5 min, download: 1 hour)
- Backend validates task access before generating URLs
- File size limits enforced (e.g., 10MB per file)
- Allowed mime types validation (images, PDFs, docs)
- Virus scanning (optional, Phase 2)

---

## Implementation Phases

### Phase 1: Database Schema & Types

**Goal:** Create the database foundation for tasks

#### 1.1 Add Code Type Definitions

**File:** `backend/worker/src/types/codeTypes.ts`

Add:
```typescript
export const TaskStatus = {
  HOLD: { code: 1, label: 'Hold', key: 'hold' },
  TODO: { code: 2, label: 'To Do', key: 'todo' },
  IN_PROGRESS: { code: 3, label: 'In Progress', key: 'in_progress' },
  DONE: { code: 4, label: 'Done', key: 'done' },
  WAITING: { code: 5, label: 'Waiting', key: 'waiting' }
} as const;

export const TaskPriority = {
  LOW: { code: 1, label: 'Low', key: 'low' },
  MEDIUM: { code: 2, label: 'Medium', key: 'medium' },
  HIGH: { code: 3, label: 'High', key: 'high' },
  URGENT: { code: 4, label: 'Urgent', key: 'urgent' }
} as const;

export const TaskType = {
  TYPE_A: { code: 1, label: 'Type A', key: 'type_a' },
  TYPE_B: { code: 2, label: 'Type B', key: 'type_b' }
} as const;
```

#### 1.2 Add Task Schema

**File:** `backend/worker/src/db/schema.ts`

Add these tables:

```typescript
// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  statusCode: integer('status_code').notNull().default(1), // Default: HOLD
  typeCode: integer('type_code'),
  priorityCode: integer('priority_code'),
  assignedTo: uuid('assigned_to'),
  createdBy: uuid('created_by').notNull(),
  deadline: timestamp('deadline'),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_tasks_project_id').on(table.projectId),
  index('idx_tasks_status_code').on(table.statusCode),
  index('idx_tasks_assigned_to').on(table.assignedTo),
  index('idx_tasks_created_by').on(table.createdBy),
  index('idx_tasks_deadline').on(table.deadline),
]);

// Task comments table
export const taskComments = pgTable('task_comments', {
  id: uuid().primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_task_comments_task_id').on(table.taskId),
  index('idx_task_comments_user_id').on(table.userId),
]);

// Attachments table (for both task images and comment files)
export const attachments = pgTable('attachments', {
  id: uuid().primaryKey().defaultRandom(),
  taskId: uuid('task_id'), // Nullable - if attached to task directly
  commentId: uuid('comment_id'), // Nullable - if attached to comment
  fileName: varchar('file_name', { length: 500 }).notNull(),
  fileUrl: text('file_url').notNull(), // Cloudflare R2 URL
  fileSize: integer('file_size'), // In bytes
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
}, (table) => [
  index('idx_attachments_task_id').on(table.taskId),
  index('idx_attachments_comment_id').on(table.commentId),
  index('idx_attachments_uploaded_by').on(table.uploadedBy),
]);
```

**Schema Design Notes:**

1. **Flexible Attachment Model:**
   - `taskId` and `commentId` are both nullable
   - If `taskId` is set and `commentId` is null → Task-level attachment (images shown in task detail)
   - If `commentId` is set → Comment attachment (files attached to comments)
   - Both fields indexed for efficient querying

2. **File Storage Strategy (Cloudflare R2):**
   - Store file metadata in PostgreSQL (attachments table)
   - Store actual file content in Cloudflare R2
   - Use signed URLs for secure upload and download
   - fileUrl stores the R2 object key (e.g., `tasks/{taskId}/files/{uuid}-{filename}`)

3. **Access Control:**
   - Attachments inherit task permissions (if user can view task, can view attachments)
   - Track uploadedBy for ownership and audit trail

#### 1.3 Add Type Models

**File:** `backend/worker/src/types/models.ts`

Add:
```typescript
export type Task = InferSelectModel<typeof tasks>;
export type TaskInsert = InferInsertModel<typeof tasks>;
export type TaskComment = InferSelectModel<typeof taskComments>;
export type TaskCommentInsert = InferInsertModel<typeof taskComments>;
export type Attachment = InferSelectModel<typeof attachments>;
export type AttachmentInsert = InferInsertModel<typeof attachments>;

export type TaskWithDetails = Task & {
  assignee?: User;
  creator?: User;
  project?: Project;
  attachments?: Attachment[]; // Task-level attachments
};

export type TaskCommentWithUser = TaskComment & {
  user: User;
  attachments?: Attachment[]; // Comment attachments
};

export type TaskWithComments = Task & {
  comments: TaskCommentWithUser[];
  assignee?: User;
  creator?: User;
  attachments?: Attachment[]; // Task-level attachments
};
```

#### 1.4 Generate and Apply Migration

```bash
cd backend/worker
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
# Update db/latest_schema.sql
```

**Deliverables:**
- [ ] TaskStatus, TaskType, TaskPriority code definitions
- [ ] tasks, taskComments, and attachments schema
- [ ] Task, TaskComment, and Attachment type models
- [ ] Migration files generated and applied
- [ ] Database includes support for file attachments

---

### Phase 2: Backend Service Layer

**Goal:** Implement all task business logic in services

#### 2.1 Create Base Task Service

**File:** `backend/worker/src/services/tasks/BaseTaskService.ts`

Extend BaseService with:
- `validateTaskStatusCode(code)` - Validate status code 1-5
- `validateTaskTypeCode(code)` - Validate task type
- `validateTaskPriorityCode(code)` - Validate priority
- `validateDeadline(date)` - Ensure future dates
- `canUserAccessTask(userId, taskId)` - Check project membership
- `canUserEditTask(userId, taskId)` - Check role and ownership
- `getCurrentTimestamp()` (inherited)

Reference: `backend/worker/src/services/projects/BaseProjectService.ts`

#### 2.2 Create Task Query Service

**File:** `backend/worker/src/services/tasks/TaskQueryService.ts`

Methods:
- `listTasks(projectId, options)` - List with filtering
  - Options: statusCode, assignedTo, deadline range, pagination
  - Return: `{ tasks: TaskWithDetails[], pagination }`
- `getTaskById(taskId)` - Get single task with details
  - Return: `TaskWithComments` (includes comments, assignee, creator)
- `getTasksForCalendar(projectIds, dateRange)` - Calendar view data
  - Group tasks by deadline date
  - Return: `{ date: string, tasks: Task[] }[]`

**Permission Checks:**
- Verify user has project access via projectMembers table
- System Admins bypass checks

Reference: `backend/worker/src/services/projects/ProjectQueryService.ts`

#### 2.3 Create Task Command Service

**File:** `backend/worker/src/services/tasks/TaskCommandService.ts`

Methods:
- `createTask(data: CreateTaskInput)` - Create new task
  - Input: `{ projectId, title, description, statusCode?, typeCode?, priorityCode?, assignedTo?, deadline? }`
  - Validate: title required, valid codes, assignee exists and has project access
  - Set createdBy from authenticated user
  - Return: `ServiceResponse<Task>`
- `updateTask(taskId, data: UpdateTaskInput)` - Update task
  - Input: Partial task fields
  - Validate: codes, deadline, assignee access
  - Update updatedAt timestamp
  - Return: `ServiceResponse<Task>`
- `updateTaskStatus(taskId, statusCode)` - Status update (for drag-drop)
  - Validate status code
  - Return: `ServiceResponse<Task>`
- `deleteTask(taskId)` - Delete task
  - Return: `ServiceResponse<void>`
- `duplicateTask(taskId)` - Duplicate task (US-14b)
  - Copy: title, description, statusCode, typeCode, priorityCode, deadline
  - Exclude: id, comments, attachments, assignedTo
  - Append " (Copy)" to title
  - Return: `ServiceResponse<Task>`

**Permission Checks:**
- Create: Project Manager or above (Genba can create Hold status only)
- Update: Project Manager or above (Genba can edit own tasks only)
- Delete: Project Manager or above
- UpdateStatus: Same as Update

Reference: `backend/worker/src/services/projects/ProjectCommandService.ts`

#### 2.4 Create Task Comment Service

**File:** `backend/worker/src/services/tasks/TaskCommentService.ts`

Methods:
- `listComments(taskId)` - Get all comments for task
  - Join with users table for creator info
  - Order by createdAt ASC
  - Return: `ServiceResponse<TaskComment[]>`
- `addComment(taskId, userId, content)` - Add comment
  - Validate: content not empty, task exists, user has project access
  - Return: `ServiceResponse<TaskComment>`
- `updateComment(commentId, content)` - Update comment
  - Validate: user is comment owner
  - Return: `ServiceResponse<TaskComment>`
- `deleteComment(commentId)` - Delete comment
  - Validate: user is comment owner or Project Manager+
  - Return: `ServiceResponse<void>`

#### 2.5 Extend Authorization Service

**File:** `backend/worker/src/services/auth/AuthorizationService.ts`

Add methods:
- `canCreateTask(user, projectId, statusCode?)`
  - PM+ can create any status
  - Genba can create Hold status only
  - Geino cannot create tasks
- `canEditTask(user, task)`
  - PM+ can edit any task in their projects
  - Genba can edit own tasks only
  - Geino cannot edit tasks
- `canViewTask(user, projectId)`
  - Any project member can view tasks
  - System Admin can view all tasks

#### 2.6 Create File Upload Service

**File:** `backend/worker/src/services/uploads/FileUploadService.ts`

Methods:
- `generateUploadUrl(userId, data: { fileName, fileSize, mimeType, taskId?, commentId? })`
  - Validate user has task access
  - Validate file size (max 10MB) and mime type (images, PDFs, docs)
  - Generate unique file key: `tasks/{taskId}/{type}/{uuid}-{fileName}`
  - Generate R2 signed upload URL (PUT, 5-min expiration)
  - Store pending upload record (optional: for tracking)
  - Return: `{ uploadId, uploadUrl, fileKey }`

- `confirmUpload(uploadId, fileKey)`
  - Verify upload completed to R2
  - Create attachment record in database
  - Return: `ServiceResponse<Attachment>`

- `generateDownloadUrl(userId, attachmentId)`
  - Fetch attachment from DB
  - Verify user has access to task
  - Generate R2 signed download URL (GET, 1-hour expiration)
  - Return: `ServiceResponse<{ downloadUrl }>`

- `deleteAttachment(userId, attachmentId)`
  - Verify user owns attachment or is PM+
  - Delete from R2
  - Delete from database
  - Return: `ServiceResponse<void>`

**R2 Helper Methods:**
```typescript
// Helper: Generate signed URL for R2
async generateR2SignedUrl(
  bucket: R2Bucket,
  key: string,
  method: 'PUT' | 'GET',
  expiresIn: number
): Promise<string>

// Helper: Validate file type
validateFileType(mimeType: string): boolean {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return allowed.includes(mimeType);
}
```

**Deliverables:**
- [ ] BaseTaskService with validation helpers
- [ ] TaskQueryService with list, get, calendar methods
- [ ] TaskCommandService with CRUD and duplicate
- [ ] TaskCommentService with comment operations
- [ ] Extended AuthorizationService for task permissions
- [ ] FileUploadService with R2 signed URL generation

---

### Phase 3: Backend Handlers & Routes

**Goal:** Create thin handlers and route definitions

#### 3.1 Create Task Handlers

**Directory:** `backend/worker/src/handlers/tasks/`

Create these handlers (thin, delegate to services):

1. **listTasksHandler.ts** - GET `/projects/:projectId/tasks`
   - Parse query params: page, limit, statusCode, assignedTo, fromDate, toDate
   - Check project access
   - Call TaskQueryService.listTasks()
   - Return paginated tasks

2. **getTaskHandler.ts** - GET `/tasks/:taskId`
   - Check task access
   - Call TaskQueryService.getTaskById()
   - Return task with comments

3. **createTaskHandler.ts** - POST `/projects/:projectId/tasks`
   - Parse body: title, description, statusCode, typeCode, priorityCode, assignedTo, deadline
   - Check canCreateTask permission
   - Call TaskCommandService.createTask()
   - Return created task

4. **updateTaskHandler.ts** - PATCH `/tasks/:taskId`
   - Parse body: partial task fields
   - Check canEditTask permission
   - Call TaskCommandService.updateTask()
   - Return updated task

5. **updateTaskStatusHandler.ts** - PATCH `/tasks/:taskId/status`
   - Parse body: statusCode
   - Check canEditTask permission
   - Call TaskCommandService.updateTaskStatus()
   - Return updated task

6. **deleteTaskHandler.ts** - DELETE `/tasks/:taskId`
   - Check canEditTask permission (PM+ only)
   - Call TaskCommandService.deleteTask()
   - Return success

7. **duplicateTaskHandler.ts** - POST `/tasks/:taskId/duplicate`
   - Check canCreateTask permission
   - Call TaskCommandService.duplicateTask()
   - Return duplicated task

8. **listCommentsHandler.ts** - GET `/tasks/:taskId/comments`
   - Check task access
   - Call TaskCommentService.listComments()
   - Return comments

9. **addCommentHandler.ts** - POST `/tasks/:taskId/comments`
   - Parse body: content
   - Check task access
   - Call TaskCommentService.addComment()
   - Return created comment

10. **updateCommentHandler.ts** - PATCH `/comments/:commentId`
    - Parse body: content
    - Call TaskCommentService.updateComment()
    - Return updated comment

11. **deleteCommentHandler.ts** - DELETE `/comments/:commentId`
    - Call TaskCommentService.deleteComment()
    - Return success

12. **getCalendarTasksHandler.ts** - GET `/calendar/tasks`
    - Parse query params: projectIds[], fromDate, toDate
    - Check project access for each projectId
    - Call TaskQueryService.getTasksForCalendar()
    - Return grouped tasks by date

13. **generateUploadUrlHandler.ts** - POST `/uploads/generate-upload-url`
    - Parse body: fileName, fileSize, mimeType, taskId?, commentId?
    - Validate user has task access
    - Call FileUploadService.generateUploadUrl()
    - Return upload URL and metadata

14. **confirmUploadHandler.ts** - POST `/uploads/confirm`
    - Parse body: uploadId, fileKey
    - Call FileUploadService.confirmUpload()
    - Return created attachment

15. **getDownloadUrlHandler.ts** - GET `/uploads/:attachmentId/download-url`
    - Call FileUploadService.generateDownloadUrl()
    - Return signed download URL

16. **deleteAttachmentHandler.ts** - DELETE `/uploads/:attachmentId`
    - Call FileUploadService.deleteAttachment()
    - Return success

Reference: `backend/worker/src/handlers/projects/` for handler patterns

#### 3.2 Create Task Routes

**File:** `backend/worker/src/routes/tasks.ts`

Define routes:
```typescript
import { Hono } from 'hono';
import { authenticateMiddleware } from '../middleware/auth';
import { listTasksHandler } from '../handlers/tasks/listTasksHandler';
// ... import other handlers

const tasks = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
tasks.use('*', authenticateMiddleware);

// Project-scoped task operations
tasks.get('/projects/:projectId/tasks', listTasksHandler);
tasks.post('/projects/:projectId/tasks', createTaskHandler);

// Task operations
tasks.get('/tasks/:taskId', getTaskHandler);
tasks.patch('/tasks/:taskId', updateTaskHandler);
tasks.patch('/tasks/:taskId/status', updateTaskStatusHandler);
tasks.delete('/tasks/:taskId', deleteTaskHandler);
tasks.post('/tasks/:taskId/duplicate', duplicateTaskHandler);

// Comment operations
tasks.get('/tasks/:taskId/comments', listCommentsHandler);
tasks.post('/tasks/:taskId/comments', addCommentHandler);
tasks.patch('/comments/:commentId', updateCommentHandler);
tasks.delete('/comments/:commentId', deleteCommentHandler);

// Calendar view
tasks.get('/calendar/tasks', getCalendarTasksHandler);

// File uploads
tasks.post('/uploads/generate-upload-url', generateUploadUrlHandler);
tasks.post('/uploads/confirm', confirmUploadHandler);
tasks.get('/uploads/:attachmentId/download-url', getDownloadUrlHandler);
tasks.delete('/uploads/:attachmentId', deleteAttachmentHandler);

export default tasks;
```

#### 3.3 Register Routes in Main App

**File:** `backend/worker/src/index.ts`

Add:
```typescript
import tasks from './routes/tasks';

app.route('/api', tasks);
```

**Deliverables:**
- [ ] 16 thin handler files (12 task + 4 upload)
- [ ] tasks route file with all endpoints including uploads
- [ ] Routes registered in index.ts
- [ ] R2 bucket configured in Cloudflare Workers env

---

### Phase 4: Frontend Type Definitions

**Goal:** Define TypeScript contracts for frontend

#### 4.1 Add Entity Types

**File:** `frontend/web-app/client/src/types/entities.ts`

Add:
```typescript
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  statusCode: number;
  typeCode?: number;
  priorityCode?: number;
  assignedTo?: string;
  createdBy: string;
  deadline?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithDetails extends Task {
  assignee?: User;
  creator?: User;
  project?: Project;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  attachments?: Attachment[]; // Comment attachments
}

export interface Attachment {
  id: string;
  taskId?: string;
  commentId?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TaskWithComments extends Task {
  comments: TaskComment[];
  assignee?: User;
  creator?: User;
  attachments?: Attachment[]; // Task-level attachments
}

// Code type interfaces
export interface CodeType {
  code: number;
  label: string;
  key: string;
}

export const TaskStatusCodes = {
  HOLD: 1,
  TODO: 2,
  IN_PROGRESS: 3,
  DONE: 4,
  WAITING: 5
} as const;

export const TaskStatus: Record<string, CodeType> = {
  HOLD: { code: 1, label: 'Hold', key: 'hold' },
  TODO: { code: 2, label: 'To Do', key: 'todo' },
  IN_PROGRESS: { code: 3, label: 'In Progress', key: 'in_progress' },
  DONE: { code: 4, label: 'Done', key: 'done' },
  WAITING: { code: 5, label: 'Waiting', key: 'waiting' }
};
```

#### 4.2 Add API Request/Response Types

**File:** `frontend/web-app/client/src/types/api.ts`

Add:
```typescript
export interface ListTasksParams {
  page?: number;
  limit?: number;
  statusCode?: number;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ListTasksResponse {
  tasks: TaskWithDetails[];
  pagination: PaginationInfo;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  statusCode?: number;
  typeCode?: number;
  priorityCode?: number;
  assignedTo?: string;
  deadline?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  statusCode?: number;
  typeCode?: number;
  priorityCode?: number;
  assignedTo?: string;
  deadline?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CalendarTasksParams {
  projectIds: string[];
  fromDate: string;
  toDate: string;
}

export interface CalendarTasksResponse {
  date: string;
  tasks: TaskWithDetails[];
}

export interface GenerateUploadUrlRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  taskId?: string;
  commentId?: string;
}

export interface GenerateUploadUrlResponse {
  uploadId: string;
  uploadUrl: string;
  fileKey: string;
}

export interface ConfirmUploadRequest {
  uploadId: string;
  fileKey: string;
}

export interface GetDownloadUrlResponse {
  downloadUrl: string;
}
```

**Deliverables:**
- [ ] Task entity types including Attachment in entities.ts
- [ ] Task and Upload API types in api.ts
- [ ] Code type constants exported

---

### Phase 5: Frontend API Client

**Goal:** Create API communication layer

#### 5.1 Create Task API Client

**File:** `frontend/web-app/client/src/api/tasks.ts`

Implement:
```typescript
import apiClient from './client';
import type {
  ListTasksParams, ListTasksResponse,
  CreateTaskRequest, UpdateTaskRequest,
  TaskWithComments, Task,
  CreateCommentRequest, TaskComment,
  CalendarTasksParams, CalendarTasksResponse
} from '@/types/api';

export const tasksApi = {
  // Task CRUD
  list: async (projectId: string, params?: ListTasksParams): Promise<ListTasksResponse> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  },

  get: async (taskId: string): Promise<TaskWithComments> => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },

  create: async (projectId: string, data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  update: async (taskId: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  updateStatus: async (taskId: string, statusCode: number): Promise<Task> => {
    const response = await apiClient.patch(`/tasks/${taskId}/status`, { statusCode });
    return response.data;
  },

  delete: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  duplicate: async (taskId: string): Promise<Task> => {
    const response = await apiClient.post(`/tasks/${taskId}/duplicate`);
    return response.data;
  },

  // Comment operations
  listComments: async (taskId: string): Promise<TaskComment[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  addComment: async (taskId: string, data: CreateCommentRequest): Promise<TaskComment> => {
    const response = await apiClient.post(`/tasks/${taskId}/comments`, data);
    return response.data;
  },

  updateComment: async (commentId: string, content: string): Promise<TaskComment> => {
    const response = await apiClient.patch(`/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },

  // Calendar view
  getCalendarTasks: async (params: CalendarTasksParams): Promise<CalendarTasksResponse[]> => {
    const response = await apiClient.get('/calendar/tasks', { params });
    return response.data;
  }
};

export const uploadsApi = {
  // Generate upload URL
  generateUploadUrl: async (data: GenerateUploadUrlRequest): Promise<GenerateUploadUrlResponse> => {
    const response = await apiClient.post('/uploads/generate-upload-url', data);
    return response.data;
  },

  // Upload file to R2 using signed URL
  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  // Confirm upload completion
  confirmUpload: async (data: ConfirmUploadRequest): Promise<Attachment> => {
    const response = await apiClient.post('/uploads/confirm', data);
    return response.data;
  },

  // Get download URL for attachment
  getDownloadUrl: async (attachmentId: string): Promise<string> => {
    const response = await apiClient.get(`/uploads/${attachmentId}/download-url`);
    return response.data.downloadUrl;
  },

  // Delete attachment
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await apiClient.delete(`/uploads/${attachmentId}`);
  },

  // Helper: Complete upload flow
  uploadAndConfirm: async (
    file: File,
    taskId?: string,
    commentId?: string
  ): Promise<Attachment> => {
    // 1. Generate upload URL
    const { uploadId, uploadUrl, fileKey } = await uploadsApi.generateUploadUrl({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      taskId,
      commentId,
    });

    // 2. Upload file to R2
    await uploadsApi.uploadFile(uploadUrl, file);

    // 3. Confirm upload
    return await uploadsApi.confirmUpload({ uploadId, fileKey });
  },
};
```

#### 5.2 Export from API Index

**File:** `frontend/web-app/client/src/api/index.ts`

Add:
```typescript
export * from './tasks';
export * from './uploads';
```

**Deliverables:**
- [ ] tasksApi client with all task methods
- [ ] uploadsApi client with upload/download methods
- [ ] Exported from api/index.ts

---

### Phase 6: Frontend Component Refactoring

**Goal:** Decompose large components and add API integration

#### 6.1 Extract Reusable Task Components

**Create directory:** `frontend/web-app/client/src/components/tasks/`

**6.1.1 TaskCard Component**

**File:** `components/tasks/TaskCard.tsx`

Extract from TaskBoard.tsx (lines ~200-300):
- Display task title, description, type badge
- Show assignee avatars
- Display deadline with color coding
- Click handler to open detail modal
- Drag handle integration

Props: `{ task: TaskWithDetails, onClick: () => void }`

**6.1.2 Column Component**

**File:** `components/tasks/Column.tsx`

Extract from TaskBoard.tsx:
- Column header with status label and count
- Droppable area using useSortable
- Render TaskCard list
- Handle empty state

Props: `{ status: string, tasks: TaskWithDetails[], onTaskClick: (task) => void }`

**6.1.3 TaskCreateDialog Component**

**File:** `components/tasks/TaskCreateDialog.tsx`

Extract from TaskBoard.tsx (lines ~400-600):
- Form with title, description, type, assignee, deadline fields
- Validation logic
- Submit handler calling tasksApi.create()
- Error handling with toast

Props: `{ open: boolean, onClose: () => void, projectId: string, onTaskCreated: (task) => void }`

**6.1.4 TaskDetailDialog Component**

**File:** `components/tasks/TaskDetailDialog.tsx`

Extract from TaskBoard.tsx (lines ~600-700):
- Task metadata display
- Status selector (editable for PM+)
- Edit mode toggle
- Comment section integration
- Delete and duplicate buttons

Props: `{ task: TaskWithComments | null, open: boolean, onClose: () => void, onTaskUpdated: () => void }`

**6.1.5 TaskCommentSection Component**

**File:** `components/tasks/TaskCommentSection.tsx`

New component:
- List comments with user avatars and attachments
- Comment input field
- File upload button integrated with uploadsApi
- Submit handler calling tasksApi.addComment()
- Edit/delete for own comments
- Download attachment handler using uploadsApi.getDownloadUrl()

Props: `{ taskId: string, comments: TaskComment[], onCommentAdded: () => void }`

**6.1.6 FileUpload Component**

**File:** `components/tasks/FileUpload.tsx`

Reusable file upload component:
- File input with drag-and-drop support
- Progress indicator during upload
- File type and size validation
- Uses uploadsApi.uploadAndConfirm()
- Error handling with toast notifications

Props: `{ taskId?: string, commentId?: string, onUploadComplete: (attachment: Attachment) => void }`

**Usage example:**
```tsx
const [attachments, setAttachments] = useState<Attachment[]>([]);

<FileUpload
  taskId={task.id}
  onUploadComplete={(attachment) => {
    setAttachments([...attachments, attachment]);
    toast.success('File uploaded successfully!');
  }}
/>
```

**6.1.7 Component Index**

**File:** `components/tasks/index.ts`

Export all components.

#### 6.2 Refactor TaskBoard Page

**File:** `frontend/web-app/client/src/pages/TaskBoard.tsx`

Refactor to:
1. Remove mock data imports
2. Add state: `const [tasks, setTasks] = useState<TaskWithDetails[]>([])`
3. Add loading/error states
4. Fetch tasks on mount via tasksApi.list()
5. Import and use extracted components
6. Implement drag-drop handler calling tasksApi.updateStatus()
7. Add permission checks using usePermissions()
8. Add project selector if user has multiple projects
9. Add filters: status, assignee, search

Target: Reduce from 700+ lines to ~200 lines

#### 6.3 Update CalendarView Page

**File:** `frontend/web-app/client/src/pages/CalendarView.tsx`

Update to:
1. Remove MOCK_CALENDAR_TASKS
2. Fetch tasks via tasksApi.getCalendarTasks()
3. Pass selected project IDs from AuthContext
4. Keep existing UI structure
5. Add click handler to open TaskDetailDialog

**Deliverables:**
- [ ] 6 extracted task components (including FileUpload)
- [ ] Refactored TaskBoard with API integration
- [ ] Updated CalendarView with API integration
- [ ] File upload integrated in Task Create and Comment sections
- [ ] All components under 150 lines

---

### Phase 7: Permission-Based UI Controls

**Goal:** Show/hide UI elements based on user role

#### 7.1 Extend usePermissions Hook

**File:** `frontend/web-app/client/src/hooks/usePermissions.ts`

Add methods:
```typescript
canCreateTask: (projectId: string, statusCode?: number) => boolean;
canEditTask: (task: Task) => boolean;
canDeleteTask: (projectId: string) => boolean;
canViewTasks: (projectId: string) => boolean;
```

Logic:
- Check user's project role from AuthContext.projects array
- Apply same rules as backend AuthorizationService

#### 7.2 Apply Permission Checks in Components

**TaskBoard.tsx:**
- Show/hide "Create Task" button based on canCreateTask()
- Show/hide "Hold" status column for Genba users
- Filter status options in TaskCreateDialog

**TaskDetailDialog.tsx:**
- Show/hide Edit button based on canEditTask()
- Show/hide Delete button based on canDeleteTask()
- Show/hide status selector based on canEditTask()

**TaskCommentSection.tsx:**
- Show/hide edit/delete buttons on own comments

**Deliverables:**
- [ ] Extended usePermissions hook
- [ ] Permission checks applied in all components

---

### Phase 8: User Story Validation

**Goal:** Ensure all acceptance criteria are met

#### US-12: Create Task (PM+)
- [x] Task creation form with title, description, assignee, deadline
- [x] Assignee dropdown shows project members
- [x] Task appears in appropriate status column
- [x] Email notification queued (deferred)
- [x] Only PM+ can create tasks (Genba can create Hold status)

#### US-13: Update Task Status (PM+)
- [x] Drag-and-drop between columns updates statusCode
- [x] Backend validates status transitions
- [x] Optimistic UI updates with rollback on error
- [x] Email notification queued (deferred)

#### US-14: Edit Task (PM+)
- [x] Task detail modal allows editing all fields
- [x] Assignee dropdown updates
- [x] Deadline picker works
- [x] Changes saved to backend

#### US-14b: Duplicate Task (PM+) [Low Priority - Phase 2]
- [x] Duplicate button in task detail modal
- [x] New task created with copied values
- [x] Images and comments excluded
- [x] Appends " (Copy)" to title

#### US-15: View Tasks (Geino/Genba Users)
- [x] Read-only task board view
- [x] Can view task details
- [x] Cannot edit or create tasks (except Genba can create Hold)

#### US-15b: Genba User Special Access
- [x] Can create Hold status tasks
- [x] Can edit own tasks
- [x] Cannot edit other users' tasks

#### US-16: Calendar View (All Users)
- [x] Month/week view toggle
- [x] Tasks displayed on deadline dates
- [x] Click date to see tasks for that day
- [x] Click task to open detail modal
- [x] Filter by project (if multiple assigned)

**Deliverables:**
- [ ] All user stories validated
- [ ] Manual testing completed
- [ ] Edge cases handled

---

## Critical Files to Modify/Create

### Backend Files

**New Files (30):**
1. `backend/worker/src/services/tasks/BaseTaskService.ts`
2. `backend/worker/src/services/tasks/TaskQueryService.ts`
3. `backend/worker/src/services/tasks/TaskCommandService.ts`
4. `backend/worker/src/services/tasks/TaskCommentService.ts`
5. `backend/worker/src/services/uploads/FileUploadService.ts`
6. `backend/worker/src/handlers/tasks/listTasksHandler.ts`
7. `backend/worker/src/handlers/tasks/getTaskHandler.ts`
8. `backend/worker/src/handlers/tasks/createTaskHandler.ts`
9. `backend/worker/src/handlers/tasks/updateTaskHandler.ts`
10. `backend/worker/src/handlers/tasks/updateTaskStatusHandler.ts`
11. `backend/worker/src/handlers/tasks/deleteTaskHandler.ts`
12. `backend/worker/src/handlers/tasks/duplicateTaskHandler.ts`
13. `backend/worker/src/handlers/tasks/listCommentsHandler.ts`
14. `backend/worker/src/handlers/tasks/addCommentHandler.ts`
15. `backend/worker/src/handlers/tasks/updateCommentHandler.ts`
16. `backend/worker/src/handlers/tasks/deleteCommentHandler.ts`
17. `backend/worker/src/handlers/tasks/getCalendarTasksHandler.ts`
18. `backend/worker/src/handlers/uploads/generateUploadUrlHandler.ts`
19. `backend/worker/src/handlers/uploads/confirmUploadHandler.ts`
20. `backend/worker/src/handlers/uploads/getDownloadUrlHandler.ts`
21. `backend/worker/src/handlers/uploads/deleteAttachmentHandler.ts`
22. `backend/worker/src/routes/tasks.ts`
23. Migration file (auto-generated)

**Modified Files (5):**
1. `backend/worker/src/db/schema.ts` - Add tasks, taskComments, attachments tables
2. `backend/worker/src/types/codeTypes.ts` - Add TaskStatus, TaskType, TaskPriority
3. `backend/worker/src/types/models.ts` - Add Task, Attachment types
4. `backend/worker/src/services/auth/AuthorizationService.ts` - Add task permissions
5. `backend/worker/src/index.ts` - Register task routes
6. `backend/worker/wrangler.toml` - Add R2 bucket binding

### Frontend Files

**New Files (9):**
1. `frontend/web-app/client/src/api/tasks.ts`
2. `frontend/web-app/client/src/api/uploads.ts`
3. `frontend/web-app/client/src/components/tasks/TaskCard.tsx`
4. `frontend/web-app/client/src/components/tasks/Column.tsx`
5. `frontend/web-app/client/src/components/tasks/TaskCreateDialog.tsx`
6. `frontend/web-app/client/src/components/tasks/TaskDetailDialog.tsx`
7. `frontend/web-app/client/src/components/tasks/TaskCommentSection.tsx`
8. `frontend/web-app/client/src/components/tasks/FileUpload.tsx`
9. `frontend/web-app/client/src/components/tasks/index.ts`

**Modified Files (5):**
1. `frontend/web-app/client/src/types/entities.ts` - Add Task and Attachment types
2. `frontend/web-app/client/src/types/api.ts` - Add Task and Upload API types
3. `frontend/web-app/client/src/hooks/usePermissions.ts` - Add task permissions
4. `frontend/web-app/client/src/pages/TaskBoard.tsx` - Refactor with API integration
5. `frontend/web-app/client/src/pages/CalendarView.tsx` - Add API integration

---

## Implementation Order Summary

1. **Phase 1:** Database schema + types (Foundation)
2. **Phase 2:** Backend services (Business logic)
3. **Phase 3:** Backend handlers + routes (API layer)
4. **Phase 4:** Frontend types (Contracts)
5. **Phase 5:** Frontend API client (Communication)
6. **Phase 6:** Frontend components (UI integration)
7. **Phase 7:** Permission controls (Access control)
8. **Phase 8:** User story validation (Testing)

---

## Deferred Items

- **Email Notifications:** Task assignment and status change notifications will be implemented later using Cloudflare Queues (per user request)
- **Advanced Filtering:** Search by title/description, multiple filters (Phase 2)
- **Task Dependencies:** Parent/child task relationships (Future)
- **Time Tracking:** Log hours on tasks (Future)
- **Virus Scanning:** File attachment virus scanning (Phase 2)
- **Image Thumbnails:** Generate thumbnails for image attachments (Phase 2)

---

## Estimated Effort

- Phase 1 (Schema + Attachments): 3 hours
- Phase 2 (Services + Upload Service): 8 hours
- Phase 3 (Handlers/Routes + Upload Handlers): 5 hours
- Phase 4 (Frontend Types + Attachments): 1.5 hours
- Phase 5 (API Client + Upload API): 3 hours
- Phase 6 (Components + FileUpload): 7 hours
- Phase 7 (Permissions): 2 hours
- Phase 8 (Validation + File Upload Testing): 3 hours

**Total: ~32.5 hours**

**Additional Setup:**
- Cloudflare R2 bucket configuration: 1 hour
- Testing upload/download flows: 2 hours

**Grand Total: ~35.5 hours**

---

## Notes

- All backend services follow the established thin handler + service layer pattern
- No foreign key constraints per architecture guidelines
- Numeric status codes for performance
- httpOnly cookies for authentication
- All API calls use apiClient with auto token refresh
- Components follow max 150-line guideline
- Permission checks on both backend and frontend
- Optimistic UI updates for drag-and-drop

### File Attachment Implementation Notes

**Schema Design:**
- Single `attachments` table with nullable `taskId` and `commentId` columns
- Flexible design supports both task-level attachments (images) and comment-level attachments (files)
- No foreign key constraints (per architecture guidelines)
- Indexed on taskId, commentId, and uploadedBy for query performance

**Upload Flow:**
1. Frontend requests signed upload URL from backend
2. Backend validates user access and file metadata
3. Backend generates R2 signed URL (5-minute expiration)
4. Frontend uploads directly to R2 using signed URL
5. Frontend confirms upload completion
6. Backend creates attachment record in database

**Download Flow:**
1. Frontend requests download URL for attachment
2. Backend validates user has task access
3. Backend generates R2 signed download URL (1-hour expiration)
4. Frontend opens/downloads file from R2

**Security:**
- Task access validation before generating upload/download URLs
- Signed URLs with expiration
- File size limits (10MB)
- MIME type validation (images, PDFs, documents)

**R2 Bucket Structure:**
```
/tasks/{taskId}/images/{uuid}-{filename}      (Task images)
/tasks/{taskId}/comments/{uuid}-{filename}    (Comment attachments)
```

**Frontend Integration:**
- Reusable `FileUpload` component with drag-and-drop support
- Progress indicators during upload
- Error handling with toast notifications
- Download handler using signed URLs
- Used in both Task Create dialog and Comment section
