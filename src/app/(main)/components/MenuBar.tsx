"use client";

import { Button } from "@/components/ui/Button";
import { Bell, Book, Bookmark, Home, Mail, Ghost } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function MenuBar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/messages", icon: Mail, label: "Messages" },
    { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    { href: "/dictionary", icon: Book, label: "Dictionary" },
  ];

  return (
    <div className="flex flex-col flex-1 gap-y-2 min-h-0">
      <div className="flex flex-col gap-y-2 bg-card border border-border rounded-lg p-4 flex-none shadow-sm">
        <div className="flex items-center justify-center gap-x-2 pb-2 border-b border-border">
          <Link href="/" onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              const scrollArea = document.getElementById("main-scroll-area");
              if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}>
            <Logo className="text-3xl xl:text-5xl" />
          </Link>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className="flex items-center justify-start gap-x-4 w-full h-10 px-3"
              asChild
            >
              <Link 
                href={item.href}
                onClick={(e) => {
                  if (isActive) {
                    e.preventDefault();
                    const scrollArea = document.getElementById("main-scroll-area");
                    if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden md:inline font-medium">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Context Panel */}
      <div className="flex-1 rounded-lg border border-border overflow-hidden bg-card shadow-sm flex items-center justify-center p-2">
        <div className="flex flex-col items-center opacity-50 gap-2">
          <Ghost className="h-8 w-8 text-muted-foreground" />
          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Idle</span>
        </div>
      </div>
    </div>
  );
}
