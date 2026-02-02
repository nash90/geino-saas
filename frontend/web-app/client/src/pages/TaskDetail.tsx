import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskDetailDialog } from '@/components/tasks';
import type { ProjectWithMembers, TaskWithComments } from '@/types/entities';
import { usePermissions } from '@/hooks/usePermissions';

export default function TaskDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const permissions = usePermissions();

  const taskId = params.taskId;
  const [task, setTask] = useState<TaskWithComments | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Track initial history length to detect if user came from within app
  const initialHistoryLength = useRef(window.history.length);

  useEffect(() => {
    if (taskId) {
      loadTaskAndProject();
    }
  }, [taskId]);

  const loadTaskAndProject = async () => {
    setLoading(true);
    try {
      // Load task with comments
      const taskWithComments = await tasksApi.get(taskId!);
      setTask(taskWithComments);

      // Load project details for permissions and members
      const projectResponse = await projectsApi.get(taskWithComments.projectId);
      setProjectDetails(projectResponse.project);

      // Open dialog after loading
      setIsDialogOpen(true);
    } catch (error: any) {
      console.error('Failed to load task:', error);
      toast.error('タスクの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdated = async () => {
    await loadTaskAndProject();
  };

  const handleClose = () => {
    setIsDialogOpen(false);

    // Check if user has navigation history (came from within the app)
    // If history length is same or less than initial, user came from direct link
    setTimeout(() => {
      if (window.history.length <= initialHistoryLength.current || window.history.length <= 1) {
        // No history or direct link - go to taskboard
        setLocation('/taskboard');
      } else {
        // Has history - go back
        window.history.back();
      }
    }, 100);
  };

  const projectMembers = projectDetails?.members?.map((m: any) => ({
    id: m.userId,
    email: m.user?.email || "",
    firstname: m.user?.firstname || "",
    lastname: m.user?.lastname || "",
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">タスクが見つかりませんでした</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              if (window.history.length <= initialHistoryLength.current || window.history.length <= 1) {
                setLocation('/taskboard');
              } else {
                window.history.back();
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb - visible behind the dialog */}
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={handleClose}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
      </div>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={task}
        open={isDialogOpen}
        onClose={handleClose}
        projectMembers={projectMembers}
        onTaskUpdated={handleTaskUpdated}
        canEdit={task ? permissions.canEditTask(task) : false}
        canDelete={task ? permissions.canDeleteTask(task.projectId) : false}
      />
    </>
  );
}
