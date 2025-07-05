"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import { PasteExtension } from "./PasteExtension";
import { useSession } from "@/providers/SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import "./styles.css";
import { useSubmitPostMutation } from "./mutations";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription
} from "@/components/ui/Dialog";
import { useState, useEffect, useCallback } from "react";
import { 
    FaBold, 
    FaItalic, 
    FaStrikethrough, 
    FaListUl, 
    FaListOl, 
    FaQuoteLeft,
    FaCode,
    FaX,
    FaPlus
} from "react-icons/fa6";

export default function PostEditor() {
    const { user } = useSession();
    const mutation = useSubmitPostMutation();
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
                hardBreak: false, 
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
            }),
        ],
        immediatelyRender: false,
        parseOptions: {
            preserveWhitespace: 'full',
        },
        editorProps: {
            attributes: {
                class: 'tiptap focus:outline-none',
            },
        },
    });

    const input = editor?.getHTML() || "";
    const textLength = editor?.getText().length || 0;

    const openDialog = () => {
        setIsOpen(true);
        setTimeout(() => setIsVisible(true), 50);
    };

    const closeDialog = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            setIsOpen(false);
            editor?.commands.clearContent();
        }, 300);
    }, [editor]);

    useEffect(() => {
        if (isOpen && editor) {
            editor.commands.focus();
        }
    }, [isOpen, editor]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || !editor) return;
            
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
                        if (textLength > 0) {
                            onSubmit();
                        }
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                e.preventDefault();
                if (editor?.getText().trim().length) {
                    setShowConfirmDialog(true);
                } else {
                    closeDialog();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, editor, textLength, onSubmit, closeDialog]);

    function onSubmit() {
        mutation.mutate(input, {
            onSuccess: () => {
                editor?.commands.clearContent();
                closeDialog();
            }
        });
    }

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

    return (
        <>
            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discard post?</DialogTitle>
                        <DialogDescription>
                            You have unsaved changes. Are you sure you want to discard this post?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => {
                                setShowConfirmDialog(false);
                                closeDialog();
                            }}
                        >
                            Discard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Compact Post Trigger */}
            <div className="flex items-center gap-3 rounded-2xl bg-card p-3 lg:p-5 shadow-sm">
                <UserAvatar avatarUrl={user.avatarUrl} size={40} className="lg:w-[50px] w-[40px]" />
                <button
                    onClick={openDialog}
                    className="flex-1 flex items-center justify-between text-left rounded-2xl px-4 py-3 border bg-background hover:bg-muted transition-colors text-muted-foreground"
                >
                    <span>What's on your mind?</span>
                    <FaPlus className="h-4 w-4 ml-2" />
                </button>
            </div>

            {/* Enhanced Post Editor Dialog */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 backdrop-blur-sm flex items-end justify-center transition-opacity duration-300"
                    onClick={(e) => e.target === e.currentTarget && closeDialog()}
                >
                    <div 
                        className={`w-full max-w-2xl bg-card rounded-t-2xl shadow-2xl transition-all duration-300 ${
                            isVisible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                                <UserAvatar avatarUrl={user.avatarUrl} size={40} />
                                <div>
                                    <h2 className="text-lg font-medium text-card-foreground">Create post</h2>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeDialog}
                                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                            >
                                <FaX className="h-3 w-3" />
                            </button>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center gap-1 p-3 border-b bg-muted/20">
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                isActive={editor?.isActive('bold')}
                                icon={FaBold}
                                title="Bold"
                            />
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                isActive={editor?.isActive('italic')}
                                icon={FaItalic}
                                title="Italic"
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

                        {/* Editor Content */}
                        <div className="p-4">
                            <div className="border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                                <EditorContent 
                                    editor={editor}
                                    className="w-full px-4 py-3 min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm max-w-none focus-within:outline-none cursor-text [&>div]:min-h-[200px] [&>div]:outline-none"
                                />
                            </div>
                            
                            {/* Character Count */}
                            <div className="flex justify-between items-start text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg mt-2">
                                <span>
                                    {textLength > 0 ? (
                                        <span className={textLength > 2000 ? "text-destructive" : ""}>
                                            {textLength} characters
                                        </span>
                                    ) : (
                                        "Start typing..."
                                    )}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-2 pt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={closeDialog}
                                    disabled={mutation.isPending}
                                    className="min-w-[100px]"
                                >
                                    Cancel
                                </Button>
                                <LoadingButton 
                                    loading={mutation.isPending}
                                    onClick={onSubmit} 
                                    disabled={!textLength || textLength === 0}
                                    className="min-w-[120px]"
                                >
                                    {mutation.isPending ? "Posting..." : "Post"}
                                </LoadingButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}