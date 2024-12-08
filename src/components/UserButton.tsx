"use client";

import { useSession } from "@/providers/SessionProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "./ui/DropdownMenu";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Check, LogOutIcon, Monitor, MonitorIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";

interface UserButtonProps {
  className?: string;
}

export default function UserButton({ className }: UserButtonProps) {
  const { user } = useSession();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("rounded-full flex-none", className)}>
          <UserAvatar avatarUrl={user?.avatarUrl} size={45} className="w-[40px] lg:w-[48px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="items-center justify-center">@{user?.username}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href={'/users/${user.username}'}>
          <DropdownMenuItem>
            <UserAvatar avatarUrl={user?.avatarUrl} size={24} className="mr-2" />
            Profile
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MonitorIcon size={24} className="mr-2 text-muted-foreground" />Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("system")}>System Default {theme === "system" && <Check className="ms-2 size-4" />}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")}>Light {theme === "light" && <Check className="ms-2 size-4" />}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark {theme === "dark" && <Check className="ms-2 size-4" />}</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
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
