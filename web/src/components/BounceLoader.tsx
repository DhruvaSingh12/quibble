import { cn } from "@/lib/utils";

interface BounceLoaderProps {
    className?: string;
}

export default function BounceLoader({ className }: BounceLoaderProps) {
    return (
        <div className={cn("flex justify-center items-center w-full min-h-[50vh]", className)}>
            <div className="flex space-x-2">
                <div className="w-3.5 h-3.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3.5 h-3.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-3.5 h-3.5 bg-primary rounded-full animate-bounce"></div>
            </div>
        </div>
    );
}
