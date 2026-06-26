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

import HardBreak from "@tiptap/extension-hard-break";
import Link from "@tiptap/extension-link";
import React, { useEffect, useCallback, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription} from "@/components/ui/Dialog";
import { FaX, FaBold, FaItalic,  FaStrikethrough, FaListUl, FaListOl, FaQuoteLeft, FaCode } from "react-icons/fa6";
import "../common/editor.css";
import { toast } from "@/components/ui/use-toast";
import { PasteExtension } from "../common/PasteExtension";
import { MentionsInputExtension } from "../common/mention/InputExtension";


interface EditPostDialogProps {
    post: PostData;
    open: boolean;
    onClose: () => void;
}

export default function EditPostDialog({ post, open, onClose }: EditPostDialogProps) {
    const { user } = useSession();
    const mutation = useEditPostMutation();
    const [isVisible, setIsVisible] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
                paragraph: { HTMLAttributes: {class: 'tiptap-paragraph'}},
                bold: { HTMLAttributes: {class: 'tiptap-bold'}},
                italic: { HTMLAttributes: {class: 'tiptap-italic'}},
                strike: { HTMLAttributes: { class: 'tiptap-strike' }},
                code: { HTMLAttributes: { class: 'tiptap-code'}},
                blockquote: { HTMLAttributes: { class: 'tiptap-blockquote' }},
                hardBreak: false,
                dropcursor: { color: '#3b82f6', width: 2 },
            }),
            HardBreak.configure({ HTMLAttributes: {class: 'tiptap-hard-break'}}),
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
            CharacterCount.configure({limit: 3000}),
            Link.configure({
                HTMLAttributes: {
                    class: 'text-primary hover:underline',
                },
                autolink: true, // Automatically detects and converts URLs to links
                openOnClick: false, // Don't open links while editing
                linkOnPaste: true, // Automatically convert pasted URLs to links
            }),
            PasteExtension,
            MentionsInputExtension,
            Placeholder.configure({ placeholder: "What's on your mind?" })
        ],
        immediatelyRender: false,
        parseOptions: { preserveWhitespace: 'full' },
        editorProps: { attributes: {class: 'tiptap focus:outline-none'}},
    });

    useEffect(() => {
      if (open) {
        if (editor) {
          editor.commands.focus();
        }
        if (editor && post.content) {
          editor.commands.setContent(post.content);
          setIsVisible(true);
        }
        document.body.style.overflow = "hidden";

        return () => {
          document.body.style.overflow = "";
        };
      }
    }, [open, editor, post]);

    const input = editor?.getHTML() || "";
    const textLength = editor?.getText().length || 0;

    const handleClose = useCallback(() => {
        const currentContent = input.trim();
        const originalContent = post.content.trim();
        const hasChanges = currentContent !== originalContent;
        if (hasChanges && !mutation.isPending) {
            setShowConfirmDialog(true);
            return;
        }
        toast({
            title: "Edit canceled",
            description: "Changes to your post were discarded.",
            variant: "default"
        });
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
    }, [open, editor, textLength, input, post, onSubmit]);

    const ToolbarButton = ({ 
        onClick, 
        isActive = false, 
        icon: Icon, 
        title 
    }: { 
        onClick: () => void; 
        isActive?: boolean; 
        icon: React.ComponentType<{ className?: string }>; 
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
    <>
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to discard these
              changes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowConfirmDialog(false);
                toast({
                  title: "Changes discarded",
                  description: "Your changes have been discarded.",
                  variant: "destructive",
                });
                setIsVisible(false);
                setTimeout(onClose, 200);
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm transition-opacity duration-300">
        <div
          className={`w-full max-w-2xl rounded-t-lg bg-card shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={user.avatarUrl} size={40} />
              <div>
                <h2 className="text-lg font-medium text-card-foreground">
                  Edit post
                </h2>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
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
          <div className="flex items-center gap-1 border-b bg-muted/20 p-3">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive("bold")}
              icon={FaBold}
              title="Bold"
            />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive("italic")}
              icon={FaItalic}
              title="Italic"
            />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              isActive={editor?.isActive("strike")}
              icon={FaStrikethrough}
              title="Strikethrough"
            />
            <div className="mx-2 h-6 w-px bg-border" />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive("bulletList")}
              icon={FaListUl}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              isActive={editor?.isActive("orderedList")}
              icon={FaListOl}
              title="Numbered List"
            />
            <div className="mx-2 h-6 w-px bg-border" />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              isActive={editor?.isActive("blockquote")}
              icon={FaQuoteLeft}
              title="Quote"
            />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleCode().run()}
              isActive={editor?.isActive("code")}
              icon={FaCode}
              title="Inline Code"
            />
          </div>

          {/* Editor Content */}
          <div className="p-4">
            <div className="rounded-lg border transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
              <EditorContent
                editor={editor}
                className="prose prose-sm max-h-[400px] min-h-[200px] w-full max-w-none cursor-text overflow-y-auto px-4 py-3 focus-within:outline-none [&>div]:min-h-[200px] [&>div]:outline-none"
              />
            </div>

            {/* Character Count */}
            <div className="mt-2 flex items-start justify-between rounded-lg bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
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
    </>
  );
}
