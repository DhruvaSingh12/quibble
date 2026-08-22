"use client";

import { useSession } from "@/providers/SessionProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "./ui/DropdownMenu";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeToggleButton } from "./ToggleButton";

interface UserButtonProps {
  className?: string;
}

export default function UserButton({ className }: UserButtonProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("rounded-full flex-none", className)}>
          <UserAvatar avatarUrl={user?.avatarUrl} size={500} className="w-10 lg:w-12" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" alignOffset={-12}>
        <Link href={`/users/${user?.username}`} passHref>
          <DropdownMenuItem className="cursor-pointer gap-2 font-medium">
            @{user?.username}
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="flex items-center justify-between w-full cursor-pointer">
            <span>Theme</span>
            <ThemeToggleButton />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => {
          queryClient.clear();
          logout();
        }}>
          <LogOutIcon className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
