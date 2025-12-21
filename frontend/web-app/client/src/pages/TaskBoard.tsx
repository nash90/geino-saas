import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { tasksApi } from "@/api/tasks";
import { projectsApi } from "@/api/projects";
import type { TaskWithDetails, ProjectWithMembers } from "@/types/entities";
import { TaskStatus } from "@/types/entities";
import {
  TaskCard,
  Column,
  TaskCreateDialog,
  TaskDetailDialog,
} from "@/components/tasks";
import { ProjectMultiSelect } from "@/components/ProjectMultiSelect";

type ColumnType = "hold" | "todo" | "inProgress" | "done";

const statusCodeToColumn: Record<number, ColumnType> = {
  [TaskStatus.HOLD.code]: "hold",
  [TaskStatus.TODO.code]: "todo",
  [TaskStatus.IN_PROGRESS.code]: "inProgress",
  [TaskStatus.DONE.code]: "done",
};

const columnToStatusCode: Record<ColumnType, number> = {
  hold: TaskStatus.HOLD.code,
  todo: TaskStatus.TODO.code,
  inProgress: TaskStatus.IN_PROGRESS.code,
  done: TaskStatus.DONE.code,
};

export default function TaskBoard() {
  const { user, projects } = useAuth();
  const permissions = usePermissions();

  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
    const stored = localStorage.getItem('taskboard_selected_projects');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentProjectDetails, setCurrentProjectDetails] = useState<ProjectWithMembers | null>(null);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDialogStatus, setCreateDialogStatus] = useState<number | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor,{
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Validate and initialize selected projects
  useEffect(() => {
    if (projects.length === 0) return;

    const projectIds = projects.map(p => p.id);

    // Validate stored selections against available projects
    let validSelections = selectedProjects.filter(id => projectIds.includes(id));

    // If no valid selections or empty, default to first project
    if (validSelections.length === 0) {
      validSelections = [projects[0].id];
    }

    // Enforce max 5 limit (safety check)
    if (validSelections.length > 5) {
      validSelections = validSelections.slice(0, 5);
    }

    // Update state if validation changed the selection
    const currentSelection = JSON.stringify(selectedProjects.slice().sort());
    const newSelection = JSON.stringify(validSelections.slice().sort());

    if (currentSelection !== newSelection) {
      setSelectedProjects(validSelections);
    }
  }, [projects, selectedProjects]);

  // Persist selected projects to localStorage
  useEffect(() => {
    localStorage.setItem('taskboard_selected_projects', JSON.stringify(selectedProjects));
  }, [selectedProjects]);

  // Load tasks when selected projects change
  useEffect(() => {
    if (selectedProjects.length > 0) {
      loadProjectData();
    }
  }, [selectedProjects]);

  const loadProjectData = async () => {
    if (selectedProjects.length === 0) return;

    setLoading(true);
    try {
      // Fetch project details for the first selected project (for permissions and member list)
      const projectResponse = await projectsApi.get(selectedProjects[0]);
      setCurrentProjectDetails(projectResponse.project);

      // Fetch tasks for all selected projects in parallel
      const taskPromises = selectedProjects.map(projectId =>
        tasksApi.list(projectId)
      );

      const responses = await Promise.all(taskPromises);

      // Merge all tasks from different projects
      const allTasks = responses.flatMap(response => response.tasks);
      setTasks(allTasks);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (selectedProjects.length === 0) return;

    try {
      // Fetch tasks for all selected projects in parallel
      const taskPromises = selectedProjects.map(projectId =>
        tasksApi.list(projectId)
      );

      const responses = await Promise.all(taskPromises);

      // Merge all tasks from different projects
      const allTasks = responses.flatMap(response => response.tasks);
      setTasks(allTasks);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load tasks");
    }
  };

  const getTasksByColumn = (column: ColumnType): TaskWithDetails[] => {
    const statusCode = columnToStatusCode[column];
    return tasks.filter((task) => task.statusCode === statusCode);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Custom collision detection that prioritizes columns over tasks
  const customCollisionDetection = (args: any) => {
    // Get all collisions
    const closestCornersCollisions = closestCorners(args);

    // Valid column IDs
    const validColumns = ['hold', 'todo', 'inProgress', 'done'];

    // Check if there's a column collision
    const columnCollision = closestCornersCollisions.find(collision =>
      validColumns.includes(String(collision.id))
    );

    // If there's a column collision, return only that (for cross-column moves)
    if (columnCollision) {
      return [columnCollision];
    }

    // Otherwise, allow task collisions (for same-column reordering)
    return closestCornersCollisions;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Valid column IDs
    const validColumns = ['hold', 'todo', 'inProgress', 'done'];

    // Only process if dropped on a column (not on another task)
    if (!validColumns.includes(String(over.id))) {
      return;
    }

    // Check permission - must be able to change task status (PM+ only)
    if (!permissions.canChangeTaskStatus(activeTask)) {
      toast.error("You don't have permission to change task status. Only Project Managers can change task status.");
      return;
    }

    const targetColumn = over.id as ColumnType;
    const newStatusCode = columnToStatusCode[targetColumn];

    // Validate that we have a valid status code
    if (newStatusCode === undefined || newStatusCode === null) {
      return;
    }

    if (activeTask.statusCode === newStatusCode) return;

    // Optimistic update
    setTasks((tasks) =>
      tasks.map((t) => (t.id === active.id ? { ...t, statusCode: newStatusCode } : t))
    );

    try {
      await tasksApi.updateStatus(active.id as string, newStatusCode);
      toast.success("Task status updated");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update task");
      loadTasks(); // Revert on error
    }
  };

  const handleAddTask = (statusCode?: number) => {
    if (selectedProjects.length === 0) return;
    // Use the first selected project for creating tasks
    const primaryProject = selectedProjects[0];
    if (!permissions.canCreateTask(primaryProject, statusCode)) {
      toast.error("You don't have permission to create tasks");
      return;
    }
    setCreateDialogStatus(statusCode);
    setIsCreateDialogOpen(true);
  };

  const loadTaskDetails = async (taskId: string) => {
    setLoadingTaskDetails(true);
    try {
      const taskWithComments = await tasksApi.get(taskId);
      setSelectedTask(taskWithComments);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load task details");
    } finally {
      setLoadingTaskDetails(false);
    }
  };

  const handleTaskClick = async (task: TaskWithDetails) => {
    setIsDetailDialogOpen(true);
    await loadTaskDetails(task.id);
  };

  const handleTaskUpdated = async () => {
    await loadTasks();
    // Reload the task details if dialog is still open
    if (selectedTask && isDetailDialogOpen) {
      await loadTaskDetails(selectedTask.id);
    }
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setIsDetailDialogOpen(false);
    setSelectedTask(null);
    setCreateDialogStatus(undefined);
  };

  // Get project members for assignment dropdown
  const projectMembers = currentProjectDetails?.members?.map((m: any) => ({
    id: m.userId,
    email: m.user?.email || "",
    firstname: m.user?.firstname || "",
    lastname: m.user?.lastname || "",
  })) || [];

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;
  const canCreateAnyStatus = selectedProjects.length > 0
    ? permissions.isProjectManagerOrAbove(selectedProjects[0])
    : false;

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-gray-500">No projects available</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <h1 className="text-xl font-bold">Task Board</h1>
            {projects.length > 0 ? (
              <ProjectMultiSelect
                projects={projects.map(p => ({ id: p.id, name: p.name }))}
                selectedProjectIds={selectedProjects}
                onSelectionChange={setSelectedProjects}
                placeholder="プロジェクトを選択 (最大5つ)"
              />
            ) : (
              <div className="text-sm text-gray-500">プロジェクトを読み込み中...</div>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Column
                id="hold"
                title={TaskStatus.HOLD.label}
                icon="📋"
                tasks={getTasksByColumn("hold")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatus.HOLD.code)}
                showAddButton={selectedProjects.length > 0 && permissions.canCreateTask(
                  selectedProjects[0],
                  TaskStatus.HOLD.code
                )}
                canDragTasks={(task) => permissions.canChangeTaskStatus(task)}
              />
              <Column
                id="todo"
                title={TaskStatus.TODO.label}
                icon="📝"
                tasks={getTasksByColumn("todo")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatus.TODO.code)}
                showAddButton={canCreateAnyStatus}
                canDragTasks={(task) => permissions.canChangeTaskStatus(task)}
              />
              <Column
                id="inProgress"
                title={TaskStatus.IN_PROGRESS.label}
                icon="⚙️"
                tasks={getTasksByColumn("inProgress")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatus.IN_PROGRESS.code)}
                showAddButton={canCreateAnyStatus}
                canDragTasks={(task) => permissions.canChangeTaskStatus(task)}
              />
              <Column
                id="done"
                title={TaskStatus.DONE.label}
                icon="✅"
                tasks={getTasksByColumn("done")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatus.DONE.code)}
                showAddButton={canCreateAnyStatus}
                canDragTasks={(task) => permissions.canChangeTaskStatus(task)}
              />
            </div>

            <DragOverlay>
              {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
            </DragOverlay>
          </DndContext>

          {/* Dialogs */}
          <TaskCreateDialog
        open={isCreateDialogOpen}
        onClose={handleDialogClose}
        projectId={selectedProjects[0] || ""}
        statusCode={createDialogStatus}
        projectMembers={projectMembers}
        onTaskCreated={loadTasks}
        canCreateAnyStatus={canCreateAnyStatus}
      />

      <TaskDetailDialog
        task={selectedTask}
        open={isDetailDialogOpen}
        onClose={handleDialogClose}
        projectMembers={projectMembers}
        onTaskUpdated={handleTaskUpdated}
        canEdit={selectedTask ? permissions.canEditTask(selectedTask) : false}
        canDelete={selectedProjects.length > 0 ? permissions.canDeleteTask(selectedProjects[0]) : false}
      />
        </>
      )}
    </div>
  );
}
