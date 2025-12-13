import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Copy, Upload, Download, Save, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { tasksApi } from "@/api/tasks";
import type { TaskWithComments, TaskCommentWithUser } from "@/types/entities";
import { TaskStatus, TaskType } from "@/types/entities";
import { usePermissions } from "@/hooks/usePermissions";
import { CommentList } from "./CommentList";
import { CommentInput } from "./CommentInput";
import { useAuth } from "@/contexts/AuthContext";

interface TaskDetailDialogProps {
  task: TaskWithComments | null;
  open: boolean;
  onClose: () => void;
  projectMembers: Array<{ id: string; email: string; firstname: string; lastname: string }>;
  onTaskUpdated: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function TaskDetailDialog({
  task,
  open,
  onClose,
  projectMembers,
  onTaskUpdated,
  canEdit,
}: TaskDetailDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedStatusCode, setEditedStatusCode] = useState<number>(TaskStatus.TODO.code);
  const [editedAssignedTo, setEditedAssignedTo] = useState<string>("");
  const [editedDeadline, setEditedDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<TaskCommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const permissions = usePermissions();
  const { user } = useAuth();

  // Initialize edit form when task changes
  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || "");
      setEditedStatusCode(task.statusCode);
      setEditedAssignedTo(task.assignedTo || "");
      setEditedDeadline(task.deadline ? task.deadline.split('T')[0] : "");
      setIsEditMode(false);
      fetchComments();
    }
  }, [task]);

  const fetchComments = async () => {
    if (!task?.id) return;

    setLoadingComments(true);
    try {
      const response = await tasksApi.listComments(task.id);
      setComments(response.comments || []);
    } catch (error: any) {
      console.error("Failed to fetch comments:", error);
      toast.error("コメントの読み込みに失敗しました");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentAdded = () => {
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    await tasksApi.deleteComment(commentId);
    fetchComments();
  };

  if (!task) return null;

  const handleSave = async () => {
    if (!task) return;
    if (!editedTitle.trim()) {
      toast.error("タスク名を入力してください");
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
        assignedTo: editedAssignedTo || undefined,
        deadline: editedDeadline ? new Date(editedDeadline).toISOString() : undefined,
      };

      // Only include statusCode if user has permission to change it
      if (permissions.canChangeTaskStatus(task)) {
        updateData.statusCode = editedStatusCode;
      }

      await tasksApi.update(task.id, updateData);
      toast.success("タスクが更新されました");
      setIsEditMode(false);
      onTaskUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "タスクの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || "");
      setEditedStatusCode(task.statusCode);
      setEditedAssignedTo(task.assignedTo || "");
      setEditedDeadline(task.deadline ? task.deadline.split('T')[0] : "");
    }
    setIsEditMode(false);
  };

  const handleDuplicate = async () => {
    if (!task) return;

    setLoading(true);
    try {
      await tasksApi.duplicate(task.id);
      toast.success("タスクが複製されました");
      onTaskUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "タスクの複製に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getAssigneeInitials = (firstname?: string, lastname?: string) => {
    if (!firstname || !lastname) return "??";
    return `${firstname[0]}${lastname[0]}`.toUpperCase();
  };

  const getTaskTypeLabel = (typeCode?: number) => {
    if (!typeCode) return "";
    const taskType = Object.values(TaskType).find(t => t.code === typeCode);
    return taskType?.label || "";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isEditMode ? "タスク編集" : task.title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {/* Left side - Task Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select
                value={editedStatusCode.toString()}
                onValueChange={(value) => setEditedStatusCode(parseInt(value))}
                disabled={!isEditMode || !permissions.canChangeTaskStatus(task)}
              >
                <SelectTrigger className="w-[150px] bg-orange-50 border-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.HOLD.code.toString()}>{TaskStatus.HOLD.label}</SelectItem>
                  <SelectItem value={TaskStatus.TODO.code.toString()}>{TaskStatus.TODO.label}</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS.code.toString()}>{TaskStatus.IN_PROGRESS.label}</SelectItem>
                  <SelectItem value={TaskStatus.DONE.code.toString()}>{TaskStatus.DONE.label}</SelectItem>
                </SelectContent>
              </Select>
              {task.typeCode && (
                <div className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {getTaskTypeLabel(task.typeCode)}
                </div>
              )}
              <div className="ml-auto flex gap-2">
                {canEdit && !isEditMode && (
                  <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {isEditMode && (
                  <>
                    <Button variant="ghost" size="icon" onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {!isEditMode && (
                  <Button variant="ghost" size="icon" onClick={handleDuplicate} disabled={loading}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">タスク名</label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="タスク名"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">タスク詳細</label>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="タスク詳細"
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold mb-2">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.description || "説明なし"}</p>
              </div>
            )}

            {isEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">担当者</label>
                  <Select value={editedAssignedTo || "unassigned"} onValueChange={(value) => setEditedAssignedTo(value === "unassigned" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="担当者を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">未割り当て</SelectItem>
                      {projectMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstname} {member.lastname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">期限</label>
                  <Input
                    type="date"
                    value={editedDeadline}
                    onChange={(e) => setEditedDeadline(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {task.assignee && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-medium">
                      {getAssigneeInitials(task.assignee.firstname, task.assignee.lastname)}
                    </div>
                    <span className="text-sm">
                      {task.assignee.firstname} {task.assignee.lastname}
                    </span>
                  </>
                )}
                {task.deadline && (
                  <span className="ml-auto text-sm text-gray-500">
                    期限 {new Date(task.deadline).toLocaleDateString("ja-JP")}
                  </span>
                )}
              </div>
            )}

            <div>
              <h4 className="font-bold mb-2">画像</h4>
              <div className="bg-gray-200 rounded-lg p-8 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm">画像プレビュー</p>
                </div>
              </div>
              <Button variant="link" className="mt-2">
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            </div>
          </div>

          {/* Right side - Comments */}
          <div className="space-y-4">
            <h3 className="font-bold">コメント</h3>

            <CommentInput
              taskId={task.id}
              onCommentAdded={handleCommentAdded}
              projectMembers={projectMembers}
            />

            <div className="border-t pt-4">
              {loadingComments ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  読み込み中...
                </p>
              ) : (
                <CommentList
                  comments={comments}
                  onDeleteComment={handleDeleteComment}
                  currentUserId={user?.id || ""}
                  canDeleteAny={permissions.isProjectManagerOrAbove(task.projectId)}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
