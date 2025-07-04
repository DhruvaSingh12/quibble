"use client";

import { PostData } from "@/lib/types";
import { useEditPostMutation } from "./mutations";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/Button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import { PasteExtension } from "../editor/PasteExtension";
import { useEffect, useCallback, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import { 
    FaX, 
    FaBold, 
    FaItalic, 
    FaStrikethrough, 
    FaListUl, 
    FaListOl, 
    FaQuoteLeft,
    FaCode
} from "react-icons/fa6";
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
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                paragraph: {
                    HTMLAttributes: {
                        class: 'tiptap-paragraph',
                    },
                },
                bold: {
                    HTMLAttributes: {
                        class: 'tiptap-bold',
                    },
                },
                italic: {
                    HTMLAttributes: {
                        class: 'tiptap-italic',
                    },
                },
                strike: {
                    HTMLAttributes: {
                        class: 'tiptap-strike',
                    },
                },
                code: {
                    HTMLAttributes: {
                        class: 'tiptap-code',
                    },
                },
                blockquote: {
                    HTMLAttributes: {
                        class: 'tiptap-blockquote',
                    },
                },
                hardBreak: false, // We'll use the extension instead
            }),
            HardBreak.configure({
                HTMLAttributes: {
                    class: 'tiptap-hard-break',
                },
            }),
            TextStyle,
            Typography.configure({
                openDoubleQuote: '"',
                closeDoubleQuote: '"',
                openSingleQuote: "'",
                closeSingleQuote: "'",
                emDash: '—',
                ellipsis: '…',
                leftArrow: '←',
                rightArrow: '→',
            }),
            CharacterCount.configure({
                limit: 3000,
            }),
            Dropcursor.configure({
                color: '#3b82f6',
                width: 2,
            }),
            Gapcursor,
            PasteExtension,
            Placeholder.configure({
                placeholder: "What's on your mind?",
            })
        ],
        immediatelyRender: false,
        parseOptions: {
            preserveWhitespace: 'full',
        },
        editorProps: {
            attributes: {
                class: 'tiptap focus:outline-none',
            },
            handlePaste(view, event, slice) {
                // Optionally handle paste events here if needed
                return false;
            },
        },
    });
        // ...existing code...

    useEffect(() => {
        if (open && editor && post.content) {
            editor.commands.setContent(post.content);
            setIsVisible(true);
        }
    }, [open, editor, post]);

    const input = editor?.getHTML() || "";
    const textLength = editor?.getText().length || 0;

    const handleClose = useCallback(() => {
        // Compare the current HTML content with the original post content
        const currentContent = input.trim();
        const originalContent = post.content.trim();
        const hasChanges = currentContent !== originalContent;
        if (hasChanges && !mutation.isPending) {
            const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
            if (!confirmClose) return;
        }
        setIsVisible(false);
        setTimeout(onClose, 200);
    }, [input, post, mutation, onClose]);

    const onSubmit = useCallback(() => {
        if (!textLength) return;
        mutation.mutate(
            { id: post.id, content: input },
            {
                onSuccess: () => {
                    setIsVisible(false);
                    setTimeout(onClose, 200);
                }
            }
        );
    }, [input, textLength, post, mutation, onClose]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!open || !editor) return;
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    editor.chain().focus().toggleBold().run();
                    break;
                case 'i':
                    e.preventDefault();
                    editor.chain().focus().toggleItalic().run();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (textLength && input.trim() !== post.content.trim()) {
                        onSubmit();
                    }
                    break;
            }
        }
        // Handle escape key
        if (e.key === 'Escape') {
            e.preventDefault();
            handleClose();
        }
    }, [open, editor, textLength, input, post, handleClose, onSubmit]);

    const ToolbarButton = ({ 
        onClick, 
        isActive = false, 
        icon: Icon, 
        title 
    }: { 
        onClick: () => void; 
        isActive?: boolean; 
        icon: any; 
        title: string; 
    }) => (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`p-2 rounded-lg hover:bg-muted transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
            }`}
            title={title}
        >
            <Icon className="h-4 w-4" />
        </button>
    );

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

                {/* Toolbar */}
                <div className="flex items-center gap-1 px-4 pb-3 border-b bg-muted/20">
                    <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        isActive={editor?.isActive('bold')}
                        icon={FaBold}
                        title="Bold (Ctrl+B)"
                    />
                    <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        isActive={editor?.isActive('italic')}
                        icon={FaItalic}
                        title="Italic (Ctrl+I)"
                    />
                    <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        isActive={editor?.isActive('strike')}
                        icon={FaStrikethrough}
                        title="Strikethrough"
                    />
                    <div className="h-6 w-px bg-border mx-2" />
                    <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        isActive={editor?.isActive('bulletList')}
                        icon={FaListUl}
                        title="Bullet List"
                    />
                    <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        isActive={editor?.isActive('orderedList')}
                        icon={FaListOl}
                        title="Numbered List"
                    />
                    <div className="h-6 w-px bg-border mx-2" />
                    <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        isActive={editor?.isActive('blockquote')}
                        icon={FaQuoteLeft}
                        title="Quote"
                    />
                    <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        isActive={editor?.isActive('code')}
                        icon={FaCode}
                        title="Inline Code"
                    />
                </div>

                <div className="px-6 pb-6">
                    <div className="space-y-4">
                        <div className="border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                            <EditorContent 
                                editor={editor}
                                className="w-full px-4 py-3 min-h-[120px] max-h-[300px] overflow-y-auto prose prose-sm max-w-none focus-within:outline-none cursor-text [&>div]:min-h-[120px] [&>div]:outline-none"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg">
                            <span>
                                {textLength > 0 ? (
                                    <span className={textLength > 1000 ? "text-destructive" : ""}>
                                        {textLength} characters
                                    </span>
                                ) : (
                                    "Start typing..."
                                )}
                            </span>
                            <span className="text-muted-foreground/70">
                                Use rich formatting • Ctrl+B for bold • Ctrl+I for italic
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
                                disabled={!textLength || input.trim() === post.content.trim()}
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
