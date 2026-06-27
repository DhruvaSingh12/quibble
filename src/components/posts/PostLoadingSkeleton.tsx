import { Skeleton } from "@/components/ui/Skeleton"

export default function PostsLoadingSkeleton() {
   return (
    <div className="flex w-full flex-col">
        <PostLoadingSkeleton />
        <PostLoadingSkeleton />
        <PostLoadingSkeleton />
    </div>
   )
}

export function PostLoadingSkeleton() {
  return (
    <div className="p-3 lg:p-6 border-b border-border last:border-0">
      <div className="flex flex-col justify-between gap-3">
        
        {/* User Info & Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-[50px] rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="size-8 rounded-md opacity-50" />
        </div>

        {/* Text Content Skeleton */}
        <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-[90%] rounded" />
            <Skeleton className="h-4 w-[75%] rounded" />
        </div>

        {/* Reaction bar skeleton */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50 mt-1">
          <Skeleton className="h-5 w-10 rounded opacity-70" />
          <Skeleton className="h-5 w-10 rounded opacity-70" />
          <Skeleton className="h-5 w-10 rounded opacity-70" />
          <Skeleton className="h-5 w-5 rounded opacity-70" />
        </div>

      </div>
    </div>
  )
}