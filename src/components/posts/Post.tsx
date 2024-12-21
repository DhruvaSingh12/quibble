"use client";

import { useState } from "react";
import Link from "next/link";
import { PostData } from "../../lib/types";
import UserAvatar from "../UserAvatar";
import { formatRelativeDate } from "@/lib/utils";
import { useSession } from "@/providers/SessionProvider";
import DeleteButton from "./PostActions";
import Linkify from "../Linkify";
import UserTooltip from "../UserTooltip";

interface PostProps {
    post: PostData;
}

const MAX_CONTENT_LENGTH = 300;

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

    const { user } = useSession();

    return (
        <article className="space-y-3 group/delete rounded-2xl bg-card p-3 lg:p-5 shadow-sm" >
            <div className="flex flex-col justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <UserTooltip user={post.user}>
                            <Link href={`/users/${post.user.username}`} passHref>
                                <UserAvatar size={500} className="w-[50px]" avatarUrl={post.user.avatarUrl} />
                            </Link>
                        </UserTooltip>
                        <div>
                            <UserTooltip user={post.user}>
                                <Link href={`/users/${post.user.username}`} className="block text-[16px] hover:underline">
                                    {post.user.displayName}
                                </Link>
                            </UserTooltip>
                            <p className="block text-[12px] text-muted-foreground">
                                {formatRelativeDate(new Date(post.createdAt))}
                            </p>
                        </div>
                    </div>
                    {user?.id === post.user.id && (
                        <div
                            className={`ml-auto transition-opacity ${isDropdownOpen ? "opacity-100" : "opacity-0 group-hover/delete:opacity-100"
                                }`}
                        >
                            <DeleteButton
                                post={post}
                                onDropdownToggle={setIsDropdownOpen}
                            />
                        </div>
                    )}
                </div>

                <div className="relative">
                    <Linkify>
                        <p className="text-[16px] whitespace-pre-line break-words text-justify text-muted-foreground">
                            {displayedContent}
                        </p>
                    </Linkify>
                    {needsTruncation && (
                        <button
                            onClick={toggleExpanded}
                            className="text-primary hover:underline mt-2 block text-sm"
                        >
                            {isExpanded ? "Read less" : "Read more"}
                        </button>
                    )}
                    <Link href={`/posts/${post.id}`} passHref>
                        <button
                            className="absolute bottom-0 right-0 mt-2 mr-1 transition-transform text-muted-foreground hover:bg-background p-2 hover:shadow-lg rounded-full hover:scale-110 flex items-center gap-1"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </Link>
                </div>
            </div>
        </article>
    );
}
