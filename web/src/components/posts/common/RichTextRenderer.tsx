"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import TiptapImage from "@tiptap/extension-image";
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
                link: {
                    HTMLAttributes: {
                        class: 'text-primary hover:underline',
                    }
                },
            }),
            TextStyle,
            Typography,
            MentionsHighlightExtension,
            TiptapImage.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-lg max-h-75 object-contain my-2',
                },
            }),
        ],
        content: content,
        editable: false,
        immediatelyRender: false,
    }, [content]);

    useEffect(() => {
        if (!editor) return;

        // 1. Reset editor to the original raw content so Tiptap can parse and autolink everything.
        editor.commands.setContent(content);
        
        // 2. Read the fully parsed HTML
        const parsedHtml = editor.getHTML();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = parsedHtml;
        
        // 3. Extract GIFs
        const imgElements = tempDiv.getElementsByTagName('img');
        const imageUrls = Array.from(imgElements).map(img => img.src);
        setGifUrls(imageUrls);

        // 4. Extract valid links for previews
        const anchorElements = tempDiv.getElementsByTagName('a');
        const extractedLinks = Array.from(anchorElements)
            .filter(a => !a.hasAttribute('data-mention') && !a.hasAttribute('data-tag'))
            .map(a => a.getAttribute('href'))
            .filter((href): href is string => !!href)
            .slice(0, 3); // Limit to 3 previews maximum

        // 5. Transform link text to quibble.xxxxxxx
        Array.from(anchorElements).forEach(a => {
            if (a.hasAttribute('data-mention') || a.hasAttribute('data-tag')) return;
            const href = a.getAttribute('href');
            if (href) {
                let hash = 0;
                for (let i = 0; i < href.length; i++) {
                    hash = ((hash << 5) - hash) + href.charCodeAt(i);
                    hash |= 0;
                }
                const shortHash = Math.abs(hash).toString(36).substring(0, 9);
                a.textContent = `quibble.${shortHash}`;
            }
        });

        // 6. Remove images from HTML to prevent duplicate rendering
        const contentWithoutImages = tempDiv.innerHTML.replace(/<img[^>]*>/g, '');
        editor.commands.setContent(contentWithoutImages);

        // 7. Handle truncation
        const textContent = editor.getText();
        const shouldTruncate = textContent.length > maxLength;
        setNeedsTruncation(shouldTruncate);

        if (shouldTruncate && !isExpanded) {
            const truncatedText = textContent.slice(0, maxLength);
            const lastSpaceIndex = truncatedText.lastIndexOf(" ");
            const finalText = lastSpaceIndex > -1
                ? truncatedText.slice(0, lastSpaceIndex) + "..."
                : truncatedText + "...";
            editor.commands.setContent(`<p>${finalText}</p>`);
        }

        // 8. Set link previews conditionally
        if (isExpanded || !shouldTruncate) {
            setLinks(extractedLinks);
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
                    <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                        {gifUrls.map((url, index) => (
                            <div key={index} className="relative flex-none h-50 md:h-70 rounded-lg overflow-hidden bg-muted/30 snap-start border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={url}
                                    alt={`GIF ${index + 1}`}
                                    className="h-full w-auto min-w-37.5 max-w-[85vw] object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-foreground/90 backdrop-blur-sm text-background text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
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
