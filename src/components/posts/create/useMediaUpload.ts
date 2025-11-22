import { useToast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";

export interface Attachment {
    file: File;
    mediaId?: string;
    isUploading: boolean;
}

const MAX_IMAGE_COUNT = 5;
const MAX_VIDEO_COUNT = 2;
const MAX_TOTAL_ATTACHMENTS = 5;

export default function useMediaUpload() {
    const { toast } = useToast();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>();

    const { startUpload, isUploading } = useUploadThing("attachment", {
        onBeforeUploadBegin: (files) => {
            const renamedFiles = files.map((file) => {
                const extension = file.name.split('.').pop();
                return new File(
                    [file],
                    `attachment_${crypto.randomUUID()}.${extension}`,
                    {
                        type: file.type,
                    }
                );
            });
            setAttachments((prev) => [
                ...prev,
                ...renamedFiles.map((file) => ({ file, isUploading: true })),
            ]);
            return renamedFiles;
        },
        onUploadProgress: setUploadProgress,
        onClientUploadComplete(res) {
            setAttachments((prev) =>
                prev.map((a) => {
                    const uploadResult = res.find((r) => r.name === a.file.name);
                    if (!uploadResult) {
                        return a;
                    }
                    return {
                        ...a,
                        mediaId: uploadResult.serverData.mediaId,
                        isUploading: false,
                    };
                })
            );
        },
        onUploadError(e) {
            setAttachments((prev) => prev.filter((a) => !a.isUploading));
            toast({
                title: "Upload failed",
                description: e.message,
                variant: "destructive",
            });
        },
    });

    function handleStartUpload(files: File[]) {
        if (isUploading) {
            toast({
                title: "Upload in progress",
                description: "Please wait for the current upload to finish before starting a new one.",
                variant: "destructive",
            });
            return;
        }

        if (!files || files.length === 0) {
            toast({
                title: "No files selected",
                description: "Please select at least one file to upload.",
                variant: "destructive",
            });
            return;
        }

        const currentImages = attachments.filter((a) =>
            a.file.type.startsWith("image/")
        ).length;
        const currentVideos = attachments.filter((a) =>
            a.file.type.startsWith("video/")
        ).length;

        const newImages = files.filter((f) => f.type.startsWith("image/")).length;
        const newVideos = files.filter((f) => f.type.startsWith("video/")).length;

        if (attachments.length + files.length > MAX_TOTAL_ATTACHMENTS) {
            toast({
                title: "Too many attachments",
                description: `You can only attach up to ${MAX_TOTAL_ATTACHMENTS} files in total.`,
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

        const invalidFiles = files.filter(
            (f) => !f.type.startsWith("image/") && !f.type.startsWith("video/")
        );
        if (invalidFiles.length > 0) {
            toast({
                title: "Invalid file type",
                description: "Please only upload images or videos.",
                variant: "destructive",
            });
            return;
        }

        startUpload(files);
    }

    function removeAttachment(fileName: string) {
        setAttachments((prev) => prev.filter((a) => a.file.name !== fileName));
    }   

    function reset() {
        setAttachments([]);
        setUploadProgress(undefined);
    }

    return {
        startUpload: handleStartUpload,
        attachments,
        isUploading,
        uploadProgress,
        removeAttachment,
        reset,
    };
}