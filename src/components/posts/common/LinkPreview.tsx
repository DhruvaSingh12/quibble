"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import kyInstance from "@/lib/ky";
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
    const { data: previewData, isLoading, isError } = useQuery({
        queryKey: ["link-preview", url],
        queryFn: async () => {
            const data = await kyInstance.get('/api/link-preview', {
                searchParams: { url },
                timeout: 8000,
                retry: 1,
            }).json<{ success: boolean; metadata: LinkPreviewData }>();

            if (data.success && data.metadata) {
                return data.metadata;
            }
            return null;
        },
        staleTime: 1000 * 60 * 60, // 1 hour cache
        gcTime: 1000 * 60 * 60 * 2, // 2 hour garbage collection
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isError) return null;
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
                {previewData.image && previewData.image.startsWith('http') && (
                    <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-accent/10">
                        <Image
                            src={previewData.image}
                            alt={previewData.title || "Link preview image"}
                            fill
                            sizes="80px"
                            unoptimized
                            className="object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    </div>
                )}
                <div className="flex-grow overflow-hidden">
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
