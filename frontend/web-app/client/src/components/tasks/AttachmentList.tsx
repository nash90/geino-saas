import { useState } from "react";
import { Download, Trash2, FileText, FileImage, FileAudio, FileVideo, File } from "lucide-react";
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
import { toast } from "sonner";
import { uploadsApi } from "@/api/uploads";
import { formatFileSize, getFileIconType, isImageFile } from "@/lib/fileUtils";
import type { Attachment } from "@/types/entities";
import { MESSAGES } from "@/constants/messages";

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (attachmentId: string) => Promise<void>;
  canDelete: boolean;
}

export function AttachmentList({ attachments, onDelete, canDelete }: AttachmentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      setDownloading(attachment.id);
      await uploadsApi.downloadAttachment(attachment.id, attachment.fileName);
      toast.success(MESSAGES.FILE.FILE_DOWNLOADED_SUCCESS);
    } catch (error: any) {
      toast.error(error.response?.data?.error || MESSAGES.FILE.FILE_DOWNLOAD_FAILED);
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteClick = (attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attachmentToDelete || !onDelete) return;

    try {
      setDeleting(attachmentToDelete);
      await onDelete(attachmentToDelete);
      toast.success(MESSAGES.FILE.FILE_DELETED_SUCCESS);
    } catch (error: any) {
      toast.error(error.response?.data?.error || MESSAGES.FILE.FILE_DELETE_FAILED);
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const getFileIcon = (iconType: string) => {
    const iconClass = "h-4 w-4";
    switch (iconType) {
      case "image":
        return <FileImage className={iconClass} />;
      case "audio":
        return <FileAudio className={iconClass} />;
      case "video":
        return <FileVideo className={iconClass} />;
      case "document":
        return <FileText className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => {
          const iconType = getFileIconType(attachment.mimeType || "");
          const isImage = isImageFile(attachment.mimeType || "");

          return (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 text-gray-600">
                {getFileIcon(iconType)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.fileName}
                </p>
                {attachment.fileSize && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  disabled={downloading === attachment.id}
                  title="ダウンロード"
                >
                  <Download className="h-4 w-4" />
                </Button>

                {canDelete && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(attachment.id)}
                    disabled={deleting === attachment.id}
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
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
            <AlertDialogTitle>ファイルを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。ファイルは完全に削除されます。
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
