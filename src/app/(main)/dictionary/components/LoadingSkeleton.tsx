import { Skeleton } from "@/components/ui/Skeleton";

export default function DictionaryLoadingSkeleton() {
  return (
    <div className="bg-card rounded-b-2xl w-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 sm:h-7 w-32 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-16 sm:w-20 ml-4 flex-shrink-0" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Tabs */}
        <div className="flex bg-muted/30 rounded-lg mb-4 sm:mb-6">
          <Skeleton className="h-8 flex-1 rounded-md m-1" />
          <Skeleton className="h-8 flex-1 rounded-md m-1" />
        </div>

        {/* Content sections */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <Skeleton className="h-3 sm:h-4 w-16 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-3 sm:h-4 w-full" />
              <Skeleton className="h-3 sm:h-4 w-3/4" />
            </div>
          </div>
          
          <div>
            <Skeleton className="h-3 sm:h-4 w-12 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-3 sm:h-4 w-full" />
              <Skeleton className="h-3 sm:h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
