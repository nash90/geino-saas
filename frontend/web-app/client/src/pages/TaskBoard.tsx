import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { tasksApi } from "@/api/tasks";
import { projectsApi } from "@/api/projects";
import type { TaskWithDetails, ProjectWithMembers } from "@/types/entities";
import { TaskStatusCodes } from "@/types/entities";
import {
  TaskCard,
  Column,
  TaskCreateDialog,
  TaskDetailDialog,
} from "@/components/tasks";

type ColumnType = "hold" | "todo" | "inProgress" | "done";

const statusCodeToColumn: Record<number, ColumnType> = {
  [TaskStatusCodes.HOLD]: "hold",
  [TaskStatusCodes.TODO]: "todo",
  [TaskStatusCodes.IN_PROGRESS]: "inProgress",
  [TaskStatusCodes.DONE]: "done",
};

const columnToStatusCode: Record<ColumnType, number> = {
  hold: TaskStatusCodes.HOLD,
  todo: TaskStatusCodes.TODO,
  inProgress: TaskStatusCodes.IN_PROGRESS,
  done: TaskStatusCodes.DONE,
};

export default function TaskBoard() {
  const { user, projects } = useAuth();
  const permissions = usePermissions();

  const [selectedProject, setSelectedProject] = useState<string>("");
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

  // Initialize with first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  // Load tasks and project details when project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  const loadProjectData = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      // Fetch project details with members
      const projectResponse = await projectsApi.get(selectedProject);
      setCurrentProjectDetails(projectResponse.project);

      // Fetch tasks
      const tasksResponse = await tasksApi.list(selectedProject);
      setTasks(tasksResponse.tasks);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!selectedProject) return;

    try {
      const response = await tasksApi.list(selectedProject);
      setTasks(response.tasks);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check permission
    if (!permissions.canEditTask(activeTask)) {
      toast.error("You don't have permission to move this task");
      return;
    }

    const targetColumn = over.id as ColumnType;
    const newStatusCode = columnToStatusCode[targetColumn];

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
    if (!selectedProject) return;
    if (!permissions.canCreateTask(selectedProject, statusCode)) {
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
  const canCreateAnyStatus = selectedProject
    ? permissions.isProjectManagerOrAbove(selectedProject)
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
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="プロジェクトを選択..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Column
                id="hold"
                title="Hold"
                icon="📋"
                tasks={getTasksByColumn("hold")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatusCodes.HOLD)}
                showAddButton={permissions.canCreateTask(
                  selectedProject,
                  TaskStatusCodes.HOLD
                )}
              />
              <Column
                id="todo"
                title="To Do"
                icon="📝"
                tasks={getTasksByColumn("todo")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatusCodes.TODO)}
                showAddButton={canCreateAnyStatus}
              />
              <Column
                id="inProgress"
                title="In Progress"
                icon="⚙️"
                tasks={getTasksByColumn("inProgress")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatusCodes.IN_PROGRESS)}
                showAddButton={canCreateAnyStatus}
              />
              <Column
                id="done"
                title="Done"
                icon="✅"
                tasks={getTasksByColumn("done")}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(TaskStatusCodes.DONE)}
                showAddButton={canCreateAnyStatus}
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
        projectId={selectedProject}
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
        canDelete={selectedProject ? permissions.canDeleteTask(selectedProject) : false}
      />
        </>
      )}
    </div>
  );
}
