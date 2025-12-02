<!-- filepath: /Users/abinash/Desktop/my-apps/geino-saas/frontend/web-app/docs/spec.md -->
## 1. Overview

**App Name:** Geino SaaS

**Goal:** A lightweight project & task management platform for teams to plan work, track progress, and collaborate. The platform supports multiple organizations with role-based access control. The current frontend is static/mock-driven for demonstration; the plan is to add a Cloudflare Workers backend and a Postgres datastore (accessed via Drizzle ORM) to provide persistence, auth, notifications, and file storage.

**Primary Users:**
- **System Admin** - Full system access, creates organizations and assigns Organization Managers
- **Organization Manager** - Manages their organization's projects, creates projects and assigns Project Managers
- **Project Manager** - Read/write access to assigned projects, can create tasks, edit tasks and change statuses
- **Geino User** - Read-only access to assigned projects, can create comments
- **Genba User** - Read-only access to assigned projects, can create tasks with "hold" status, can edit own tasks (low priority), can create comments

**Core Modules:**
- **Authentication** (Registration, Login, Password Reset)
- **User Management** (User profiles, role assignments)
- **Organizations** (Organization CRUD, member management)
- **Projects** (Project CRUD, member assignments, schedule)
- **Tasks** (Task CRUD, drag & drop board, status management, comments, attachments)
- **Calendar** (View tasks by date, month/week)
- **Notifications** (In-app notifications list)
- **Access Control** (Role-based permissions)
- **UI / Theme** (Dashboard layout, sidebar, dialogs)

**Tech Stack:**
- **Frontend:** React 18 + Vite, TypeScript, Tailwind CSS, Radix UI components, @dnd-kit for drag/drop
- **Backend:** Cloudflare Workers (JS/TS) serving APIs
- **Auth:** Backend-only auth using Supabase Auth (via service role key), httpOnly cookies for session management
- **DB:** Supabase PostgreSQL with Drizzle ORM for typed schemas and queries
- **Storage:** Cloudflare R2 for file attachments
- **Queue System:** Cloudflare Queues for async notification delivery (in-app + email)
- **Email:** Supabase Auth emails (verification, password reset) + SMTP provider for app notifications
- **Infra:** pnpm, Vite build, deployment to Cloudflare Workers

**Access Control Matrix:**

| Role | Organizations | Projects (Own Org) | Tasks (Own Org) | Comments | Any Org/Project |
|------|---------------|-------------------|----------------|----------|----------------|
| System Admin | Full Access | Full Access | Full Access | Full Access | ✅ Yes |
| Organization Manager | Own Org Only | Full Access | Full Access | Full Access | ❌ No |
| Project Manager | Read Only | Assigned Projects (R/W) | Assigned Projects (R/W) | Full Access | ❌ No |
| Geino User | Read Only | Assigned Projects (Read) | Assigned Projects (Read) | Create/Read | ❌ No |
| Genba User | Read Only | Assigned Projects (Read) | Create Hold Tasks, Edit Own Tasks | Create/Read | ❌ No |

**Notes from codebase:**
- The app currently uses mock data in `shared/const.ts` (MOCK_TASKS, MOCK_PROJECTS, MOCK_CALENDAR_TASKS).
- Routing is client-side via `wouter` in `client/src/App.tsx`.
- `server/index.ts` is a small Express static server used to serve `dist/public` in production; this will be replaced when moving to Cloudflare Workers.

---

## 2. Feature Map

List all user stories organized by role and feature area.

### Authentication & User Management
| ID | User Story |
|----|------------|
| US-01 | As an unregistered user, I can register for an account and receive a verification email so I can access the platform. |
| US-02 | As a registered user, I can log in with my credentials so I can access my dashboard. |
| US-03 | As a logged-in user, I can reset my password via email and receive a reset link so I can regain access to my account. |
| US-04 | As a System Admin, I can view all registered users and their assigned roles. |

### Organizations
| ID | User Story |
|----|------------|
| US-05 | As a System Admin, I can create a new organization and assign Organization Managers to it, and they receive an email notification about their new role. |
| US-06 | As a System Admin, I can view and update any organization in the system. |
| US-07 | As an Organization Manager, I can view and update my organization's details. |

### Projects
| ID | User Story |
|----|------------|
| US-08 | As an Organization Manager or above, I can create a new project with title, description, schedule, and assign Project Managers, Geino Users, and Genba Users who receive email notifications about their assignment. |
| US-09 | As an Organization Manager or above, I can view and edit all projects in my organization. |
| US-10 | As a Project Manager or above, I can view and edit projects I'm assigned to. |
| US-11 | As a Geino User or Genba User, I can view projects I'm assigned to (read-only). |

### Tasks
| ID | User Story |
|----|------------|
| US-12 | As a Project Manager or above, I can create a new task with title, description, assignee and deadline in my assigned projects, and the assignee receives an email notification. |
| US-13 | As a Project Manager or above, I can update a task's status by dragging it between columns on the Task Board, and relevant users receive an email notification about the status change. |
| US-14 | As a Project Manager or above, I can edit task details (title, description, assignee, deadline) in my assigned projects. |
| US-14b | As a Project Manager or above, I can duplicate an existing task to create a new task with prefilled values (excluding images and comments). [Low Priority - Phase 2] |
| US-15 | As a Geino User or Genba User, I can view tasks in projects I'm assigned to (read-only). |
| US-15b | As a Genba User, I can create a new task with "hold" status and edit tasks I created (low priority feature). |
| US-16 | As any user, I can view tasks on a calendar (month/week) for projects I have access to, click on a date to see tasks for that day, and click on a task to open the task detail modal. |

### Comments & Attachments
| ID | User Story |
|----|------------|
| US-17 | As any user (Project Manager, Geino User, Genba User), I can add comments to tasks in projects I have access to, mention other users with @username, and mentioned users receive email notifications. |
| US-18 | As any user, I can upload files/images to my comments. |
| US-19 | As any user, I can view and download attachments from task comments. |

### Notifications
| ID | User Story |
|----|------------|
| US-20 | As a user, when I am assigned a task, assigned a role, mentioned in a comment, or a task status changes, I receive both an in-app notification and an email notification. |
| US-21 | As a user, I can view my notification history and mark notifications as read. |

---

## 3. User Story Details

### User Story ID: US-01
**Feature Name:** User Registration  
**Story:**

As a new user, I can register an account with email, password, firstname, and lastname, and receive a verification email so I can access the system and be assigned roles later.

**Acceptance Criteria (Sequential Flow)**

1. User navigates to `/register` page.
2. Frontend displays registration form with fields: email (required), password (required, min 8 chars), confirm password, firstname (required), lastname (required).
3. User enters values and clicks Register.
4. Frontend validates inputs locally — email format, password strength, passwords match, firstname and lastname present.
5. Frontend calls POST /api/auth/register with { email, password, firstname, lastname }.
6. Backend validates schema and calls Supabase: `supabase.auth.signUp({ email, password, options: { data: { firstname, lastname } } })`.
7. Supabase creates user in `auth.users` table and sends verification email automatically.
8. Backend creates user profile in custom `users` table with id from Supabase, system_role_code = NULL (regular user, no admin access).
9. If users table insert fails, backend rolls back by deleting Supabase auth user via `supabase.auth.admin.deleteUser()`.
10. Backend responds with success message.
11. Frontend redirects to login page with success message: "Registration successful! Please check your email to verify your account."

**Data Model (SQL)**
```sql
-- Users table (application profile data)
-- Note: Authentication data stored in Supabase auth.users (managed by Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY, -- Links to Supabase auth.users.id (no DEFAULT, set from Supabase)
  email VARCHAR(255) UNIQUE NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  system_role_code INT DEFAULT NULL, -- 1: system_admin, NULL: regular user
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_system_role_code ON users(system_role_code);
```

**API Endpoints:**
- `POST /api/auth/register` - Create user account (calls Supabase + creates profile in users table)

---

### User Story ID: US-02
**Feature Name:** User Login  
**Story:**

As a registered user, I can log in with my credentials to access my dashboard based on my assigned role.

**Acceptance Criteria (Sequential Flow)**

1. User navigates to `/login` page.
2. Frontend displays login form with fields: email, password.
3. User enters credentials and clicks Login.
4. Frontend calls POST /api/auth/login with { email, password }.
5. Backend calls Supabase: `supabase.auth.signInWithPassword({ email, password })`.
6. Supabase validates credentials and returns JWT tokens (access_token, refresh_token).
7. Backend fetches user profile from custom users table along with their organization and project memberships.
8. Backend sets httpOnly cookies with access_token (1 hour expiry) and refresh_token (30 days expiry).
9. Backend responds with user profile { id, email, firstname, lastname, system_role_code }, organizations array, and projects array.
10. Frontend stores user profile, organizations, and projects in AuthContext state (not tokens).
11. Frontend redirects user to appropriate dashboard based on system_role_code and memberships:
    - System Admin → `/admin/organizations`
    - Organization Manager → `/organizations/:orgId/projects`
    - Project Manager, Geino User, Genba User → `/projects` (filtered by access)

**Data Model (SQL)**
```sql
-- No sessions table needed (Supabase manages auth.sessions)
```

**API Endpoints:**
- `POST /api/auth/login` - Authenticate user, set httpOnly cookies, return user profile
- `POST /api/auth/logout` - Clear session cookies and revoke Supabase tokens
- `POST /api/auth/refresh` - Refresh access token using refresh_token cookie
- `GET /api/auth/session` - Get current user session from cookie

---

### User Story ID: US-03
**Feature Name:** Password Reset
**Story:**

As a logged-in user, I can reset my password via email and receive a reset link so I can regain access to my account.

**Acceptance Criteria (Sequential Flow)**

1. User navigates to `/forgot-password` page.
2. Frontend displays form with email field.
3. User enters email and clicks "Send Reset Link".
4. Frontend calls POST /api/auth/reset-password with { email }.
5. Backend calls Supabase: `supabase.auth.resetPasswordForEmail({ email, redirectTo: '${APP_URL}/reset-password' })`.
6. Supabase validates email and sends password reset email with secure token automatically.
7. Backend responds with success message (generic to prevent email enumeration).
8. Frontend shows success message: "If an account exists with that email, you will receive a password reset link."
9. User clicks reset link in email and is redirected to `/reset-password?token=XXX`.
10. Frontend displays new password form.
11. User enters new password and clicks Reset.
12. Frontend calls POST /api/auth/update-password with { token, newPassword }.
13. Backend extracts token from request and calls Supabase: `supabase.auth.updateUser({ password: newPassword })`.
14. Supabase validates token, updates password, and sends confirmation email automatically.
15. Backend responds with success message.
16. Frontend redirects to login page with success message: "Password reset successful! Please log in."

**Data Model (SQL)**
```sql
-- No password_reset_tokens table needed (Supabase manages password reset flow)
```

**API Endpoints:**
- `POST /api/auth/reset-password` - Request password reset (backend calls Supabase)
- `POST /api/auth/update-password` - Update password with reset token

---

### User Story ID: US-05
**Feature Name:** Create Organization (System Admin)  
**Story:**

As a System Admin, I can create a new organization and assign Organization Managers to it, and they receive an email notification about their new role so that they can manage their teams and projects.

**Acceptance Criteria (Sequential Flow)**

1. System Admin navigates to `/admin/organizations`.
2. System Admin clicks "Create Organization" button.
3. Frontend opens a modal with form fields: organization name (required), description, and a multi-select for Organization Managers (fetched from users with eligible roles).
4. System Admin enters values and clicks Create.
5. Frontend validates inputs and calls POST /api/organizations with { name, description, managerIds }.
6. Backend verifies requester is System Admin.
7. Backend creates Organization row and creates organization_members rows for each manager with organization_role_code = 1 (organization_manager).
8. Backend emits 'organization.member_assigned' event to Cloudflare Queue for each manager with { userId, organizationId, organizationName, organizationRoleCode }.
9. Backend responds with created organization.
10. Queue consumer worker processes events, creates in-app notifications and sends email notifications to each assigned Organization Manager.
11. Frontend closes modal and refreshes organization list.

**Data Model (SQL)**
```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members (links users to organizations with roles)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_role_code INT NOT NULL, -- 1: organization_manager
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
```

**API Endpoints:**
- `POST /api/organizations` - Create organization (System Admin only)
- `GET /api/organizations` - List all organizations (System Admin) or user's organizations
- `GET /api/organizations/:id` - Get organization details
- `PATCH /api/organizations/:id` - Update organization (System Admin or Org Manager)
- `DELETE /api/organizations/:id` - Delete organization (System Admin only)

---

### User Story ID: US-08
**Feature Name:** Create Project
**Story:**

As an Organization Manager or above, I can create a project with title, description, schedule, and assign Project Managers, Geino Users, and Genba Users who receive email notifications about their assignment so work is organized.

**Acceptance Criteria (Sequential Flow)**

1. User navigates to `/organizations/:orgId/projects`.
2. User clicks "新規プロジェクト作成" button.
3. Frontend opens form with: project name, description, start/end dates, and multi-select for Project Managers, Geino Users, Genba Users.
4. User enters values and clicks Create.
5. Frontend validates inputs and calls POST /api/projects with { organizationId, name, description, startDate, endDate, members: [{ userId, projectRoleCode }] }.
6. Backend verifies requester is Organization Manager or above for the organization.
7. Backend creates Project row and project_members rows for each assigned member.
8. Backend emits 'project.member_assigned' event to Cloudflare Queue for each member with { userId, projectId, projectName, projectRoleCode }.
9. Backend responds with created project.
10. Queue consumer worker processes events, creates in-app notifications and sends email notifications to all assigned members with project details and their role.
11. Frontend closes dialog and refreshes project list.

**Data Model (SQL)**
```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status_code INT DEFAULT 1, -- 1: active, 2: completed, 3: archived
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project members (links users to projects with roles)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_role_code INT NOT NULL, -- 1: project_manager, 2: geino_user, 3: genba_user
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_projects_org_id ON projects(organization_id);
```

**API Endpoints:**
- `POST /api/projects` - Create project (Org Manager or System Admin)
- `GET /api/projects` - List projects (filtered by user access)
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project (Project Manager, Org Manager, or System Admin)
- `DELETE /api/projects/:id` - Delete project (Org Manager or System Admin)

---

### User Story ID: US-12
**Feature Name:** Create Task
**Story:**

As a Project Manager or above, I can create a task with title, description, assignee and deadline in my assigned projects, and the assignee receives an email notification so work can be tracked.

**Acceptance Criteria (Sequential Flow)**

1. User opens `/projects/:projectId/taskboard`.
2. User clicks "New Task" (plus icon) in a column.
3. Frontend opens modal with inputs: title (required), description, task type, assignee selector (from project members), deadline, priority, file upload button.
4. User enters values and clicks Create.
5. Frontend validates inputs — title required, deadline valid date if present.
6. Frontend calls POST /api/tasks with { projectId, title, description, typeCode, assignedTo, deadline, priorityCode, statusCode }.
7. Backend verifies requester has Project Manager role or above for the project.
8. Backend inserts Task row with default status_code = 1 (todo) or specified column.
9. Backend emits 'task.assigned' event to Cloudflare Queue with { userId: assignedTo, taskId, taskTitle, projectId }.
10. Backend responds with created task object.
11. Queue consumer worker processes event, creates in-app notification and sends email notification to assigned user with task details and link.
12. Frontend updates task board (optimistic update) and closes modal.
13. Frontend shows success toast: "Task Created Successfully".

**Access Control Logic:**
- System Admin: Can create tasks in any project
- Organization Manager: Can create tasks in any project in their organization
- Project Manager: Can create tasks in assigned projects only
- Geino User: Cannot create tasks
- Genba User: Can create tasks with status_code = 4 (hold) in assigned projects only [Low Priority - Phase 2]

**Data Model (SQL)**
```sql
-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status_code INT DEFAULT 1, -- 1: todo, 2: in_progress, 3: done, 4: waiting
  type_code INT, -- 1: feature, 2: bug, 3: task, 4: improvement
  priority_code INT, -- 1: low, 2: medium, 3: high, 4: urgent
  color VARCHAR(20),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  deadline TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status_code ON tasks(status_code);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
```

**API Endpoints:**
- `POST /api/tasks` - Create task (Project Manager or higher)
- `GET /api/tasks` - List tasks (filtered by project access)
- `GET /api/tasks/:id` - Get task details
- `PATCH /api/tasks/:id` - Update task (Project Manager or higher)
- `DELETE /api/tasks/:id` - Delete task (Project Manager or higher)

---

### User Story ID: US-13
**Feature Name:** Update Task Status
**Story:**

As a Project Manager or above, I can update a task's status by dragging it between columns on the Task Board, and relevant users receive an email notification about the status change so progress is tracked visually.

**Acceptance Criteria (Sequential Flow)**

1. User opens `/projects/:projectId/taskboard`.
2. Frontend displays task columns: Todo, In Progress, Done, Waiting (fetched from GET /api/tasks?projectId=X).
3. User drags a task from one column to another (e.g., Todo → In Progress).
4. Frontend optimistically updates UI and calls PATCH /api/tasks/:id with { statusCode: 2 }.
5. Backend verifies requester has Project Manager role or above.
6. Backend updates task status_code and sets updated_at timestamp.
7. If status_code changed to 3 (done), backend sets completed_at timestamp.
8. Backend emits 'task.status_changed' event to Cloudflare Queue with { taskId, taskTitle, oldStatusCode, newStatusCode, assigneeUserId, creatorUserId }.
9. Backend responds with updated task.
10. Queue consumer worker processes event, creates in-app notifications and sends email notifications to task assignee and task creator about the status change.
11. Frontend confirms update or rolls back on error.

**Access Control Logic:**
- System Admin: Can update any task in any organization
- Organization Manager: Can update any task in their organization's projects
- Project Manager: Can update tasks in assigned projects only
- Geino/Genba User: Cannot update task status (read-only)

---

### User Story ID: US-14b
**Feature Name:** Duplicate Task [Low Priority - Phase 2]
**Story:**

As a Project Manager or above, I can duplicate an existing task to create a new task with prefilled values (excluding images and comments) so I can quickly create similar tasks without re-entering common information.

**Acceptance Criteria (Sequential Flow)**

1. User opens task detail modal from Task Board.
2. User clicks "Duplicate Task" button in task menu.
3. Frontend opens task creation modal with prefilled values from original task:
   - Title (with "Copy of" prefix)
   - Description
   - Task type
   - Priority
   - Deadline
   - Assignee
4. Images and comments are NOT copied.
5. User can modify any prefilled values before creating.
6. User clicks Create.
7. Frontend calls POST /api/tasks with prefilled data.
8. Backend creates new task with new UUID and created_at timestamp.
9. Backend emits 'task.assigned' event if assignee is present.
10. Backend responds with created task.
11. Frontend adds task to board and shows success toast: "Task Duplicated Successfully".

**Access Control Logic:**
- Same as US-12 (Project Manager or above)

---

### User Story ID: US-15b
**Feature Name:** Genba User Task Creation [Low Priority - Phase 2]
**Story:**

As a Genba User, I can create a new task with "hold" status and edit tasks I created so I can flag on-site issues or requests that need attention without disrupting the main workflow.

**Acceptance Criteria (Sequential Flow)**

1. Genba User opens `/projects/:projectId/taskboard`.
2. Genba User clicks "New Task" button (only creates tasks with hold status).
3. Frontend opens task creation modal with:
   - Title (required)
   - Description
   - Task type
   - Assignee selector (from project members)
   - Deadline
   - Priority
   - Status locked to "Waiting/Hold" (status_code = 4)
4. Genba User enters values and clicks Create.
5. Frontend calls POST /api/tasks with { ...taskData, statusCode: 4, createdBy: genbaUserId }.
6. Backend verifies requester is Genba User and assigned to project.
7. Backend creates task with status_code = 4 (hold/waiting) only.
8. Backend emits 'task.assigned' event if assignee is specified.
9. Backend responds with created task.
10. Frontend adds task to "Waiting" column and shows success toast.

**Edit Own Tasks:**
1. Genba User can only edit tasks where created_by = their userId.
2. Genba User can edit title, description, deadline, priority.
3. Genba User CANNOT change task status or assignee.
4. Backend validates created_by matches authenticated user before allowing edit.

**Access Control Logic:**
- Genba User: Can create tasks with status_code = 4 (hold) in assigned projects
- Genba User: Can edit tasks where created_by = userId (title, description, deadline, priority only)
- Genba User: Cannot change task status of any task (including own tasks)

**Data Model:**
- Uses existing tasks table with created_by field for ownership tracking

---

### User Story ID: US-16
**Feature Name:** Calendar View with Task Interactions
**Story:**

As any user, I can view tasks on a calendar (month/week view) for projects I have access to, click on a date to see tasks for that day, and click on a task to open the task detail modal so I can track deadlines visually.

**Acceptance Criteria (Sequential Flow)**

1. User navigates to `/calendar` page.
2. Frontend displays month view by default with task indicators on dates.
3. User can switch between month view and week view using toggle buttons.
4. Frontend calls GET /api/tasks?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&projectIds=[...] to fetch tasks for visible date range.
5. Backend filters tasks by user's project access and returns tasks with deadline in range.
6. Frontend displays colored dots/indicators on dates that have tasks.
7. **Date Click Interaction:**
   - User clicks on a date in the calendar.
   - Right side panel appears showing "Tasks on [Date]" header.
   - Panel lists all tasks with deadline on that date (title, project name, assignee, status badge).
   - User can see tasks grouped or sorted by project/status.
8. **Task Click Interaction:**
   - User clicks on a task in the right panel list.
   - Frontend navigates to task board page with task detail modal open: `/projects/:projectId/taskboard?taskId=XXX`.
   - Task detail modal shows full task information (title, description, comments, attachments, etc.).
   - User can edit/comment/interact with task based on their role permissions.
9. User can navigate between months/weeks using prev/next buttons.
10. Frontend updates calendar display and refetches tasks for new date range.

**Access Control Logic:**
- All users: Can view tasks in projects they have access to
- Calendar only shows tasks from projects where user is a member (any role)

**API Endpoints:**
- `GET /api/tasks?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&projectIds=[...]` - List tasks with deadline in date range

---

### User Story ID: US-17
**Feature Name:** Comment on Task (All Users)  
**Story:**

As any user (Project Manager, Geino User, Genba User), I can comment on a task in projects I have access to, mention other users with @name, and mentioned users receive email notifications so the team can discuss progress.

**Acceptance Criteria (Sequential Flow)**

1. User opens a task detail modal from the Task Board.
2. Frontend fetches existing comments from GET /api/tasks/:id/comments and GET /api/tasks/:id/mentions for rendering.
3. User writes a comment and types @ to trigger mention autocomplete.
4. Frontend displays dropdown with project members showing: "Name (email@example.com)".
5. User selects a person from dropdown (e.g., "John Doe (john.doe@company.com)").
6. Frontend inserts mention in comment text as: `@[John Doe](john.doe@company.com)`.
7. User can mention multiple users and optionally attach a file, then clicks Send.
8. Frontend validates comment (non-empty text or file).
9. Frontend parses comment text to extract all mentioned emails from `@[Name](email)` pattern.
10. If file attached, frontend uploads to /api/uploads and receives file URL.
11. Frontend calls POST /api/tasks/:id/comments with { text: "Hey @[John Doe](john.doe@company.com), can you review?", mentionedEmails: ["john.doe@company.com"], fileUrl, fileName }.
12. Backend verifies user has access to the project (any role).
13. Backend creates comment row with raw text containing `@[Name](email)` format.
15. Backend looks up user IDs from mentioned emails.
16. Backend emits 'comment.created' event to Cloudflare Queue with { commentId, taskId, taskTitle, authorId, taskAssigneeId, mentionedUserIds }.
17. Backend responds with created comment.
18. Queue consumer worker processes event, creates in-app notifications (comment.created for assignee, comment.mentioned for mentioned users) and sends email notifications to task assignee and all mentioned users with comment details and link to task.
19. Frontend renders comment by replacing `@[Name](email)` with clickable mention badges/chips showing the name.
20. Frontend updates comment list (displayed bottom to top, newest comment at bottom) and clears input.

**Note:** File uploads use signed URLs from Cloudflare R2 for secure upload and download operations.

**Data Model (SQL)**
```sql
-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL, -- Stores comment with mentions as: "Hey @[John Doe](john.doe@company.com), can you review?"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_attachments_comment_id ON attachments(comment_id);
```

**Mention Format:**
- **Storage Format:** `@[Display Name](email)` - e.g., `"Hey @[John Doe](john.doe@company.com), can you review?"`
- **Display Format:** Rendered as clickable badges/chips showing just the display name, e.g., `@John Doe`
- **Autocomplete:** Shows "Display Name (email@example.com)" in dropdown for disambiguation
- **Backend Parsing:** Extract all `@[Name](email)` patterns using regex, look up users by email to send notifications

**API Endpoints:**
- `POST /api/tasks/:id/comments` - Create comment (any user with project access)
- `GET /api/tasks/:id/comments` - List comments
- `GET /api/projects/:projectId/members` - Get all project members for mention autocomplete
- `POST /api/uploads` - Upload file to R2 storage
- `GET /api/uploads/:fileId` - Download/view file

---

### User Story ID: US-20
**Feature Name:** Notifications (In-App and Email)
**Story:**

As a user, when I am assigned a task, assigned a role, mentioned in a comment, or a task status changes, I receive both an in-app notification and an email notification so I'm aware of important updates.

**Acceptance Criteria (Sequential Flow)**

1. When a task is created/updated with assignedTo = userId, backend emits 'task.assigned' event to Cloudflare Queue.
2. When a user is assigned to an organization or project, backend emits 'organization.member_assigned' or 'project.member_assigned' event to queue.
3. When a comment is created with mentions, backend emits 'comment.created' event to queue with mentionedUserIds.
4. When a task status changes, backend emits 'task.status_changed' event to queue.
5. Queue consumer worker receives batched events and processes each:
   - Creates notification row in database with type_code, title, message, link
   - Sends email via SMTP provider with relevant details and deep links
   - Marks event as acknowledged after successful processing
6. Frontend polls GET /api/notifications every 30 seconds or uses WebSocket for real-time updates.
7. Frontend displays notification badge count on bell icon.
8. User clicks bell icon to view notifications list in `DashboardLayout`.
9. User can mark notifications as read via PATCH /api/notifications/:id.
10. User can mark all as read via POST /api/notifications/mark-all-read.

**Data Model (SQL)**
```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type_code INT NOT NULL, -- 1: task_assigned, 2: task_status_changed, 3: comment_created, 4: comment_mentioned, 5: project_invited, 6: role_assigned
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500), -- deep link to task/project
  payload JSONB, -- additional metadata
  read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_email_sent ON notifications(email_sent);
CREATE INDEX idx_notifications_type_code ON notifications(type_code);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

**API Endpoints:**
- `GET /api/notifications` - List user's notifications
- `PATCH /api/notifications/:id` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read

---

## 4. Dependencies

### Authentication & Authorization
- **Supabase Auth** - Backend authentication provider (accessed via service role key only)
- **@supabase/supabase-js** - Supabase client for backend only (service role key)
- **httpOnly Cookies** - Secure token storage (access_token, refresh_token)
- **JWT Verification** - Validate Supabase JWT tokens from cookies in Cloudflare Workers middleware
- **Token Refresh** - Automatic refresh via refresh_token cookie (50-minute interval on frontend)
- **Middleware** - Role-based access control (RBAC) checks on all API routes (using system_role_code, organization_role_code, project_role_code for context-based permissions)

### Database
- **Supabase PostgreSQL** - Primary data store (includes auth.users managed by Supabase)
- **Drizzle ORM** - Type-safe database queries and migrations for custom tables
- **@supabase/supabase-js** - Database client with connection pooling
- **Postgres Connection Pooler** - Supabase provides built-in pooling for Cloudflare Workers

### Storage & Files
- **Cloudflare R2** - Object storage for file attachments
- **Pre-signed URLs** - Secure file upload/download

### Notifications & Queue System
- **Cloudflare Queues** - Async event processing for notifications (batched message processing)
- **Queue Consumer Worker** - Processes notification events: creates in-app notifications + sends emails
- **SMTP Provider** - MailChannels, SendGrid, Resend, or AWS SES for application notification emails
- **Event Types:**
  - `organization.member_assigned` - Organization manager assignment (in-app + email)
  - `project.member_assigned` - Project member assignment (in-app + email)
  - `task.assigned` - Task assignment notification (in-app + email)
  - `task.status_changed` - Task status update notification (in-app + email)
  - `comment.created` - Comment notification with mentions (in-app + email)

### Access Control Enforcement
Every API endpoint must verify:
1. User is authenticated (valid Supabase JWT token from httpOnly cookie)
2. User has required role for the operation:
   ```typescript
   // Example middleware for Cloudflare Workers
   async function authenticate(request: Request, env: Env) {
     // Extract access_token from httpOnly cookie
     const cookieHeader = request.headers.get('Cookie');
     const token = getCookieValue(cookieHeader, 'access_token');
     if (!token) throw new Error('Unauthorized');
     
     // Verify Supabase JWT using service role key
     const supabase = createClient(
       env.SUPABASE_URL, 
       env.SUPABASE_SERVICE_ROLE_KEY,
       { auth: { persistSession: false } }
     );
     const { data: { user }, error } = await supabase.auth.getUser(token);
     if (error || !user) throw new Error('Unauthorized');
     
     // Fetch role from custom users table
     const appUser = await db.query.users.findFirst({
       where: eq(users.id, user.id)
     });
     if (!appUser) throw new Error('User profile not found');
     
     return appUser; // { id, email, firstname, lastname, system_role_code }
   }
   
   const requireSystemRole = (allowedRoleCodes: number[]) => {
     return (user: any) => {
       if (!allowedRoleCodes.includes(user.system_role_code)) {
         throw new Error('Forbidden');
       }
     };
   };
   
   // Helper function
   function getCookieValue(cookieHeader: string | null, name: string): string | null {
     if (!cookieHeader) return null;
     const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
     return match ? match[2] : null;
   }
   
   // Usage
   const user = await authenticate(request, env);
   requireRole([1])(user); // 1 = system_admin
   ```

---

## 5. Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Database schema setup (all tables above)
2. ✅ Supabase Auth backend integration (registration, login, logout with httpOnly cookies)
3. ✅ User management (System Admin can assign roles)
4. ✅ Basic RBAC middleware with cookie-based JWT validation

### Phase 2: Core Features (Week 3-4)
1. ✅ Organizations API (CRUD)
2. ✅ Projects API (CRUD)
3. ✅ Tasks API (CRUD, status updates)
4. ✅ Access control enforcement on all endpoints

### Phase 3: Collaboration (Week 5-6)
1. ✅ Comments API
2. ✅ File upload/download (R2 integration)
3. ✅ Notifications system (in-app)
4. ✅ Email notifications

### Phase 4: Polish (Week 7-8)
1. ✅ Calendar view API
2. ✅ Dashboard statistics
3. ✅ Search & filters
4. ✅ Audit logs
5. ✅ Frontend integration with real APIs

---

## 6. API Summary

### Authentication
- `POST /api/auth/register` - Register new user (creates Supabase auth user + profile in users table)
- `POST /api/auth/login` - Login user (authenticate with Supabase, set httpOnly cookies, return user profile)
- `POST /api/auth/logout` - Logout user (clear cookies, revoke Supabase tokens)
- `POST /api/auth/refresh` - Refresh access token using refresh_token cookie
- `POST /api/auth/reset-password` - Request password reset email (calls Supabase)
- `POST /api/auth/update-password` - Update password with reset token (calls Supabase)
- `GET /api/auth/session` - Get current user session from httpOnly cookie

**Note:** All authentication flows handled via backend API endpoints. Frontend does not directly interact with Supabase Auth.
- JWT tokens stored in httpOnly cookies (XSS-safe)
- Automatic token refresh every 50 minutes (tokens expire in 60 minutes)
- Email verification handled automatically by Supabase

### Users (System Admin)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user (assign role)
- `DELETE /api/users/:id` - Delete user

### Organizations
- `POST /api/organizations` - Create (System Admin)
- `GET /api/organizations` - List (filtered by access)
- `GET /api/organizations/:id` - Get details
- `PATCH /api/organizations/:id` - Update (System Admin or Org Manager)
- `DELETE /api/organizations/:id` - Delete (System Admin)

### Projects
- `POST /api/projects` - Create (Org Manager or System Admin)
- `GET /api/projects` - List (filtered by user access)
- `GET /api/projects/:id` - Get details
- `PATCH /api/projects/:id` - Update (Project Manager, Org Manager, or System Admin)
- `DELETE /api/projects/:id` - Delete (Org Manager or System Admin)

### Tasks
- `POST /api/tasks` - Create (Project Manager or higher)
- `GET /api/tasks` - List (filtered by project access, supports date range for calendar)
- `GET /api/tasks/:id` - Get details
- `PATCH /api/tasks/:id` - Update (Project Manager or higher)
- `DELETE /api/tasks/:id` - Delete (Project Manager or higher)

### Comments
- `POST /api/tasks/:id/comments` - Create comment
- `GET /api/tasks/:id/comments` - List comments
- `PATCH /api/comments/:id` - Update own comment
- `DELETE /api/comments/:id` - Delete own comment

### Uploads
- `POST /api/uploads` - Upload file to R2
- `GET /api/uploads/:fileId` - Download file

### Notifications
- `GET /api/notifications` - List user's notifications
- `PATCH /api/notifications/:id` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read

---

Generated on: 2025-11-09