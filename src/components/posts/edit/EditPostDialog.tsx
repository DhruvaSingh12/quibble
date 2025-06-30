"use client";

import { PostData } from "@/lib/types";
import { useEditPostMutation } from "./mutations";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/Button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import { FaX } from "react-icons/fa6";
import "../editor/styles.css";

interface EditPostDialogProps {
    post: PostData;
    open: boolean;
    onClose: () => void;
}

export default function EditPostDialog({ post, open, onClose }: EditPostDialogProps) {
    const { user } = useSession();
    const mutation = useEditPostMutation();
    const [isVisible, setIsVisible] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({}),
            Placeholder.configure({
                placeholder: "What's on your mind?",
            })
        ],
        immediatelyRender: false,
    });

    useEffect(() => {
        if (open && editor && post.content) {
            editor.commands.setContent(post.content);
            setIsVisible(true);
        }
    }, [open, editor, post.content]);

    const input = editor?.getText({
        blockSeparator: "\n",
    }) || "";

    const handleClose = useCallback(() => {
        const hasChanges = input.trim() !== post.content.trim();
        if (hasChanges && !mutation.isPending) {
            const confirmClose = confirm("You have unsaved changes. Are you sure you want to close?");
            if (!confirmClose) return;
        }
        setIsVisible(false);
        setTimeout(onClose, 200);
    }, [input, post.content, mutation.isPending, onClose]);

    const onSubmit = useCallback(() => {
        if (!input.trim()) return;
        
        mutation.mutate(
            { id: post.id, content: input },
            {
                onSuccess: () => {
                    setIsVisible(false);
                    setTimeout(onClose, 200);
                }
            }
        );
    }, [input, post.id, mutation, onClose]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (open && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (input.trim() && input.trim() !== post.content.trim()) {
                onSubmit();
            }
        }
        if (open && e.key === 'Escape') {
            e.preventDefault();
            handleClose();
        }
    }, [open, input, post.content, handleClose, onSubmit]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!open) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-all duration-300 ${
                isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
            <div
                className={`mx-auto w-full max-w-2xl rounded-t-3xl bg-card shadow-2xl transition-all duration-300 ${
                    isVisible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
                }`}
            >
                <div className="flex items-center justify-between p-4 pb-4">
                    <div className="flex items-center gap-3">
                        <UserAvatar avatarUrl={user.avatarUrl} size={40} />
                        <div>
                            <h2 className="text-lg font-medium text-card-foreground">Edit post</h2>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                    >
                        <FaX className="h-3 w-3" />
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <div className="space-y-4">
                        <div className="border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                            <EditorContent 
                                editor={editor}
                                className="w-full px-4 py-3 min-h-[120px] max-h-[300px] overflow-y-auto prose prose-sm max-w-none focus-within:outline-none [&>div]:min-h-[120px] [&>div]:outline-none"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg">
                            <span>
                                {input.length > 0 ? (
                                    <span className={input.length > 1000 ? "text-destructive" : ""}>
                                        {input.length} characters
                                    </span>
                                ) : (
                                    "Start typing..."
                                )}
                            </span>
                        </div>

                        <div className="flex justify-center gap-2 pt-2">
                            <Button 
                                variant="outline" 
                                onClick={handleClose}
                                disabled={mutation.isPending}
                                className="min-w-[100px]"
                            >
                                Cancel
                            </Button>
                            <LoadingButton 
                                loading={mutation.isPending}
                                onClick={onSubmit} 
                                disabled={!input.trim() || input.trim() === post.content.trim()}
                                className="min-w-[120px]"
                            >
                                {mutation.isPending ? "Saving..." : "Save changes"}
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
