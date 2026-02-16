import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { tasksApi } from "@/api/tasks";
import { projectsApi } from "@/api/projects";
import { toast } from "sonner";
import type { TaskWithDetails, ProjectWithMembers } from "@/types/entities";
import { TaskStatus } from "@/types/entities";
import { CalendarGrid, CalendarTaskList, TaskDetailDialog } from "@/components/tasks";
import { ProjectMultiSelect } from "@/components/ProjectMultiSelect";
import { handleApiError } from "@/lib/errorHandler";
import { OPERATION_ERROR_MESSAGES } from "@/constants/errorMessages";

interface CalendarTask {
  date: string;
  tasks: TaskWithDetails[];
}

export default function CalendarView() {
  const { user, projects } = useAuth();
  const permissions = usePermissions();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });

  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
    const stored = localStorage.getItem('calendar_selected_projects');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);

  // Task detail dialog state
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentProjectDetails, setCurrentProjectDetails] = useState<ProjectWithMembers | null>(null);

  // Validate and initialize selected projects
  useEffect(() => {
    if (projects.length === 0) return;

    const projectIds = projects.map(p => p.id);

    // Validate stored selections against available projects
    let validSelections = selectedProjects.filter(id => projectIds.includes(id));

    // If no valid selections, default to all projects (up to 5)
    if (validSelections.length === 0) {
      validSelections = projectIds.slice(0, 5);
    }

    // Enforce max 5 limit
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
    localStorage.setItem('calendar_selected_projects', JSON.stringify(selectedProjects));
  }, [selectedProjects]);

  // Load calendar tasks when projects or date range changes
  useEffect(() => {
    if (selectedProjects.length > 0) {
      loadCalendarTasks();
    } else {
      setCalendarTasks([]);
    }
  }, [selectedProjects, currentDate, currentWeekStart, viewMode]);

  const loadCalendarTasks = async () => {
    if (selectedProjects.length === 0) return;

    setLoading(true);
    try {
      // Calculate date range based on view mode
      let fromDate: string;
      let toDate: string;

      if (viewMode === "month") {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        fromDate = formatDate(firstDay);
        toDate = formatDate(lastDay);
      } else {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        fromDate = formatDate(currentWeekStart);
        toDate = formatDate(weekEnd);
      }

      const response = await tasksApi.getCalendarTasks({
        projectIds: selectedProjects,
        fromDate,
        toDate,
      });

      setCalendarTasks(response.calendarTasks);
    } catch (error) {
      handleApiError(error, OPERATION_ERROR_MESSAGES.CALENDAR_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const nextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const getTasksForDate = (date: Date): TaskWithDetails[] => {
    const dateStr = formatDate(date);
    const dayTasks = calendarTasks.find((ct) => ct.date === dateStr);
    return dayTasks?.tasks || [];
  };

  const getDayTasks = (day: number): TaskWithDetails[] => {
    const date = new Date(year, month, day);
    return getTasksForDate(date);
  };

  // Calculate progress based on all tasks
  const allTasks = calendarTasks.flatMap((ct) => ct.tasks);
  const completedTasks = allTasks.filter((t) => t.statusCode === TaskStatus.DONE.code).length;
  const totalTasks = allTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const tasksForSelectedDate = selectedDate ? getTasksForDate(selectedDate) : [];

  // Get current week days for week view
  const getCurrentWeekDays = () => {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekViewDays = getCurrentWeekDays();

  const loadTaskDetails = async (taskId: string) => {
    setLoadingTaskDetails(true);
    try {
      const taskWithComments = await tasksApi.get(taskId);
      setSelectedTask(taskWithComments);

      // Load project details for members
      if (taskWithComments.projectId) {
        const projectResponse = await projectsApi.get(taskWithComments.projectId);
        setCurrentProjectDetails(projectResponse.project);
      }
    } catch (error) {
      handleApiError(error, OPERATION_ERROR_MESSAGES.TASK_LOAD_FAILED);
    } finally {
      setLoadingTaskDetails(false);
    }
  };

  const handleTaskClick = async (task: TaskWithDetails) => {
    setIsDetailDialogOpen(true);
    await loadTaskDetails(task.id);
  };

  const handleTaskUpdated = async () => {
    await loadCalendarTasks();
    // Reload the task details if dialog is still open
    if (selectedTask && isDetailDialogOpen) {
      await loadTaskDetails(selectedTask.id);
    }
  };

  const handleDialogClose = () => {
    setIsDetailDialogOpen(false);
    setSelectedTask(null);
    setCurrentProjectDetails(null);
  };

  // Get project members for assignment dropdown
  const projectMembers = currentProjectDetails?.members?.map((m: any) => ({
    id: m.userId,
    email: m.user?.email || "",
    firstname: m.user?.firstname || "",
    lastname: m.user?.lastname || "",
  })) || [];

  return (
    <div className="p-6">
      {/* Calendar Header - Full Width */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={viewMode === "month" ? prevMonth : prevWeek}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {viewMode === "month" ? (
                `${year}年${month + 1}月`
              ) : (
                `${currentWeekStart.getMonth() + 1}月${currentWeekStart.getDate()}日-${(() => {
                  const weekEnd = new Date(currentWeekStart);
                  weekEnd.setDate(currentWeekStart.getDate() + 6);
                  return `${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
                })()}`
              )}
            </h2>
            <Button variant="ghost" size="icon" onClick={viewMode === "month" ? nextMonth : nextWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar in Center */}
          <div className="flex-1 max-w-md mx-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">進捗状況</span>
                <span className="font-bold">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-right">{Math.round(progressPercentage)}%</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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

            <div className="flex gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
              >
                月間表示
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
              >
                週間表示
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Calendar Section */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <CalendarGrid
              viewMode={viewMode}
              currentDate={currentDate}
              currentWeekStart={currentWeekStart}
              calendarDays={calendarDays}
              weekViewDays={weekViewDays}
              weekDays={weekDays}
              getTasksForDate={getTasksForDate}
              getDayTasks={getDayTasks}
              onDateClick={setSelectedDate}
            />
          </div>

          {/* Right Sidebar - Task List */}
          <div className="w-80 bg-white rounded-lg shadow p-6">
            <CalendarTaskList
              selectedDate={selectedDate}
              tasks={tasksForSelectedDate}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>
      )}

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={isDetailDialogOpen}
        onClose={handleDialogClose}
        projectMembers={projectMembers}
        onTaskUpdated={handleTaskUpdated}
        canEdit={selectedTask ? permissions.canEditTask(selectedTask) : false}
        canDelete={selectedTask?.projectId ? permissions.canDeleteTask(selectedTask.projectId) : false}
      />
    </div>
  );
}
