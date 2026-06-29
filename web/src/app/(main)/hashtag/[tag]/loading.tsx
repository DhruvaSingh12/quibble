import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="w-full max-w-3xl mx-auto min-h-screen py-[9px]">
            <div className="w-full bg-card rounded-lg mb-4 p-6 shadow-sm">
                <Skeleton className="h-9 w-64 mb-3" />
                <Skeleton className="h-5 w-96" />
            </div>
            
            <div className="space-y-6 w-full">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="w-full h-40 rounded-lg" />
                ))}
            </div>
        </div>
    );
}
