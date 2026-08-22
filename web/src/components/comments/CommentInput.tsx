"use client";

import { useState, useRef } from "react";
import UserAvatar from "@/components/UserAvatar";
import { useSession } from "@/providers/SessionProvider";
import { useCreateCommentMutation } from "./mutations";
import { Loader2 } from "lucide-react";
import { MdGif } from "react-icons/md";
import { FaX } from "react-icons/fa6";
import GifPicker from "@/components/posts/common/GifPicker";
import Image from "next/image";

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function CommentInput({
  postId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus = false,
  placeholder = "Add a comment...",
}: CommentInputProps) {
  const { user } = useSession();
  const [isFocused, setIsFocused] = useState(autoFocus);
  const [content, setContent] = useState("");
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mutation = useCreateCommentMutation(postId);

  const handleSubmit = () => {
    if (!content.trim() && !gifUrl) return;

    mutation.mutate(
      { content: content.trim(), parentId, gifUrl: gifUrl || undefined },
      {
        onSuccess: () => {
          setContent("");
          setGifUrl(null);
          setShowGifPicker(false);
          setIsFocused(false);
          onSuccess?.();
        },
      }
    );
  };

  const handleCancel = () => {
    setContent("");
    setGifUrl(null);
    setShowGifPicker(false);
    setIsFocused(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  if (!user) return null;

  return (
    <div className="flex gap-3">
      <UserAvatar
        avatarUrl={user.avatarUrl}
        size={32}
        className="flex-none w-8 h-8 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        {!isFocused ? (
          <button
            onClick={() => {
              setIsFocused(true);
              setTimeout(() => textareaRef.current?.focus(), 0);
            }}
            className="w-full text-left text-sm text-muted-foreground border-b border-border pb-2 hover:border-foreground transition-colors"
          >
            {placeholder}
          </button>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder={placeholder}
              rows={1}
              className="w-full resize-none bg-transparent text-sm outline-none border-b border-border focus:border-primary pb-2 transition-colors placeholder:text-muted-foreground"
            />
            {gifUrl && (
              <div className="relative mt-2 w-max max-w-50">
                <Image
                  src={gifUrl}
                  alt="Selected GIF"
                  width={200}
                  height={150}
                  className="rounded-lg object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setGifUrl(null)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                >
                  <FaX className="size-3" />
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-full transition-colors"
                title="Add GIF"
              >
                <MdGif className="size-6" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={(!content.trim() && !gifUrl) || mutation.isPending}
                  className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {mutation.isPending && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  {parentId ? "Reply" : "Comment"}
                </button>
              </div>
            </div>
            {showGifPicker && (
              <div className="mt-2 border rounded-xl overflow-hidden h-75">
                <GifPicker
                  onSelect={(url) => {
                    setGifUrl(url);
                    setShowGifPicker(false);
                  }}
                  onClose={() => setShowGifPicker(false)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
