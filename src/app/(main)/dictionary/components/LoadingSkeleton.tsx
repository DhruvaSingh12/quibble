import { Skeleton } from "@/components/ui/Skeleton";

export default function DictionaryLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full items-center w-full p-5 space-y-5">
      <div className="w-full max-w-2xl">
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <div className="flex justify-center space-x-4">
        <Skeleton className="h-8 w-20 rounded" />
        <Skeleton className="h-8 w-20 rounded" />
        <Skeleton className="h-8 w-20 rounded" />
        <Skeleton className="h-8 w-20 rounded" />
      </div>
      <div className="w-full max-w-4xl bg-card p-5 rounded-2xl shadow-lg space-y-4 animate-pulse">
        <Skeleton className="h-6 w-1/4 mx-auto rounded" />

        <div className="flex justify-center space-x-3">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/2 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/4 rounded" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
