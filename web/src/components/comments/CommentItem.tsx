"use client";

import { useState } from "react";
import Link from "next/link";
import { CommentData } from "@/lib/types";
import UserAvatar from "@/components/UserAvatar";
import { formatRelativeDate } from "@/lib/utils";
import { useSession } from "@/providers/SessionProvider";
import { useDeleteCommentMutation } from "./mutations";
import CommentInput from "./CommentInput";
import CommentThread from "./CommentThread";
import CommentLikeButton from "./CommentLikeButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { MoreHorizontalIcon, Trash2, MessageSquare } from "lucide-react";

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  postAuthorId: string;
  depth?: number;
}

const MAX_VISUAL_DEPTH = 6;

export default function CommentItem({
  comment,
  postId,
  postAuthorId,
  depth = 0,
}: CommentItemProps) {
  const { user } = useSession();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const deleteMutation = useDeleteCommentMutation(postId);

  const canDelete =
    user?.id === comment.userId || user?.id === postAuthorId;

  const replyCount = comment._count.replies;
  const isDeleted = comment.isDeleted;

  // Cap visual indentation
  const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);

  return (
    <div
      className="relative"
      style={{
        marginLeft: visualDepth > 0 ? `${visualDepth * 16}px` : undefined,
      }}
    >
      {/* Vertical thread line */}
      {depth > 0 && (
        <div
          className="absolute left-[-12px] top-0 bottom-0 w-[2px] bg-border hover:bg-muted-foreground/40 cursor-pointer transition-colors"
          onClick={() => setShowReplies(false)}
          title="Collapse thread"
        />
      )}

      <div className="py-2.5">
        {isDeleted ? (
          /* Deleted comment placeholder */
          <div className="flex items-center gap-2 text-sm text-muted-foreground/60 italic">
            <div className="w-6 h-6 rounded-full bg-muted flex-none" />
            <span>[deleted]</span>
          </div>
        ) : (
          /* Normal comment */
          <div className="group/comment">
            <div className="flex items-start gap-2.5">
              <Link href={`/users/${comment.user.username}`}>
                <UserAvatar
                  avatarUrl={comment.user.avatarUrl}
                  size={24}
                  className="flex-none w-6 h-6"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/users/${comment.user.username}`}
                    className="text-[13px] font-semibold hover:underline"
                  >
                    {comment.user.displayName}
                  </Link>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(new Date(comment.createdAt))}
                    {comment.updatedAt &&
                      new Date(comment.updatedAt).getTime() -
                      new Date(comment.createdAt).getTime() >
                      60000 && (
                        <span className="ml-1 text-muted-foreground/70">
                          (edited)
                        </span>
                      )}
                  </span>

                  {/* Post author badge */}
                  {comment.userId === postAuthorId && (
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      OP
                    </span>
                  )}

                  <div className="ml-auto flex items-center gap-3">
                    {/* Like button */}
                    <CommentLikeButton comment={comment} />

                    {/* Reply button */}
                    <button
                      onClick={() => setShowReplyInput(!showReplyInput)}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Reply
                    </button>

                    {/* Delete dropdown */}
                    {canDelete && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover/comment:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted">
                            <MoreHorizontalIcon className="size-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-20">
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive text-xs"
                            onClick={() => deleteMutation.mutate(comment.id)}
                          >
                            <Trash2 className="size-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {comment.content && (
                  <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-line break-words">
                    {comment.content}
                  </p>
                )}
                {comment.gifUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden max-w-[250px] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={comment.gifUrl} alt="GIF" className="w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reply input */}
        {showReplyInput && !isDeleted && (
          <div className="mt-2 ml-8">
            <CommentInput
              postId={postId}
              parentId={comment.id}
              autoFocus
              placeholder={`Reply to @${comment.user.username}...`}
              onSuccess={() => {
                setShowReplyInput(false);
                setShowReplies(true);
              }}
              onCancel={() => setShowReplyInput(false)}
            />
          </div>
        )}

        {/* Replies section */}
        {replyCount > 0 && (
          <div className="mt-1">
            {!showReplies ? (
              <button
                onClick={() => setShowReplies(true)}
                className="ml-8 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                {replyCount === 1
                  ? "View 1 reply"
                  : `View ${replyCount} replies`}
              </button>
            ) : (
              <div className="mt-1">
                <button
                  onClick={() => setShowReplies(false)}
                  className="ml-8 text-xs font-medium text-primary hover:text-primary/80 transition-colors mb-1"
                >
                  Hide replies
                </button>
                <CommentThread
                  postId={postId}
                  parentId={comment.id}
                  postAuthorId={postAuthorId}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
