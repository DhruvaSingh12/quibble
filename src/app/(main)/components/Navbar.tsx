"use client";

import SearchField from "@/components/ui/SearchField";
import UserButton from "@/components/UserButton";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Bell, Book, Bookmark, Home, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/messages", icon: Mail, label: "Messages" },
    { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    { href: "/dictionary", icon: Book, label: "Dictionary" },
  ];

  return (
    <nav className="w-full px-6 py-4 rounded-lg border border-border relative bg-card shadow-sm">
      {/* Top row */}
      <div className="flex items-center justify-between">
        
        {/* Desktop Nav */}
        <div className="hidden md:flex gap-2">
          <Button variant="outline" size="icon" className="rounded-full bg-background/80 border-border" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full bg-background/80 border-border" onClick={() => router.forward()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Nav Top */}
        <div className="flex md:hidden items-center justify-start flex-1">
          <Link href="/" className="mr-2">
            <Logo className="text-3xl" />
          </Link>
        </div>

        <div className="flex items-center gap-4 ml-auto w-full md:w-auto justify-end">
          <div className="hidden md:block w-full md:w-[450px]">
            <SearchField />
          </div>
          <UserButton />
        </div>
      </div>

      {/* Mobile Nav Row (shown below top row on mobile) */}
      <div className="flex md:hidden mt-4 items-center justify-between border-t border-border pt-4">
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
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
              </Link>
            </Button>
          );
        })}
      </div>
      
      {/* Mobile Search */}
      <div className="block md:hidden mt-4">
        <SearchField />
      </div>
    </nav>
  );
}
