"use client";

import UserButton from "@/components/UserButton";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Search } from "lucide-react";
import { FaAngleLeft } from "react-icons/fa6";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="w-full px-6 py-4 rounded-lg border border-border relative bg-card shadow-sm">
      {/* Top row */}
      <div className="flex items-center justify-between">
        
        {/* Desktop Nav */}
        <div className="hidden md:flex gap-2">
          <Button variant="outline" size="icon" className="rounded-full bg-background/80 border-border" onClick={() => router.back()}>
            <FaAngleLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full bg-background/80 border-border" onClick={() => router.forward()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Nav Top */}
        <div className="flex md:hidden items-center justify-start flex-1">
          <Link 
            href="/" 
            className="mr-2"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                const scrollArea = document.getElementById("main-scroll-area");
                if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <Logo className="text-3xl" />
          </Link>
        </div>

        <div className="flex items-center gap-4 ml-auto w-full md:w-auto justify-end">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" asChild>
            <Link href="/search" title="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
