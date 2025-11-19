"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import kyInstance from "@/lib/ky";

// Simple in-memory cache for link previews
const previewCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
import Link from "next/link";

interface LinkPreviewData {
    title: string;
    description: string;
    image: string;
    siteName: string;
    url: string;
}

interface LinkPreviewProps {
    url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
    const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                // Check cache first
                const cached = previewCache.get(url);
                if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                    setPreviewData(cached.data.metadata);
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                setError(null);
                
                const data = await kyInstance.get('/api/link-preview', {
                    searchParams: { url },
                    timeout: 5000, // 5 second timeout
                    retry: 1, // Only retry once
                }).json<{ success: boolean; metadata: LinkPreviewData }>();
                
                if (data.success && data.metadata) {
                    // Cache the result
                    previewCache.set(url, { data, timestamp: Date.now() });
                    setPreviewData(data.metadata);
                }
            } catch (err) {
                console.error("Error fetching link preview:", err);
                setError("Failed to load preview");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreview();
    }, [url]);

    if (error) return null;
    if (isLoading) {
        return (
            <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex gap-3 p-3">
                    <Skeleton className="h-[80px] w-[80px] shrink-0" />
                    <div className="flex-grow space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (!previewData) return null;

    return (
        <Link 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-accent/10"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex gap-3 p-3">
                {previewData.image && (
                    <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-md bg-accent/10">
                        <Image
                            src={previewData.image}
                            alt={previewData.title || "Link preview image"}
                            fill
                            className="object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    </div>
                )}
                <div className="flex-grow  overflow-hidden">
                    <h3 className="line-clamp-1 font-semibold">
                        {previewData.title || previewData.siteName}
                    </h3>
                    {previewData.description && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                            {previewData.description}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {previewData.siteName}
                    </p>
                </div>
            </div>
        </Link>
    );
}
