import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AttachmentList } from "./AttachmentList";
import { uploadsApi } from "@/api/uploads";
import { toast } from "sonner";
import { formatMentionsForDisplay } from "@/lib/mentionUtils";
import type { TaskCommentWithUser } from "@/types/entities";

interface CommentListProps {
  comments: TaskCommentWithUser[];
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string;
  canDeleteAny: boolean; // PM or above
}

export function CommentList({
  comments,
  onDeleteComment,
  currentUserId,
  canDeleteAny,
}: CommentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">まだコメントがありません</p>
      </div>
    );
  }

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;

    setDeleting(true);
    try {
      await onDeleteComment(commentToDelete);
      toast.success("コメントを削除しました");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "削除に失敗しました");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await uploadsApi.deleteAttachment(attachmentId);
      // Parent component should refresh comments to reflect deletion
      return Promise.resolve();
    } catch (error) {
      throw error;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <div className="space-y-4">
        {comments.map((comment) => {
          const canDelete =
            canDeleteAny || comment.userId === currentUserId;

          return (
            <div key={comment.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-medium">
                  {getInitials(comment.user.firstname, comment.user.lastname)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {comment.user.firstname} {comment.user.lastname}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(comment.createdAt)}
                      </p>
                    </div>

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(comment.id)}
                        disabled={deleting}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {formatMentionsForDisplay(comment.content)}
                  </p>
                </div>

                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2">
                    <AttachmentList
                      attachments={comment.attachments}
                      onDelete={handleDeleteAttachment}
                      canDelete={canDelete}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>コメントを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。コメントとその添付ファイルは完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
