import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadsApi } from "@/api/uploads";
import { getFileValidationError, formatFileSize } from "@/lib/fileUtils";
import type { Attachment } from "@/types/entities";
import { MESSAGES } from "@/constants/messages";

interface AttachmentUploadProps {
  taskId?: string;
  commentId?: string;
  onUploadComplete: (attachment: Attachment) => void;
  maxSizeMB?: number;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost";
}

export function AttachmentUpload({
  taskId,
  commentId,
  onUploadComplete,
  maxSizeMB = 25,
  buttonText = "ファイル添付",
  buttonVariant = "outline",
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Validate file
    const validationError = getFileValidationError(file, maxSizeMB);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Upload file
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setCurrentFile(file.name);

    try {
      // Step 1: Generate pre-signed upload URL from backend
      const { uploadId, uploadUrl, fileKey } = await uploadsApi.generateUploadUrl({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        taskId,
        commentId,
      });

      // Step 2: Upload file directly to R2 using pre-signed URL
      await uploadsApi.uploadFile(uploadUrl, file, (progressPercent) => {
        setProgress(progressPercent);
      });

      // Step 3: Confirm upload and create attachment record
      const attachment = await uploadsApi.confirmUpload({
        uploadId,
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        taskId,
        commentId,
      });

      setProgress(100);
      toast.success(MESSAGES.FILE.FILE_UPLOADED_SUCCESS);
      onUploadComplete(attachment);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || MESSAGES.FILE.FILE_UPLOAD_FAILED);
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentFile(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        onClick={handleButtonClick}
        disabled={uploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "アップロード中..." : buttonText}
      </Button>

      {uploading && currentFile && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 truncate flex-1">{currentFile}</span>
            <span className="text-gray-500 ml-2">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
