GEINO SAAS - PROJECT REQUIREMENT SCOPE DOCUMENT
INTRODUCTION
Geino SaaS is a project and task management platform for teams to plan work, track progress, and collaborate. The platform supports multiple organizations with role-based access control.


USER ROLES AND ACCESS CONTROL
The platform has 5 user roles with different permission levels:


System Admin
- Can access and manage ALL organizations in the system
- Creates organizations and assigns Organization Managers
- Can view and manage all projects across all organizations
- Can create, edit, and delete tasks in any project
- Can comment on any task


Organization Manager
- Can access and manage ONLY their own organization
- Creates projects within their organization
- Assigns Project Managers, Geino Users, and Genba Users to projects
- Can view, edit, and manage all projects in their organization
- Can create, edit, and delete tasks in their organization's projects
- Can comment on any task in their organization


Project Manager
- Can access ONLY projects they are assigned to
- Can create, edit, and delete tasks in their assigned projects
- Can update task status (drag tasks between columns)
- Can assign tasks to project members
- Can comment on tasks in their projects
- Can upload files to tasks
- CANNOT create or edit projects
- Has read-only access to organization information


Geino User (Field Worker - Creative/Talent)
- Can access ONLY projects they are assigned to
- Has READ-ONLY access to projects and tasks
- Can view task details, deadlines, and attachments
- Can comment on tasks and mention other users
- Can upload files to comments
- CANNOT create, edit, or delete tasks
- CANNOT change task status


Genba User (Field Worker - On-site)
- Can access ONLY projects they are assigned to
- Has READ-ONLY access to projects and tasks
- Can view task details, deadlines, and attachments
- Can comment on tasks and mention other users
- Can upload files to comments
- Can create task only with hold status
- Can edit task created by themself (low priority)
- CANNOT edit, or delete tasks by other people
- CANNOT change task status of any, even if it is task created by themself




ACCESS CONTROL SUMMARY TABLE


Feature                          | System Admin | Organization Manager | Project Manager | Geino User | Genba User
---------------------------------------------------------------------------------------------------
View any organization            | Yes          | Own org only        | Read only       | Read only  | Read only
Create/edit organizations        | Yes          | No                  | No              | No         | No
View any project                 | Yes          | Own org only        | Assigned only   | Assigned   | Assigned
Create/edit projects             | Yes          | Yes (own org)       | No              | No         | No
View any task                    | Yes          | Yes (own org)       | Assigned only   | Assigned   | Assigned
Create/edit tasks                | Yes          | Yes (own org)       | Yes (assigned)  | No         | No
Change task status               | Yes          | Yes (own org)       | Yes (assigned)  | No         | No
Comment on tasks                 | Yes          | Yes                 | Yes             | Yes        | Yes


FEATURE LIST
1. AUTHENTICATION & USER MANAGEMENT
User Registration
- As a new user, I can register with email and password including user profile info like firstname, lastname
- I receive a verification email to confirm my account
- After verification, I can log in to the system


User Login
- As a registered user, I can log in with my credentials
- The system redirects me to the appropriate dashboard based on my role


Password Reset
- As a user, I can request a password reset via email
- I receive a reset link in my email
- I can set a new password using the reset link
- I receive a confirmation email after successful password reset


View Users (System Admin only)
- As a System Admin, I can view all registered users
- I can see their assigned roles
- I can assign or change user organization roles


2. ORGANIZATION MANAGEMENT
Create Organization (System Admin only)
- As a System Admin, I can create a new organization
- I can add a name and description
- I can assign Organization Managers
- Assigned Organization Managers receive email notifications about their role


View and Update Organization
- As a System Admin, I can view and update any organization info details
- As an Organization Manager, I can view and update my organization's info details




3. PROJECT MANAGEMENT
Create Project (Organization Manager or above)
- As an Organization Manager, I can create a new project
- I can add project name, description, start date, and end date
- I can assign Project Managers, Geino Users, and Genba Users
- All assigned members receive email notifications


View Projects
- As an Organization Manager, I can view all projects in my organization
- As a Project Manager, I can view projects I'm assigned to
- As a Geino User or Genba User, I can view projects I'm assigned to (read-only)


Edit Project (Project Manager or above)
- As a Project Manager, I can edit projects I'm assigned to including members
- As an Organization Manager, I can edit any project in my organization including members




4. TASK MANAGEMENT
Create Task (Project Manager or above)
- As a Project Manager, I can create a new task in my assigned projects
- I can add task title, description, task type, priority, assignee, and deadline from a new task web form 
- or I can create new Task by duplicating details of Task from existing one (task card) with a button (New Task web form is prefilled with details from existing Task except the image and comments) (low priority for first phase)
- The assignee receives an email notification


Update Task Status (Project Manager or above)
- As a Project Manager, I can drag tasks between columns (Hold, Todo, In Progress, Done, Waiting)
- The assignee and task creator receive email notifications when status changes


Edit Task (Project Manager or above)
- As a Project Manager, I can edit task details (title, description, assignee, deadline)
- Changes are saved and visible to all project members


View Tasks (All user assigned to task or above)
- As a Geino User or Genba User, I can view tasks in projects I'm assigned to (read-only)
- I cannot edit or change task status


View Calendar
- As any user, I can view tasks on a calendar (month or week view) of project selected
- I can see tasks from projects I have access to organized by date
- As any user, when I click a date on the calendar,
- I can see the task list for the project for that day on the right side
- As any user, when I click a task in task list,
- I can see the task in task board (model as per current ui design)




5. COMMENTS
Comment on Task (All users with access to task)
- As any user, I can add comments to tasks in projects I have access to
- I can mention other users by typing @ and selecting their name
- Mentioned users receive email notifications
- The task assignee receives a notification when comments are added
- As any user, I can view the comment history of past comments in a Task
- where the comment in history is displayed from bottom to top (newest at the bottom)
6. ATTACHMENTS
Upload Files (All users with access to task)
- As any user that can access task, I can upload files and images to my comments
- Files are attached to the comment for others to view and download
- File upload uses signed url


View and Download Attachments (All users with access to task)
- As any user that can access task, I can view and download attachments from task comments
- File download uses signed url




7. NOTIFICATIONS
Receive Notifications
- As a user, I receive an in-app notification AND an email notification when:
 * I am assigned a task
 * A task I'm assigned to changes status
 * I am assigned a role (Organization Manager, Project Manager, etc.)
 * I am mentioned in a comment
 * I am added to a project


View Notification History
- As a user, I can view my notification history
- I can see which notifications are unread (badge count on bell icon)
- I can mark individual notifications as read
- I can mark all notifications as read at once
- Each notification has a link that takes me directly to the related task or project




NOTIFICATION DETAILS
Users receive email notifications for:
- Account registration (verification/invite email)
- Password reset request (reset link)
- Password reset confirmation
- Organization Manager role assignment
- Project Manager role assignment
- Geino User or Genba User project assignment
- Task assignment
- Task status changes
- Comments with @mentions




SUMMARY
This document outlines the complete scope of the Geino SaaS platform. The system provides:
- 5 distinct user roles with appropriate access levels
- Organization and project hierarchy
- Visual task management with drag-and-drop
- collaboration through comments and mentions
- Email and in-app notifications for all important events
- File attachment support
- Calendar view for deadline tracking


The platform ensures that users can only access and modify content based on their role and assignments, maintaining security and data privacy across organizations.




