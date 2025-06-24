"use client";

import { useSession } from "@/providers/SessionProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/DropdownMenu";
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
          <UserAvatar avatarUrl={user?.avatarUrl} size={500} className="w-[40px] lg:w-[48px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="items-center justify-center">@{user?.username}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href={'/users/' + user?.username} passHref>
          <DropdownMenuItem>
            <UserAvatar avatarUrl={user?.avatarUrl} size={500} className="w-[24px] mr-2" />
            Profile
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem asChild>
          <div className="flex items-center justify-between w-full cursor-pointer">
            <span>Theme</span>
            <ThemeToggleButton />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          queryClient.clear();
          logout();
        }}>
          <LogOutIcon size={24} className="mr-2 text-muted-foreground" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
