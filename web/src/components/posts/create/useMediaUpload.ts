import { useToast } from "@/components/ui/use-toast";
import { uploadFiles } from "@/lib/uploadthing";
import { processFile, ProcessedFile } from "@/lib/media-utils";
import { useState, useCallback } from "react";

export interface Attachment {
  file: File;
  uploadedUrl?: string;
  isUploading: boolean;
  type: "image" | "video";
  thumbnail?: string; // data URL for video thumbnails
  duration?: number; // video duration in seconds
  previewUrl: string; // object URL for image previews
}

const MAX_IMAGE_COUNT = 5;
const MAX_VIDEO_COUNT = 2;
const MAX_TOTAL_ATTACHMENTS = 5;

export default function useMediaUpload() {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleStartUpload = useCallback(
    async (files: File[]) => {
      if (isUploading || isProcessing) {
        toast({
          title: "Upload in progress",
          description: "Please wait for the current upload to finish.",
          variant: "destructive",
        });
        return;
      }

      if (!files || files.length === 0) return;

      const currentImages = attachments.filter(
        (a) => a.type === "image",
      ).length;
      const currentVideos = attachments.filter(
        (a) => a.type === "video",
      ).length;

      const newImages = files.filter(
        (f) => f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".heic") || f.name.toLowerCase().endsWith(".heif"),
      ).length;
      const newVideos = files.filter((f) =>
        f.type.startsWith("video/"),
      ).length;

      if (attachments.length + files.length > MAX_TOTAL_ATTACHMENTS) {
        toast({
          title: "Too many attachments",
          description: `You can only attach up to ${MAX_TOTAL_ATTACHMENTS} files.`,
          variant: "destructive",
        });
        return;
      }

      if (currentImages + newImages > MAX_IMAGE_COUNT) {
        toast({
          title: "Too many images",
          description: `You can only attach up to ${MAX_IMAGE_COUNT} images.`,
          variant: "destructive",
        });
        return;
      }

      if (currentVideos + newVideos > MAX_VIDEO_COUNT) {
        toast({
          title: "Too many videos",
          description: `You can only attach up to ${MAX_VIDEO_COUNT} videos.`,
          variant: "destructive",
        });
        return;
      }

      // Process files client-side (compress images, validate videos)
      setIsProcessing(true);
      const processed: ProcessedFile[] = [];

      for (const file of files) {
        try {
          const result = await processFile(file);
          // Rename file uniquely to ensure reliable mapping in onClientUploadComplete
          const ext = result.file.name.split(".").pop();
          const uniqueName = `attachment_${crypto.randomUUID()}.${ext}`;
          result.file = new File([result.file], uniqueName, { type: result.file.type });
          processed.push(result);
        } catch (error) {
          toast({
            title: "File processing failed",
            description:
              error instanceof Error
                ? error.message
                : "Failed to process file.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

      // Create preview attachments
      const newAttachments: Attachment[] = processed.map((p) => ({
        file: p.file,
        isUploading: true,
        type: p.type,
        thumbnail: p.thumbnail,
        duration: p.duration,
        previewUrl:
          p.type === "image"
            ? URL.createObjectURL(p.file)
            : p.thumbnail || "",
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
      setIsProcessing(false);
      setIsUploading(true);

      try {
        console.log("[UploadThing] Starting client upload for processed files:", processed.map(p => p.file.name));
        const res = await uploadFiles("attachment", {
          files: processed.map((p) => p.file),
          onUploadProgress: ({ file, progress }) => {
            console.log(`[UploadThing] Progress for ${file}: ${progress}%`);
            setUploadProgress(progress);
          },
        });

        console.log("[UploadThing] Client upload completed with response:", res.map(r => r.name));
        setAttachments((prev) => {
          console.log("[UploadThing] Previous attachments state:", prev);
          const updated = prev.map((a, index) => {
            let uploadResult = res.find((r) => r.name === a.file.name);
            // Fallback to array order if name was somehow modified
            if (!uploadResult && res.length === prev.length) {
                uploadResult = res[index];
            }
            console.log(`[UploadThing] Matching ${a.file.name} to uploadResult:`, uploadResult?.name);
            if (!uploadResult) return a;
            return {
              ...a,
              uploadedUrl: uploadResult.ufsUrl,
              isUploading: false,
            };
          });
          console.log("[UploadThing] Updated attachments state:", updated);
          return updated;
        });
      } catch (e: any) {
        console.error("[UploadThing] Client upload error:", e);
        setAttachments((prev) => prev.filter((a) => !a.isUploading));
        toast({
          title: "Upload failed",
          description: e.message || "Something went wrong during upload.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [attachments, isProcessing, isUploading, toast],
  );

  const removeAttachment = useCallback((fileName: string) => {
    setAttachments((prev) => {
      const toRemove = prev.find((a) => a.file.name === fileName);
      if (toRemove?.previewUrl) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((a) => a.file.name !== fileName);
    });
  }, []);

  const reset = useCallback(() => {
    // Clean up object URLs
    attachments.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    setAttachments([]);
    setUploadProgress(undefined);
    setIsUploading(false);
  }, [attachments]);

  return {
    startUpload: handleStartUpload,
    attachments,
    isUploading,
    isProcessing,
    uploadProgress,
    removeAttachment,
    reset,
  };
}