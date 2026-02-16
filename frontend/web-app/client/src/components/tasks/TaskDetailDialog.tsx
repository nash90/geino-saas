import { useState, useEffect, useRef } from "react";
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
import { Edit, Copy, Save, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { tasksApi } from "@/api/tasks";
import { uploadsApi } from "@/api/uploads";
import type { TaskWithComments, TaskCommentWithUser } from "@/types/entities";
import { TaskStatus, TaskType } from "@/types/entities";
import { usePermissions } from "@/hooks/usePermissions";
import { CommentList } from "./CommentList";
import { toLocalDateTimeString, formatDateTime } from "@/lib/date-utils";
import { CommentInput } from "./CommentInput";
import { AttachmentUpload } from "./AttachmentUpload";
import { FilePreview } from "./FilePreview";
import { useAuth } from "@/contexts/AuthContext";
import { validateDateTimeInput, validateDeadlineValue } from "@/lib/validation/dateValidation";
import { MESSAGES } from "@/constants/messages";
import { handleApiError } from "@/lib/errorHandler";

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
  const deadlineInputRef = useRef<HTMLInputElement>(null);

  // Initialize edit form when task changes
  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || "");
      setEditedStatusCode(task.statusCode);
      setEditedAssignedTo(task.assignedTo || "");
      setEditedDeadline(task.deadline ? toLocalDateTimeString(task.deadline) : "");
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
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      handleApiError(error, MESSAGES.COMMENT.COMMENT_LOAD_FAILED);
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
      toast.error(MESSAGES.TASK.TASK_TITLE_REQUIRED);
      return;
    }

    // Validate deadline using input element if available (format validation only)
    if (!editedDeadline && deadlineInputRef.current) {
      const inputValidation = validateDateTimeInput(deadlineInputRef.current, false);
      if (!inputValidation.valid && !inputValidation.isEmpty) {
        toast.error(inputValidation.error || MESSAGES.VALIDATION.DEADLINE_INVALID);
        return;
      }
    }

    // Validate deadline value with business logic (allow past dates for updates)
    if (editedDeadline) {
      const deadlineValidation = validateDeadlineValue(editedDeadline, true); // Allow past for updates
      if (!deadlineValidation.valid) {
        toast.error(deadlineValidation.error || MESSAGES.VALIDATION.DEADLINE_INVALID);
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: any = {
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
        assignedTo: editedAssignedTo || undefined,
        deadline: editedDeadline ? new Date(editedDeadline).toISOString() : null,
      };

      // Only include statusCode if user has permission to change it
      if (permissions.canChangeTaskStatus(task)) {
        updateData.statusCode = editedStatusCode;
      }

      await tasksApi.update(task.id, updateData);
      toast.success(MESSAGES.TASK.TASK_UPDATED_SUCCESS);
      setIsEditMode(false);
      onTaskUpdated();
    } catch (error) {
      handleApiError(error, MESSAGES.TASK.TASK_UPDATE_FAILED);
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
      setEditedDeadline(task.deadline ? toLocalDateTimeString(task.deadline) : "");
    }
    setIsEditMode(false);
  };

  const handleDuplicate = async () => {
    if (!task) return;

    setLoading(true);
    try {
      await tasksApi.duplicate(task.id);
      toast.success(MESSAGES.TASK.TASK_DUPLICATED_SUCCESS);
      onTaskUpdated();
      onClose();
    } catch (error) {
      handleApiError(error, MESSAGES.TASK.TASK_DUPLICATE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const getAssigneeInitials = (firstname?: string, lastname?: string) => {
    if (!firstname || !lastname) return "??";
    return `${lastname[0]}${firstname[0]}`.toUpperCase();
  };

  const getTaskTypeLabel = (typeCode?: number) => {
    if (!typeCode) return "";
    const taskType = Object.values(TaskType).find(t => t.code === typeCode);
    return taskType?.label || "";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
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
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      保存
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      キャンセル
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
                          {member.lastname} {member.firstname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">期限</label>
                  <Input
                    ref={deadlineInputRef}
                    type="datetime-local"
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
                      {task.assignee.lastname} {task.assignee.firstname}
                    </span>
                  </>
                )}
                {task.deadline && (
                  <span className="ml-auto text-sm text-gray-500">
                    期限 {formatDateTime(task.deadline)}
                  </span>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">画像</h4>
                <AttachmentUpload
                  taskId={task.id}
                  onUploadComplete={onTaskUpdated}
                  buttonText="ファイル追加"
                  buttonVariant="outline"
                />
              </div>
              <FilePreview
                attachments={task.attachments || []}
                onDelete={async (attachmentId) => {
                  try {
                    await uploadsApi.deleteAttachment(attachmentId);
                    toast.success(MESSAGES.FILE.FILE_DELETED_SUCCESS);
                    onTaskUpdated();
                  } catch (error) {
                    handleApiError(error, MESSAGES.FILE.FILE_DELETE_FAILED);
                  }
                }}
                canDelete={canEdit}
              />
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
                  onRefresh={fetchComments}
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
