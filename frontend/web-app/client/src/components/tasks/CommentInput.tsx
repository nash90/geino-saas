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
    <div className="space-y-2">
      {/* Comment textarea - full width */}
      <div onKeyDown={handleKeyDown}>
        <MentionTextarea
          value={content}
          onChange={setContent}
          placeholder="@コメント入力"
          rows={3}
          projectMembers={projectMembers}
          disabled={submitting}
        />
      </div>

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <AttachmentList
          attachments={pendingAttachments}
          onDelete={handleRemovePendingAttachment}
          canDelete={true}
        />
      )}

      {/* Upload and Send buttons */}
      <div className="flex gap-2">
        <AttachmentUpload
          taskId={taskId}
          onUploadComplete={handleAttachmentUpload}
          buttonText="アップロード"
          buttonVariant="outline"
        />
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "送信中..." : "送信"}
        </Button>
      </div>
    </div>
  );
}
