import Image from "next/image";
import { X } from "lucide-react";

interface GifPreviewProps {
  url: string;
  onRemove: () => void;
}

export default function GifPreview({ url, onRemove }: GifPreviewProps) {
  return (
    <div className="space-y-3 h-full flex flex-col min-h-0">
      <div className="relative rounded-lg overflow-hidden bg-card border flex-1 flex items-center justify-center p-2 min-h-0">
        <Image
          src={url}
          alt="Selected GIF"
          width={500}
          height={220}
          className="max-h-full h-full max-w-full object-contain rounded-md"
          unoptimized
        />
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors bg-background/80 shadow"
          title="Remove GIF"
        >
          <X className="text-foreground h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
