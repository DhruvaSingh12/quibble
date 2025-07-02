"use client";

import { useState } from "react";
import Link from "next/link";
import { PostData } from "../../lib/types";
import UserAvatar from "../UserAvatar";
import { formatRelativeDate } from "@/lib/utils";
import PostActions from "./PostActions"; 
import Linkify from "../Linkify";
import UserTooltip from "../UserTooltip";

interface PostProps {
    post: PostData;
}

const MAX_CONTENT_LENGTH = 800;

export default function Post({ post }: PostProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleExpanded = () => setIsExpanded(!isExpanded);
    const needsTruncation = post.content.length > MAX_CONTENT_LENGTH;
    const truncateAtWordBoundary = (text: string, limit: number): string => {
        if (text.length <= limit) return text;
        const truncated = text.slice(0, limit);
        const lastWhitespaceIndex = truncated.lastIndexOf(" ");
        return lastWhitespaceIndex > -1 ? truncated.slice(0, lastWhitespaceIndex) + " ...." : truncated + " ....";
    };
    const displayedContent = isExpanded || !needsTruncation
        ? post.content
        : truncateAtWordBoundary(post.content, MAX_CONTENT_LENGTH);

    return (
        <Link href={`/posts/${post.id}`} passHref>
            <article className="space-y-3 mb-5 group/delete rounded-2xl bg-card p-3 lg:p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow" >
                <div className="flex flex-col justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                        <div className="flex items-center gap-3">
                            <UserTooltip user={post.user}>
                                <div onClick={(e) => e.preventDefault()}>
                                    <Link href={`/users/${post.user.username}`} passHref>
                                        <UserAvatar size={500} className="w-[50px]" avatarUrl={post.user.avatarUrl} />
                                    </Link>
                                </div>
                            </UserTooltip>
                            <div>
                                <UserTooltip user={post.user}>
                                    <div onClick={(e) => e.preventDefault()}>
                                        <Link href={`/users/${post.user.username}`} className="block text-[16px] hover:underline">
                                            {post.user.displayName}
                                        </Link>
                                    </div>
                                </UserTooltip>
                                <p className="block text-[12px] text-muted-foreground">
                                    {formatRelativeDate(new Date(post.createdAt))}
                                    {/* Show edited indicator if post was modified (more than 1 minute after creation) */}
                                    {post.updatedAt && (new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime()) > 60000 && (
                                        <span className="ml-1 text-xs text-muted-foreground/70">
                                            • edited
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div
                            className={`ml-auto transition-opacity cursor-default ${isDropdownOpen ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover/delete:opacity-100"
                                }`}
                            onClick={(e) => e.preventDefault()}
                        >
                            <PostActions
                                post={post}
                                onDropdownToggle={setIsDropdownOpen}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <Linkify>
                            <div className="text-[16px] whitespace-pre-line break-words text-justify text-muted-foreground">
                                {displayedContent}
                            </div>
                        </Linkify>
                        {needsTruncation && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleExpanded();
                                }}
                                className="text-primary hover:underline mt-2 block text-sm"
                            >
                                {isExpanded ? "Read less" : "Read more"}
                            </button>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}
