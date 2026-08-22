"use client";

import { RefreshCcw } from "lucide-react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isGateway = error.message?.includes("GATEWAY_TIMEOUT");

  return (
    <div className="relative flex h-full w-full min-h-[50vh] flex-col items-center justify-center overflow-hidden bg-card text-card-foreground">
      {/* Center Content */}
      <div className="z-10 flex flex-col items-center justify-center space-y-6 text-center px-4 mt-[-10vh]">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {isGateway ? "Server is Waking Up" : "Something went wrong."}
        </h1>
        <p className="max-w-95 text-sm md:text-[15px] text-muted-foreground leading-relaxed">
          {isGateway
            ? "It usually takes about 30 seconds to wake back up. Please give it a moment and retry!"
            : "An unexpected error occurred while loading this page. We're looking into it."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95 shadow-sm"
        >
          <RefreshCcw className="h-4 w-4 transition-transform group-hover:rotate-180" />
          Try Again
        </button>
      </div>

      {/* Giant Bottom Text */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none select-none translate-y-[28%] md:translate-y-[25%] opacity-100">
        <div className="relative">
          <h2 className="text-[28vw] md:text-[22vw] lg:text-[250px] font-black leading-none tracking-tighter text-foreground whitespace-nowrap">
            {isGateway ? "Five04" : "Five00"}
          </h2>
        </div>
      </div>
    </div>
  );
}
