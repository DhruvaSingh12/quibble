"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import HardBreak from "@tiptap/extension-hard-break";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { useSession } from "@/providers/SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import "../common/editor.css";
import { useSubmitPostMutation } from "./mutations";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { FaBold, FaItalic, FaStrikethrough, FaListUl, FaListOl, FaQuoteLeft, FaCode, FaX, FaPlus, FaRegImage } from "react-icons/fa6";
import { toast } from "@/components/ui/use-toast";
import { PasteExtension } from "../common/PasteExtension";
import { MentionsInputExtension } from "../common/mention/InputExtension";
import GifPicker from "../common/GifPicker";
import { Tabs } from "@/components/ui/Tabs";

export default function PostEditor() {
  const { user } = useSession();
  const mutation = useSubmitPostMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'gif'>('text');

  const editor = useEditor({
    extensions: [ StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        paragraph: { HTMLAttributes: { class: "tiptap-paragraph" }},
        bold: { HTMLAttributes: { class: "tiptap-bold"}},
        italic: { HTMLAttributes: { class: "tiptap-italic" }},
        strike: { HTMLAttributes: { class: "tiptap-strike" }},
        code: { HTMLAttributes: { class: "tiptap-code" }},
        blockquote: { HTMLAttributes: { class: "tiptap-blockquote" }},
        hardBreak: false,
      }),
      HardBreak.configure({ 
        HTMLAttributes: { class: "tiptap-hard-break" }}),
      TextStyle,
      Typography.configure({
        openDoubleQuote: '"',
        closeDoubleQuote: '"',
        openSingleQuote: "'",
        closeSingleQuote: "'",
        emDash: "—",
        ellipsis: "…",
        leftArrow: "←",
        rightArrow: "→",
      }),
      CharacterCount.configure({
        limit: 3000,
      }),
      Dropcursor.configure({
        color: "#3b82f6",
        width: 2,
      }),
      Gapcursor,
      Link.configure({
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
        autolink: true, // Automatically detects and converts URLs to links
        openOnClick: false, // Don't open links while editing
        linkOnPaste: true, // Automatically convert pasted URLs to links
      }),
      TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-h-[300px] object-contain',
        },
      }),
      PasteExtension,
      MentionsInputExtension,
      Placeholder.configure({
        placeholder: "What's on your mind?",
      }),
    ],
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: "full",
    },
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none",
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
      setShowGifPicker(false);
      setSelectedGif(null);
      setActiveTab('text');
      editor?.commands.clearContent();
    }, 300);
  }, [editor]);

  useEffect(() => {
    if (isOpen) {
      // Focus the editor when dialog is opened
      if (editor) {
        editor.commands.focus();
      }
      
      // Disable body scrolling when dialog is open
      document.body.style.overflow = 'hidden';
      
      // Re-enable scrolling when dialog closes
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !editor) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
            break;
          case "i":
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
            break;
          case "Enter":
            e.preventDefault();
            if (textLength > 0) {
              onSubmit();
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editor, textLength]);

  const onSubmit = useCallback(() => {
    // Combine GIF and text content
    let finalContent = input;
    if (selectedGif) {
      finalContent = `<img src="${selectedGif}" class="rounded-lg max-h-[150px] object-contain" />${input}`;
    }
    
    mutation.mutate(finalContent, {
      onSuccess: () => {
        editor?.commands.clearContent();
        setSelectedGif(null);
        closeDialog();
      },
    });
  }, [editor, input, mutation, selectedGif, closeDialog]);
  
  const handleGifSelect = (url: string) => {
    if (selectedGif) {
      toast({
        title: "One GIF per post",
        description: "You can only add one GIF per post.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedGif(url);
    setShowGifPicker(false);
    setActiveTab('gif');
  };

  const handleCancel = () => {
    if (editor?.getText().trim().length || selectedGif) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "Post canceled",
        description: "Your post has been discarded.",
        variant: "default"
      });
      closeDialog();
    }
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    icon: Icon,
    title,
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
      className={`rounded-lg p-2 transition-colors hover:bg-muted ${
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
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
              You have unsaved changes. Are you sure you want to discard this
              post?
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
                  title: "Post discarded",
                  description: "Your post has been discarded.",
                  variant: "destructive"
                });
                closeDialog();
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compact Post Trigger */}
      <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm lg:p-5">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          size={40}
          className="w-[40px] lg:w-[50px]"
        />
        <button
          onClick={openDialog}
          className="flex flex-1 items-center justify-between rounded-2xl border bg-background px-4 py-3 text-left text-muted-foreground transition-colors hover:bg-muted"
        >
          <span>What&apos;s on your mind?</span>
          <FaPlus className="ml-2 h-4 w-4" />
        </button>
      </div>

      {/* Enhanced Post Editor Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm transition-opacity duration-300"
        >
          <div
            className={`w-full max-w-2xl rounded-t-2xl bg-card shadow-2xl transition-all duration-300 ${
              isVisible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <UserAvatar avatarUrl={user.avatarUrl} size={40} />
                <div>
                  <h2 className="text-lg font-medium text-card-foreground">
                    Create post
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
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
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
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
              <div className="mx-2 h-6 w-px bg-border" />
              <ToolbarButton
                onClick={() => {
                  if (selectedGif) {
                    toast({
                      title: "One GIF per post",
                      description: "You can only add one GIF per post. Remove the existing GIF first.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowGifPicker(!showGifPicker);
                }}
                isActive={showGifPicker}
                icon={FaRegImage}
                title="GIF"
              />
            </div>

            {/* Tab Navigation */}
            {!showGifPicker && (
              <Tabs className="flex border-b">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'text'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setActiveTab('gif')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'gif'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={!selectedGif}
                >
                  Media
                </button>
              </Tabs>
            )}

            {/* Editor Content */}
            <div className="p-4">
              {showGifPicker ? (
                <div className="h-[450px] overflow-hidden rounded-xl border">
                  <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
                </div>
              ) : activeTab === 'gif' && selectedGif ? (
                <div className="space-y-3">
                  {/* GIF Preview */}
                  <div className="relative rounded-2xl overflow-hidden bg-card border">
                    <Image
                      src={selectedGif}
                      alt="Selected GIF"
                      width={500}
                      height={250}
                      className="w-full h-auto max-h-[250px] object-contain"
                      unoptimized
                    />
                    <button
                      onClick={() => {
                        setSelectedGif(null);
                        setActiveTab('text');
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full hover:bg-muted transition-colors"
                      title="Remove GIF"
                    >
                      <FaX className="text-foreground h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                  <EditorContent
                    editor={editor}
                    className="prose prose-sm max-h-[350px] min-h-[250px] w-full max-w-none cursor-text overflow-y-auto px-4 py-3 focus-within:outline-none [&>div]:min-h-[200px] [&>div]:outline-none"
                  />
                </div>
              )}

              {/* Character Count */}
              <div className="mt-2 flex items-start justify-between rounded-lg bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  {textLength > 0 ? (
                    <span
                      className={textLength > 2000 ? "text-destructive" : ""}
                    >
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
                  onClick={handleCancel}
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