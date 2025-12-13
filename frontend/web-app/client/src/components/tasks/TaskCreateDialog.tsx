import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { tasksApi } from "@/api/tasks";
import type { CreateTaskRequest } from "@/types/api";
import { TaskStatus } from "@/types/entities";

interface TaskCreateDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  statusCode?: number;
  projectMembers: Array<{ id: string; email: string; firstname: string; lastname: string }>;
  onTaskCreated: () => void;
  canCreateAnyStatus: boolean;
}

export function TaskCreateDialog({
  open,
  onClose,
  projectId,
  statusCode,
  projectMembers,
  onTaskCreated,
}: TaskCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("1");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("タスク名を入力してください");
      return;
    }

    setLoading(true);
    try {
      const data: CreateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        statusCode: statusCode || TaskStatus.TODO.code,
        typeCode: parseInt(taskType),
        assignedTo: assignedTo || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      };

      await tasksApi.create(projectId, data);
      toast.success("タスクが作成されました");
      onTaskCreated();
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "タスクの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTaskType("1");
    setAssignedTo("");
    setDeadline("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新規タスク作成</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>タスク名</Label>
            <Input
              placeholder="タイトルテキストが入ります"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>タスク種別</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger>
                <SelectValue placeholder="種別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">タスク種別A</SelectItem>
                <SelectItem value="2">タスク種別B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>担当者</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="ユーザー名" />
              </SelectTrigger>
              <SelectContent>
                {projectMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.firstname} {member.lastname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>タスク詳細</Label>
            <Textarea
              placeholder="ここにタスク詳細が入ります"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* File upload will be available after task creation in the detail view */}

          <div>
            <Label>期限設定</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="期限入力"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeadline("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? "作成中..." : "作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
