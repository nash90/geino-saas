import { useState, useEffect } from "react";
import { Download, FileText, FileImage, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadsApi } from "@/api/uploads";
import type { Attachment } from "@/types/entities";

interface FilePreviewProps {
  attachments: Attachment[];
  onDelete?: (attachmentId: string) => void;
  canDelete?: boolean;
}

export function FilePreview({ attachments, onDelete, canDelete = false }: FilePreviewProps) {
  if (attachments.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm">画像プレビュー</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.id}
          attachment={attachment}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onDelete,
  canDelete,
}: {
  attachment: Attachment;
  onDelete?: (attachmentId: string) => void;
  canDelete: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage = attachment.mimeType?.startsWith("image/") || false;

  // Load image preview if it's an image
  useEffect(() => {
    if (isImage) {
      setLoading(true);
      uploadsApi
        .getDownloadUrl(attachment.id)
        .then((url) => {
          setPreviewUrl(url);
        })
        .catch((error) => {
          console.error("Failed to load preview:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [attachment.id, isImage]);

  const handleDownload = () => {
    uploadsApi.downloadAttachment(attachment.id, attachment.fileName);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(attachment.id);
    }
  };

  // Render image preview
  if (isImage) {
    return (
      <div className="space-y-2">
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-sm">読み込み中...</p>
              </div>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={attachment.fileName}
              className="w-full h-auto max-h-96 object-contain"
            />
          ) : (
            <div className="p-8 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <FileImage className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">{attachment.fileName}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="link" size="sm" onClick={handleDownload} className="p-0 h-auto">
            <Download className="h-4 w-4 mr-2" />
            ダウンロード
          </Button>
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600">
              削除
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Render file icon for non-images
  const getFileIcon = () => {
    const mimeType = attachment.mimeType || "";
    if (mimeType.includes("pdf")) {
      return <FileText className="h-12 w-12 text-red-500" />;
    }
    if (mimeType.includes("text")) {
      return <FileText className="h-12 w-12 text-blue-500" />;
    }
    return <FileIcon className="h-12 w-12 text-gray-500" />;
  };

  return (
    <div className="space-y-2">
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center">
          {getFileIcon()}
          <p className="text-sm text-gray-600 mt-2">{attachment.fileName}</p>
          <p className="text-xs text-gray-400">
            {attachment.fileSize ? (attachment.fileSize / 1024).toFixed(1) + " KB" : "Unknown size"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="link" size="sm" onClick={handleDownload} className="p-0 h-auto">
          <Download className="h-4 w-4 mr-2" />
          ダウンロード
        </Button>
        {canDelete && (
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600">
            削除
          </Button>
        )}
      </div>
    </div>
  );
}
