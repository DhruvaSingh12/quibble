import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-card text-card-foreground">

      {/* Center Content */}
      <div className="z-10 flex flex-col items-center justify-center space-y-6 text-center px-4 mt-[-10vh]">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Page not found.
        </h1>
        <p className="max-w-95 text-sm md:text-[15px] text-muted-foreground leading-relaxed">
          You seem to have reached a page that doesn&apos;t exist or may never exist. Turn back now, traveler.
        </p>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95 shadow-sm"
        >
          Go Home
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Giant Bottom Text */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none select-none translate-y-[28%] md:translate-y-[25%] opacity-100">
        <div className="relative">
          <h2 className="text-[28vw] md:text-[22vw] lg:text-[250px] font-black leading-none tracking-tighter text-foreground whitespace-nowrap">
            Four04
          </h2>
        </div>
      </div>
    </div>
  );
}
