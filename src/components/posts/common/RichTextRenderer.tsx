"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Image from "next/image";
import "./editor.css";
import { useRouter } from "next/navigation";
import { MentionsHighlightExtension } from "./mention/MentionsHashtagsExtension";
import LinkPreview from "./LinkPreview";

interface RichTextRendererProps {
    content: string;
    maxLength?: number;
    className?: string;
    showLinkPreviews?: boolean;
}

export default function RichTextRenderer({
    content,
    maxLength = 800,
    className = "",
    showLinkPreviews = true
}: RichTextRendererProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const [links, setLinks] = useState<string[]>([]);
    const [gifUrls, setGifUrls] = useState<string[]>([]);
    const router = useRouter();
    const contentRef = useRef<HTMLDivElement>(null);

    // Handle clicks on mentions, hashtags, and links
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

        // Handle links - open in new tab
        if (target.tagName === 'A' && target.hasAttribute('href')) {
            event.preventDefault();
            event.stopPropagation();
            const href = target.getAttribute('href');
            if (href) {
                window.open(href, '_blank', 'noopener,noreferrer');
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

        // Make links accessible
        const linkElements = contentRef.current.querySelectorAll('a[href]');
        linkElements.forEach(el => {
            const href = el.getAttribute('href');
            if (!href) return;

            // Make focusable (already is for <a> tags)
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
            el.setAttribute('aria-label', `Open link to ${href} in new tab`);

            // Add keyboard handler
            el.addEventListener('keydown', (e: Event) => {
                const keyEvent = e as KeyboardEvent;
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(href, '_blank', 'noopener,noreferrer');
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
            Link.configure({
                HTMLAttributes: {
                    class: 'text-primary hover:underline',
                }
            }),
            TiptapImage.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-lg max-h-[300px] object-contain my-2',
                },
            }),
        ],
        content: content,
        editable: false,
        immediatelyRender: false,
    }, [content]);

    useEffect(() => {
        if (!editor) return;

        // Extract GIF/image URLs from content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const imgElements = tempDiv.getElementsByTagName('img');
        const imageUrls = Array.from(imgElements).map(img => img.src);
        setGifUrls(imageUrls);

        // Remove images from the HTML content for text display
        const contentWithoutImages = content.replace(/<img[^>]*>/g, '');

        // Always set the content without images
        editor.commands.setContent(contentWithoutImages);

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

        // Extract links from content when expanded or not truncated
        if (isExpanded || !shouldTruncate) {
            const doc = editor.getHTML();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = doc;

            const linkElements = tempDiv.getElementsByTagName('a');
            const newLinks = Array.from(linkElements)
                .map(a => a.getAttribute('href'))
                .filter((href): href is string => !!href)
                .slice(0, 3); // Limit to 3 previews maximum

            setLinks(newLinks);
        } else {
            setLinks([]);
        }
    }, [editor, content, maxLength, isExpanded]);

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    if (!editor) return null;

    return (
        <div className={className}>
            {/* GIF Grid Display */}
            {gifUrls.length > 0 && (
                <div className="mb-3">
                    <div className={`grid gap-2 ${gifUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {gifUrls.map((url, index) => (
                            <div key={index} className="relative overflow-hidden bg-card rounded-lg">
                                <Image
                                    src={url}
                                    alt={`GIF ${index + 1}`}
                                    width={500}
                                    height={400}
                                    className="w-full h-auto max-h-[400px] object-contain"
                                    unoptimized
                                />
                                <div className="absolute bottom-2 right-2 bg-foreground text-card text-[8px] font-semibold px-2 py-1 rounded">
                                    GIF
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Text Content */}
            <div onClick={handleEditorClick} ref={contentRef}>
                <EditorContent
                    editor={editor}
                    className="prose prose-sm max-w-none [&>.ProseMirror]:outline-none [&>.ProseMirror]:p-0 [&>.ProseMirror]:m-0"
                />
            </div>

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
            {showLinkPreviews && links.map((url, index) => (
                <LinkPreview key={`${url}-${index}`} url={url} />
            ))}
        </div>
    );
}
