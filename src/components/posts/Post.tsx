"use client";

import { useState } from "react";
import Link from "next/link";
import { PostData } from "../../lib/types";
import UserAvatar from "../UserAvatar";
import { formatRelativeDate } from "@/lib/utils";
import { useSession } from "@/providers/SessionProvider";
import DeleteButton from "./delete/DeleteButton";
import Linkify from "../Linkify";

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
                        <Link href={`/users/${post.user.username}`} passHref>
                            <UserAvatar size={500} className="w-[50px]" avatarUrl={post.user.avatarUrl} />
                        </Link>
                        <div>
                            <Link href={`/users/${post.user.username}`} className="block text-[16px] hover:underline">
                                {post.user.displayName}
                            </Link>
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

                <div>
                    <Linkify >
                        <div>
                            <Link href={`/posts/${post.id}`} passHref>
                                <p className="text-[16px] whitespace-pre-line break-words text-justify text-muted-foreground">
                                    {displayedContent}
                                </p>
                            </Link>
                        </div>
                        {needsTruncation && (
                            <button
                                onClick={toggleExpanded}
                                className="text-primary hover:underline mt-2 block text-sm"
                            >
                                {isExpanded ? "Read less" : "Read more"}
                            </button>
                        )}
                    </Linkify>
                </div>
            </div>
        </article>
    );
}
