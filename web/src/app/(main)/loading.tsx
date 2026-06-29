"use client";

import BounceLoader from "@/components/BounceLoader";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <BounceLoader />
    </div>
  );
}
