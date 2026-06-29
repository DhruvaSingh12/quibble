"use client";

import { useRouter } from "next/navigation";
import { Input } from "./Input";
import { SearchIcon } from "lucide-react";

export default function SearchField() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim();
    if (!q) return;
    else if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} method="GET" action="/search" className="lg:px-12 md:px-6 px-4 w-full">
      <div className="relative">
        <Input name="q" placeholder="Search" className="pe-10" />
        <button
          type="submit"
          className="absolute top-1/2 right-2 lg:right-4 transform -translate-y-1/2 text-muted-foreground"
          aria-label="Search"
        >
          <SearchIcon />
        </button>
      </div>
    </form>
  );
}
