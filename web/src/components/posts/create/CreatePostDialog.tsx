"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useEffect, useRef, useState } from "react";
import HardBreak from "@tiptap/extension-hard-break";
import TiptapImage from "@tiptap/extension-image";
import { useSession } from "@/providers/SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import "../common/editor.css";
import { useSubmitPostMutation } from "./mutations";
import useMediaUpload from "./useMediaUpload";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, } from "@/components/ui/Dialog";
import { FaX, FaPlus } from "react-icons/fa6";
import { toast } from "@/components/ui/use-toast";
import { PasteExtension } from "../common/PasteExtension";
import { MentionsInputExtension } from "../common/mention/InputExtension";
import GifPicker from "../common/GifPicker";
import { Tabs } from "@/components/ui/Tabs";
import EditorToolbar from "./EditorToolbar";
import MediaPreview from "./MediaPreview";
import GifPreview from "./GifPreview";

export default function PostEditor() {
  const { user } = useSession();
  const mutation = useSubmitPostMutation();
  const media = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "media" | "gif">("text");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        paragraph: { HTMLAttributes: { class: "tiptap-paragraph" } },
        bold: { HTMLAttributes: { class: "tiptap-bold" } },
        italic: { HTMLAttributes: { class: "tiptap-italic" } },
        strike: { HTMLAttributes: { class: "tiptap-strike" } },
        code: { HTMLAttributes: { class: "tiptap-code" } },
        blockquote: { HTMLAttributes: { class: "tiptap-blockquote" } },
        hardBreak: false,
        dropcursor: { color: "#3b82f6", width: 2 },
        link: {
          HTMLAttributes: { class: "text-primary hover:underline" },
          autolink: true,
          openOnClick: false,
          linkOnPaste: true,
        },
      }),
      HardBreak.configure({
        HTMLAttributes: { class: "tiptap-hard-break" },
      }),
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
      CharacterCount.configure({ limit: 3000 }),
      TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-h-[300px] object-contain",
        },
      }),
      PasteExtension.configure({
        onPasteFiles: (files) => {
          media.startUpload(files);
          setActiveTab("media");
        }
      }),
      MentionsInputExtension,
      Placeholder.configure({ placeholder: "What's on your mind?" }),
    ],
    immediatelyRender: false,
    parseOptions: { preserveWhitespace: "full" },
    editorProps: {
      attributes: { class: "tiptap focus:outline-none" },
    },
  });

  const input = editor?.getHTML() || "";
  const textLength = editor?.getText().length || 0;

  const hasContent =
    textLength > 0 ||
    selectedGif !== null ||
    media.attachments.some((a) => a.uploadedUrl);
  const canPost =
    hasContent && !media.isUploading && !media.isProcessing;

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
      setActiveTab("text");
      editor?.commands.clearContent();
      media.reset();
    }, 300);
  }, [editor, media]);

  useEffect(() => {
    if (isOpen) {
      if (editor) editor.commands.focus();
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
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
            if (canPost) onSubmit();
            break;
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editor, canPost]);

  const onSubmit = useCallback(() => {
    let finalContent = input;
    if (selectedGif) {
      finalContent = `<img src="${selectedGif}" class="rounded-lg max-h-[150px] object-contain" />${input}`;
    }

    const attachments = media.attachments
      .filter((a) => a.uploadedUrl)
      .map((a) => ({
        url: a.uploadedUrl as string,
        type: a.type === "image" ? "IMAGE" : "VIDEO" as "IMAGE" | "VIDEO",
        mimeType: a.file.type,
      }));

    mutation.mutate(
      {
        content: finalContent,
        attachments,
      },
      {
        onSuccess: () => {
          editor?.commands.clearContent();
          setSelectedGif(null);
          media.reset();
          closeDialog();
        },
      },
    );
  }, [editor, input, mutation, selectedGif, media, closeDialog]);

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
    setActiveTab("gif");
  };

  const handleCancel = () => {
    if (
      editor?.getText().trim().length ||
      selectedGif ||
      media.attachments.length > 0
    ) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "Post canceled",
        description: "Your post has been discarded.",
        variant: "default",
      });
      closeDialog();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      media.startUpload(files);
      if (files.some((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))) {
        setActiveTab("media");
      }
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime,.heic,.heif"
        multiple
        className="hidden"
        onChange={handleFilesChosen}
      />

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
                  variant: "destructive",
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
      <div className="flex items-center gap-3 py-2 pb-4 border-b border-border w-full">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          size={40}
          className="w-[40px] lg:w-[50px]"
        />
        <button
          onClick={openDialog}
          className="flex flex-1 items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-left text-muted-foreground transition-colors hover:bg-muted"
        >
          <span>What&apos;s on your mind?</span>
          <FaPlus className="ml-2 h-4 w-4" />
        </button>
      </div>

      {/* Enhanced Post Editor Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 backdrop-blur-sm transition-opacity duration-300">
          <div
            className={`w-full max-w-3xl sm:rounded-xl bg-card shadow-2xl transition-all duration-300 flex flex-col h-dvh max-h-dvh ${isVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-8 scale-95 opacity-0"
              }`}
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-b p-4">
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
                onClick={handleCancel}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <FaX className="h-3 w-3" />
              </button>
            </div>

            {/* Toolbar */}
            <EditorToolbar
              editor={editor}
              selectedGif={selectedGif}
              showGifPicker={showGifPicker}
              setShowGifPicker={setShowGifPicker}
              onFileSelect={handleFileSelect}
            />

            {/* Tab Navigation */}
            {!showGifPicker && (
              <Tabs className="flex flex-none border-b">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "text"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setActiveTab("media")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "media"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Media
                  {media.attachments.length > 0 && (
                    <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                      {media.attachments.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("gif")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "gif"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                  disabled={!selectedGif}
                >
                  GIF
                </button>
              </Tabs>
            )}

            {/* Editor Content */}
            <div className="p-4 flex-1 flex flex-col min-h-0">
              {showGifPicker ? (
                <div className="flex-1 overflow-hidden rounded-lg border">
                  <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                  />
                </div>
              ) : activeTab === "gif" && selectedGif ? (
                <div className="flex-1 overflow-hidden">
                  <GifPreview
                    url={selectedGif}
                    onRemove={() => {
                      setSelectedGif(null);
                      setActiveTab("text");
                    }}
                  />
                </div>
              ) : activeTab === "media" ? (
                <div className="flex-1 overflow-hidden">
                  <MediaPreview
                    attachments={media.attachments}
                    isUploading={media.isUploading}
                    isProcessing={media.isProcessing}
                    uploadProgress={media.uploadProgress}
                    onRemove={media.removeAttachment}
                    onAddMore={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="rounded-lg border transition-all flex-1 flex flex-col min-h-0 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                  <EditorContent
                    editor={editor}
                    className="prose prose-sm flex-1 w-full max-w-none cursor-text overflow-y-auto px-4 py-3 focus-within:outline-none [&>div]:min-h-full [&>div]:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-none p-4 border-t border-border flex justify-center gap-4 bg-card sm:rounded-b-xl">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={mutation.isPending}
                className="min-w-[120px]"
              >
                Cancel
              </Button>
              <LoadingButton
                loading={mutation.isPending}
                onClick={onSubmit}
                disabled={!canPost}
                className="min-w-[120px]"
              >
                {mutation.isPending ? "Posting..." : "Post"}
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}