"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import "./editor.css";
import { useRouter } from "next/navigation";
import { MentionsHighlightExtension } from "./mention/MentionsHashtagsExtension";

interface RichTextRendererProps {
    content: string;
    maxLength?: number;
    className?: string;
}

export default function RichTextRenderer({ 
    content, 
    maxLength = 800, 
    className = "" 
}: RichTextRendererProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const router = useRouter();
    const contentRef = useRef<HTMLDivElement>(null);

    // Handle clicks on mentions and hashtags
    const handleEditorClick = useCallback((event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Handle hashtags - direct navigation
        if (target.hasAttribute('data-tag')) {
            event.preventDefault();
            event.stopPropagation();
            const hashtag = target.getAttribute('data-hashtag');
            if (hashtag) {
                router.push(`/hashtag/${hashtag}`);
            }
        }
        
        // Handle mentions - direct navigation
        if (target.hasAttribute('data-mention')) {
            event.preventDefault();
            event.stopPropagation();
            const username = target.getAttribute('data-username');
            if (username) {
                router.push(`/users/${username}`);
            }
        }
    }, [router]);
    
    // Make interactive elements accessible
    useEffect(() => {
        if (!contentRef.current) return;
        
        // Make hashtags accessible
        const hashtagElements = contentRef.current.querySelectorAll('[data-tag="true"]');
        hashtagElements.forEach(el => {
            const hashtag = el.getAttribute('data-hashtag');
            if (!hashtag) return;
            
            // Make focusable
            el.setAttribute('tabindex', '0');
            el.setAttribute('role', 'link');
            el.setAttribute('aria-label', `View posts with hashtag ${hashtag}`);
            
            // Add keyboard handler
            el.addEventListener('keydown', (e: Event) => {
                const keyEvent = e as KeyboardEvent;
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/hashtag/${hashtag}`);
                }
            });
        });
        
        // Make mentions accessible
        const mentionElements = contentRef.current.querySelectorAll('[data-mention="true"]');
        mentionElements.forEach(el => {
            const username = el.getAttribute('data-username');
            if (!username) return;
            
            // Make focusable
            el.setAttribute('tabindex', '0');
            el.setAttribute('role', 'link');
            el.setAttribute('aria-label', `View profile of ${username}`);
            
            // Add keyboard handler
            el.addEventListener('keydown', (e: Event) => {
                const keyEvent = e as KeyboardEvent;
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/users/${username}`);
                }
            });
        });
    }, [content, router]);

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
            }),
            TextStyle,
            Typography,
            MentionsHighlightExtension,
        ],
        content: content,
        editable: false,
        immediatelyRender: false,
    }, [content]); // Add content as dependency to recreate editor when content changes

    useEffect(() => {
        if (!editor) return;

        // Always set the latest content first
        editor.commands.setContent(content);

        // Check if content needs truncation by text length
        const textContent = editor.getText();
        const shouldTruncate = textContent.length > maxLength;
        setNeedsTruncation(shouldTruncate);

        if (shouldTruncate && !isExpanded) {
            // Create truncated version
            const truncatedText = textContent.slice(0, maxLength);
            const lastSpaceIndex = truncatedText.lastIndexOf(" ");
            const finalText = lastSpaceIndex > -1 
                ? truncatedText.slice(0, lastSpaceIndex) + "..."
                : truncatedText + "...";
            
            // Set truncated content
            editor.commands.setContent(`<p>${finalText}</p>`);
        }
    }, [editor, content, maxLength, isExpanded]);
    
    const toggleExpanded = () => setIsExpanded(!isExpanded);
    
    if (!editor) return null;
    
    return (
        <div className={className} onClick={handleEditorClick} ref={contentRef}>
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none [&>.ProseMirror]:outline-none [&>.ProseMirror]:p-0 [&>.ProseMirror]:m-0"
            />
            {needsTruncation && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpanded();
                    }}
                    className="text-primary hover:underline mt-2 block text-sm"
                >
                    {isExpanded ? "Read less" : "Read more"}
                </button>
            )}
        </div>
    );
}
