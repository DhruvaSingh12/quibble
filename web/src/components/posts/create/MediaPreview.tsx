import { Attachment } from "./useMediaUpload";
import { Film, Loader2, X, Plus } from "lucide-react";

interface MediaPreviewProps {
  attachments: Attachment[];
  isUploading: boolean;
  isProcessing: boolean;
  uploadProgress?: number;
  onRemove: (fileName: string) => void;
  onAddMore: () => void;
}

export default function MediaPreview({
  attachments,
  isUploading,
  isProcessing,
  onRemove,
  onAddMore,
}: MediaPreviewProps) {
  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };


  return (
    <div className="space-y-3 h-full flex flex-col min-h-0">

      <div className="grid grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2 gap-2 h-full flex-1 min-h-0 w-full overflow-hidden p-1">
        {attachments.map((attachment) => (
          <div
            key={attachment.file.name}
            className="group relative w-full h-full overflow-hidden rounded-lg border bg-muted"
          >
            {attachment.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.previewUrl}
                alt="Upload preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="relative h-full w-full flex items-center justify-center bg-foreground/5">
                {attachment.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.thumbnail}
                    alt="Video thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Film className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/50 backdrop-blur-[1px]">
                    <Film className="h-5 w-5 text-background" />
                  </div>
                </div>
                {attachment.duration && (
                  <div className="absolute bottom-2 right-2 rounded bg-foreground/75 px-1.5 py-0.5 text-[10px] text-background">
                    {formatDuration(attachment.duration)}
                  </div>
                )}
              </div>
            )}

            {/* Uploading overlay */}
            {attachment.isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-[1px]">
                <Loader2 className="h-6 w-6 animate-spin text-background" />
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => onRemove(attachment.file.name)}
              className="absolute right-2 top-2 rounded-full bg-foreground/60 p-1.5 text-background opacity-0 transition-opacity group-hover:opacity-100 hover:bg-foreground/80 z-10"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* Add more button as grid item */}
        {attachments.length < 5 && (
          <button
            onClick={onAddMore}
            disabled={isUploading || isProcessing}
            className="flex w-full h-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 bg-muted/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
            <span className="text-[11px] font-medium text-center leading-tight">
              {isProcessing ? "Processing..." : <>Add<br />Media</>}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
