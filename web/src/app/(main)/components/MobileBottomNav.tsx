"use client";

import { Button } from "@/components/ui/Button";
import { Bell, Book, Bookmark, Home, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/messages", icon: Mail, label: "Messages" },
    { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    { href: "/dictionary", icon: Book, label: "Dictionary" },
  ];

  return (
    <div className="flex md:hidden items-center justify-between border border-border bg-card shadow-sm rounded-lg p-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full"
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
              <item.icon className="h-5 w-5" />
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
