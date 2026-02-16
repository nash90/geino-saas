import { useState } from "react";
import { Trash2, X as XIcon } from "lucide-react";
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
import { uploadsApi } from "@/api/uploads";
import { toast } from "sonner";
import { formatMentionsForDisplay } from "@/lib/mentionUtils";
import type { TaskCommentWithUser } from "@/types/entities";
import { MESSAGES } from "@/constants/messages";
import { handleApiError } from "@/lib/errorHandler";
import { OPERATION_ERROR_MESSAGES } from "@/constants/errorMessages";

interface CommentListProps {
  comments: TaskCommentWithUser[];
  onDeleteComment: (commentId: string) => Promise<void>;
  onRefresh?: () => void; // Callback to refresh comments after attachment deletion
  currentUserId: string;
  canDeleteAny: boolean; // PM or above
}

export function CommentList({
  comments,
  onDeleteComment,
  onRefresh,
  currentUserId,
  canDeleteAny,
}: CommentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);

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
      toast.success(MESSAGES.COMMENT.COMMENT_DELETED_SUCCESS);
    } catch (error) {
      handleApiError(error, OPERATION_ERROR_MESSAGES.COMMENT_DELETE_FAILED);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setDeletingAttachment(attachmentId);
    try {
      await uploadsApi.deleteAttachment(attachmentId);
      toast.success(MESSAGES.FILE.ATTACHMENT_DELETED_SUCCESS);
      // Refresh comments to reflect deletion
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      handleApiError(error, OPERATION_ERROR_MESSAGES.ATTACHMENT_DELETE_FAILED);
    } finally {
      setDeletingAttachment(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  const getInitials = (firstname: string, lastname: string) => {
    return `${lastname.charAt(0)}${firstname.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <div className="space-y-4">
        {comments.map((comment) => {
          const canDelete =
            canDeleteAny || comment.userId === currentUserId;

          return (
            <div key={comment.id} className="border-b pb-3">
              {/* Timestamp at top */}
              <div className="text-xs text-gray-500 mb-1">{formatTimestamp(comment.createdAt)}</div>

              {/* Avatar and content */}
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-medium flex-shrink-0">
                  {getInitials(comment.user.firstname, comment.user.lastname)}
                </div>

                <div className="flex-1">
                  {/* Comment text */}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {formatMentionsForDisplay(comment.content)}
                  </p>

                  {/* Attachments with inline delete */}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {comment.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-1">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={() => uploadsApi.downloadAttachment(attachment.id, attachment.fileName)}
                          >
                            {attachment.fileName}
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              disabled={deletingAttachment === attachment.id}
                              className="h-4 w-4 p-0"
                            >
                              <XIcon className="h-3 w-3 text-gray-400 hover:text-red-600" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(comment.id)}
                    disabled={deleting}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                  </Button>
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
