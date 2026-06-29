import React from 'react';
import { Button } from '@/components/ui/Button';
import { Send, Plus, X, ImageIcon, Music, Loader2 } from 'lucide-react';
import GifPicker from "@/components/posts/common/GifPicker";
import EmojiPicker, { Theme } from "emoji-picker-react";

interface ChatInputAreaProps {
    inputText: string;
    setInputText: (v: string) => void;
    handleSendText: () => void;
    handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    activePanel: "none" | "emoji" | "gif" | "upload";
    setActivePanel: (v: "none" | "emoji" | "gif" | "upload") => void;
    isUploading: boolean;
    isMutualFollow: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEmojiClick: (e: any) => void;
    onGifSelect: (url: string) => void;
}

export function ChatInputArea({
    inputText,
    setInputText,
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
}: ChatInputAreaProps) {
    return (
        <div className="p-3 border-t bg-background/95 backdrop-blur z-10 flex-none relative">
            {/* Popover / Panels relative to Input */}
            {activePanel !== "none" && (
                <div className="absolute bottom-[calc(100%+10px)] left-2 z-20 w-80 bg-card rounded-2xl border shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in">
                    <div className="flex items-center justify-between p-2 border-b bg-muted/20">
                        <span className="text-sm font-semibold px-2 capitalize">{activePanel}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setActivePanel("none")}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="w-full relative bg-background" style={{ height: activePanel === "emoji" ? 400 : 300 }}>
                        {activePanel === "emoji" && (
                            <div className="absolute inset-0">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.AUTO}
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
                            <div className="p-4 flex flex-col gap-3">
                                <Button variant="outline" className="w-full justify-start gap-2 h-12" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon className="h-5 w-5 text-blue-500" />
                                    Photo or Video
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-12" onClick={() => fileInputRef.current?.click()}>
                                    <Music className="h-5 w-5 text-purple-500" />
                                    Audio File
                                </Button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*,video/*,audio/*"
                                    onChange={handleFileUpload}
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
                <form onSubmit={(e) => { e.preventDefault(); handleSendText(); }} className="flex items-end gap-2 max-w-4xl mx-auto">
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`rounded-full transition-colors ${activePanel === "upload" ? "bg-muted text-primary" : ""}`}
                            onClick={() => setActivePanel(activePanel === "upload" ? "none" : "upload")}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`rounded-full transition-colors hidden sm:inline-flex ${activePanel === "gif" ? "bg-muted text-primary" : ""}`}
                            onClick={() => setActivePanel(activePanel === "gif" ? "none" : "gif")}
                        >
                            <div className="font-bold text-[10px] border-2 border-current px-1 py-0.5 rounded-md leading-none">GIF</div>
                        </Button>
                    </div>

                    <div className="flex-1 flex items-end gap-2 bg-muted/40 border rounded-3xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                        <input
                            type="text"
                            value={inputText}
                            onChange={handleTyping}
                            placeholder="Message..."
                            className="flex-1 bg-transparent px-2 py-2 text-[15px] focus:outline-none min-w-0"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`rounded-full h-9 w-9 flex-none transition-colors ${activePanel === "emoji" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setActivePanel(activePanel === "emoji" ? "none" : "emoji")}
                        >
                            <span className="text-xl leading-none block mb-1">😀</span>
                        </Button>
                    </div>

                    <Button
                        type="submit"
                        size="icon"
                        disabled={!inputText.trim()}
                        className="rounded-full h-11 w-11 flex-none shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            ) : (
                <div className="text-center p-3 text-muted-foreground bg-muted/30 rounded-xl">
                    You can only message mutual followers.
                </div>
            )}
        </div>
    );
}
