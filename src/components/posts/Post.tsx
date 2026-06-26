"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserTooltip from "@/components/UserTooltip";
import UserAvatar from "@/components/UserAvatar";
import { formatRelativeDate } from "@/lib/utils";
import PostActions from "./PostActions";
import RichTextRenderer from "./common/RichTextRenderer";
import { PostData } from "@/lib/types";

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handlePostClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    router.push(`/posts/${post.id}`);
  };

  return (
    <div
      onClick={handlePostClick}
      className="group/delete cursor-pointer p-6 border-b border-border last:border-0 transition-colors hover:bg-muted/30"
    >
      <div className="flex flex-col justify-between gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserTooltip user={post.user}>
              <Link href={`/users/${post.user.username}`}>
                <UserAvatar
                  size={500}
                  className="w-[50px]"
                  avatarUrl={post.user.avatarUrl}
                />
              </Link>
            </UserTooltip>
            <div>
              <UserTooltip user={post.user}>
                <Link href={`/users/${post.user.username}`}
                  className="block text-[16px] hover:underline">
                  {post.user.displayName}
                </Link>
              </UserTooltip>

              <p className="block text-[12px] text-muted-foreground">
                {formatRelativeDate(new Date(post.createdAt))}
                {/* Show edited indicator if post was modified (more than 1 minute after creation) */}
                {post.updatedAt &&
                  new Date(post.updatedAt).getTime() -
                  new Date(post.createdAt).getTime() >
                  60000 && (
                    <span className="ml-1 text-xs text-muted-foreground/70">
                      • edited
                    </span>
                  )}
              </p>
            </div>
          </div>
          <div
            className={`ml-auto cursor-default transition-opacity ${isDropdownOpen
              ? "opacity-100"
              : "opacity-100 sm:opacity-0 sm:group-hover/delete:opacity-100"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <PostActions post={post} onDropdownToggle={setIsDropdownOpen} />
          </div>
        </div>

        <div className="relative">
          <RichTextRenderer
            content={post.content}
            maxLength={800}
            className="whitespace-pre-line break-words text-justify text-[16px] text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}
