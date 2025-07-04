"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import "./editor/styles.css";

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
    const [displayContent, setDisplayContent] = useState(content);
    const [needsTruncation, setNeedsTruncation] = useState(false);

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
        <div className={className}>
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none [&>.ProseMirror]:outline-none [&>.ProseMirror]:p-0 [&>.ProseMirror]:m-0"
            />
            {needsTruncation && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
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
