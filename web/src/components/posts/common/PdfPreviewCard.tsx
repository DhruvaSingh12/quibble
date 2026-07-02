"use client";

import { FileText, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { FaFolderOpen } from "react-icons/fa";

interface PdfPreviewCardProps {
  url: string;
  className?: string;
  hideDownload?: boolean;
}

export default function PdfPreviewCard({ url, className, hideDownload = false }: PdfPreviewCardProps) {
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const text = new TextDecoder().decode(buffer);
        // Look for the standard PDF page count metadata
        const match = text.match(/\/Count\s+(\d+)/);
        if (match) {
          setPageCount(parseInt(match[1], 10));
        } else {
          // Fallback: count individual page objects
          const matches = text.match(/\/Type\s*\/Page\b/g);
          if (matches) setPageCount(matches.length);
        }
      })
      .catch(() => { });
  }, [url]);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-border bg-white aspect-square block",
      className
    )}>
      <div className="absolute inset-0 bg-white">
        <embed
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          type="application/pdf"
          className="absolute border-none outline-none pointer-events-none bg-white"
          style={{
            width: "calc(100% + 40px)",
            height: "calc(100% + 20px)",
            top: "-10px",
            left: "-10px",
          }}
        />

        {/* Fallback icon in case embed fails */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 bg-muted/20">
          <FileText className="w-12 h-12 text-muted-foreground/20" />
        </div>
      </div>

      {/* Footer Overlay (Always visible inside the square) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-3 px-3 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 text-white/90">
          <span className="text-xs font-semibold tracking-wide">
            {pageCount ? `${pageCount} Page${pageCount !== 1 ? 's' : ''}` : "PDF"}
          </span>
        </div>

        {!hideDownload && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={url}
              target="_blank"
              className="text-white hover:bg-white/20 rounded-full p-1"
              title="Open PDF"
              onClick={(e) => e.stopPropagation()}
            >
              <FaFolderOpen className="w-4 h-4" />
            </Link>
            <Link
              href={url}
              target="_blank"
              download
              className="text-white hover:bg-white/20 rounded-full p-1"
              title="Download PDF"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
