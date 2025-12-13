import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { tasksApi } from "@/api/tasks";
import { MentionTextarea } from "./MentionTextarea";
import { AttachmentUpload } from "./AttachmentUpload";
import { AttachmentList } from "./AttachmentList";
import type { Attachment } from "@/types/entities";

interface CommentInputProps {
  taskId: string;
  onCommentAdded: () => void;
  projectMembers: Array<{
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  }>;
}

export function CommentInput({
  taskId,
  onCommentAdded,
  projectMembers,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && pendingAttachments.length === 0) {
      toast.error("コメントまたはファイルを入力してください");
      return;
    }

    setSubmitting(true);
    try {
      // Create comment with attachments
      await tasksApi.addComment(taskId, {
        content: content.trim() || "(ファイルのみ)",
        attachmentIds: pendingAttachments.map((a) => a.id),
      });

      // Clear form
      setContent("");
      setPendingAttachments([]);

      toast.success("コメントを追加しました");
      onCommentAdded();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "コメントの追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentUpload = (attachment: Attachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  };

  const handleRemovePendingAttachment = async (attachmentId: string) => {
    // Remove from UI immediately
    setPendingAttachments((prev) =>
      prev.filter((a) => a.id !== attachmentId)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div onKeyDown={handleKeyDown}>
        <MentionTextarea
          value={content}
          onChange={setContent}
          placeholder="@メンションでユーザーを指定できます"
          rows={3}
          projectMembers={projectMembers}
          disabled={submitting}
        />
      </div>

      {pendingAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">添付ファイル:</p>
          <AttachmentList
            attachments={pendingAttachments}
            onDelete={handleRemovePendingAttachment}
            canDelete={true}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <AttachmentUpload
          taskId={taskId}
          onUploadComplete={handleAttachmentUpload}
          buttonText="ファイル添付"
          buttonVariant="outline"
        />

        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "送信中..." : "送信"}
        </Button>

        {content && !submitting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setContent("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Ctrl+Enterで送信
      </p>
    </div>
  );
}
