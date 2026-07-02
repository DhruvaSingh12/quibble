import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Paperclip, X, ImageIcon, Music, Loader2, Camera, FileText } from 'lucide-react';
import GifPicker from "@/components/posts/common/GifPicker";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { FaCircleChevronRight, FaF, FaFaceKissBeam, FaG, FaI } from 'react-icons/fa6';

interface ChatInputAreaProps {
    inputText: string;
    setInputText: (v: string) => void;
    handleSendText: () => void;
    handleTyping: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
    activePanel: "none" | "emoji" | "gif" | "upload";
    setActivePanel: (v: "none" | "emoji" | "gif" | "upload") => void;
    isUploading: boolean;
    isMutualFollow: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEmojiClick: (e: any) => void;
    onGifSelect: (url: string) => void;
    onCameraClick?: () => void;
}

export function ChatInputArea({
    inputText,
    handleSendText,
    handleTyping,
    activePanel,
    setActivePanel,
    isUploading,
    isMutualFollow,
    fileInputRef,
    handleFileUpload,
    onEmojiClick,
    onGifSelect,
    onCameraClick,
}: ChatInputAreaProps) {
    const { resolvedTheme } = useTheme();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [inputText]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    return (
        <div className="px-3 pb-3 bg-transparent backdrop-blur z-40 flex-none relative">
            {/* Popover / Panels relative to Input */}
            {activePanel !== "none" && (
                <div className="absolute bottom-[calc(100%+10px)] left-2 z-50 w-80 bg-background rounded-2xl border shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in">
                    <div className="flex items-center justify-between p-3 pb-1">
                        <span className="text-sm font-semibold px-2 capitalize">{activePanel}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setActivePanel("none")}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="w-full relative" style={{ height: activePanel === "emoji" ? 400 : activePanel === "upload" ? "auto" : 300 }}>
                        {activePanel === "emoji" && (
                            <div className="absolute inset-0">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                />
                            </div>
                        )}
                        {activePanel === "gif" && (
                            <GifPicker onSelect={onGifSelect} onClose={() => setActivePanel("none")} />
                        )}
                        {activePanel === "upload" && (
                            <div className="p-2 pb-3 flex flex-col gap-1">
                                <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-medium" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon className="h-5 w-5 opacity-80" />
                                    Photo or Video
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-medium" onClick={() => fileInputRef.current?.click()}>
                                    <Music className="h-5 w-5 opacity-80" />
                                    Audio File
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-medium" onClick={() => fileInputRef.current?.click()}>
                                    <FileText className="h-5 w-5 opacity-80" />
                                    Document (PDF)
                                </Button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*,video/*,audio/*,application/pdf"
                                    onChange={handleFileUpload}
                                    multiple
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background border px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading media...
                </div>
            )}

            {isMutualFollow ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSendText(); }} className="flex items-center w-full max-w-4xl mx-auto">
                    <div className="flex-1 flex items-center gap-1 bg-muted/40 border border-border/60 rounded-3xl p-1.5 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 transition-all shadow-sm">

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`rounded-full h-8 w-8 sm:h-10 sm:w-10 flex-none transition-colors ${activePanel === "upload" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                            onClick={() => setActivePanel(activePanel === "upload" ? "none" : "upload")}
                        >
                            <Paperclip className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8 sm:h-10 sm:w-10 flex-none text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            onClick={onCameraClick}
                            title="Take Photo"
                        >
                            <Camera className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`rounded-full h-8 w-8 sm:h-10 sm:w-10 flex flex-row items-center justify-center transition-colors sm:inline-flex ${activePanel === "gif" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                            onClick={() => setActivePanel(activePanel === "gif" ? "none" : "gif")}
                        >
                            <FaG className="w-[9px] h-[9px] sm:w-[11px] sm:h-[11px]" />
                            <FaI className="w-[9px] h-[9px] sm:w-[11px] sm:h-[11px]" />
                            <FaF className="w-[9px] h-[9px] sm:w-[11px] sm:h-[11px]" />
                        </Button>

                        <textarea
                            ref={textareaRef}
                            rows={1}
                            maxLength={1000}
                            value={inputText}
                            onChange={(e) => handleTyping(e as any)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message..."
                            className="flex-1 bg-transparent px-1 sm:px-2 py-2 text-[14px] sm:text-[15px] focus:outline-none min-w-0 placeholder:text-muted-foreground/70 resize-none overflow-y-auto max-h-[120px]"
                            style={{ height: 'auto' }}
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`rounded-full h-8 w-8 sm:h-10 sm:w-10 flex-none transition-colors ${activePanel === "emoji" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                            onClick={() => setActivePanel(activePanel === "emoji" ? "none" : "emoji")}
                        >
                            <FaFaceKissBeam className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                        </Button>

                        <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            disabled={!inputText.trim()}
                            className="rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-transparent hover:bg-transparent p-0 transition-all disabled:opacity-50 text-primary disabled:text-muted-foreground"
                        >
                            <FaCircleChevronRight className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px]" />
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="text-center p-3 text-muted-foreground bg-muted/30 rounded-xl">
                    You can only message mutual followers.
                </div>
            )}
        </div>
    );
}
