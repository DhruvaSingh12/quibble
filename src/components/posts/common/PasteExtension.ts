import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DOMParser } from '@tiptap/pm/model';

// Helper functions for processing content
const processHtml = (html: string): string => {
    let processedHtml = html;
    
    // Remove Word/Office specific tags
    processedHtml = processedHtml
        .replace(/<o:p\s*\/?>|<\/o:p>/gi, '')
        .replace(/<w:[^>]*>|<\/w:[^>]*>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<!\[if[^>]*>[\s\S]*?<!\[endif\]>/gi, '')
        .replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<meta[^>]*>/gi, '')
        .replace(/<link[^>]*>/gi, '');
    
    // Convert div elements to paragraphs
    processedHtml = processedHtml
        .replace(/<div[^>]*>/gi, '<p>')
        .replace(/<\/div>/gi, '</p>');
    
    // Handle inline styles for common formatting
    processedHtml = processedHtml
        .replace(/<span[^>]*style="[^"]*font-weight:\s*(bold|700|bolder)[^"]*"[^>]*>/gi, '<strong>')
        .replace(/<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>/gi, '<em>')
        .replace(/<span[^>]*style="[^"]*text-decoration:\s*line-through[^"]*"[^>]*>/gi, '<s>')
        .replace(/<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>/gi, '<u>');
    
    // Convert deprecated tags
    processedHtml = processedHtml
        .replace(/<b\b[^>]*>/gi, '<strong>')
        .replace(/<\/b>/gi, '</strong>')
        .replace(/<i\b[^>]*>/gi, '<em>')
        .replace(/<\/i>/gi, '</em>')
        .replace(/<strike\b[^>]*>/gi, '<s>')
        .replace(/<\/strike>/gi, '</s>')
        .replace(/<del\b[^>]*>/gi, '<s>')
        .replace(/<\/del>/gi, '</s>');
    
    // Clean up remaining span tags
    processedHtml = processedHtml
        .replace(/<span[^>]*>/gi, '')
        .replace(/<\/span>/gi, '');
    
    // Handle entities
    processedHtml = processedHtml
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, '…');
    
    // Clean up whitespace
    processedHtml = processedHtml
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        .replace(/<p[^>]*>&nbsp;<\/p>/gi, '')
        .trim();
    
    // Ensure proper paragraph structure
    if (processedHtml && !processedHtml.includes('<p>') && !processedHtml.includes('<ul>') && !processedHtml.includes('<ol>') && !processedHtml.includes('<blockquote>')) {
        processedHtml = `<p>${processedHtml}</p>`;
    }
    
    return processedHtml;
};

// Process plain text content
const processText = (text: string): string => {
    const processedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
    
    // Split into paragraphs by double line breaks
    const paragraphs = processedText
        .split(/\n\s*\n/)
        .map(p => p.replace(/\n/g, ' ').trim())
        .filter(p => p.length > 0);
    
    if (paragraphs.length === 0) return `<p>${text}</p>`;
    if (paragraphs.length === 1) return `<p>${paragraphs[0]}</p>`;
    
    // Convert to HTML paragraphs
    return paragraphs.map(p => `<p>${p}</p>`).join('');
};

export interface PasteExtensionOptions {
    onPasteFiles?: (files: File[]) => void;
}

export const PasteExtension = Extension.create<PasteExtensionOptions>({
    name: 'pasteExtension',
    
    addOptions() {
        return {
            onPasteFiles: undefined,
        }
    },

    addProseMirrorPlugins() {
        const options = this.options;
        return [
            new Plugin({
                key: new PluginKey('pasteExtension'),
                props: {
                    handlePaste: (view, event) => {
                        // Get clipboard data
                        const clipboardData = event.clipboardData;
                        if (!clipboardData) return false;
                        
                        // Check for media files (images/videos)
                        if (clipboardData.files && clipboardData.files.length > 0) {
                            const files = Array.from(clipboardData.files);
                            const mediaFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
                            
                            if (mediaFiles.length > 0 && options.onPasteFiles) {
                                options.onPasteFiles(mediaFiles);
                                return true; // Handled
                            }
                        }

                        // Try to get HTML content first
                        const html = clipboardData.getData('text/html');
                        const text = clipboardData.getData('text/plain');
                        
                        if (html) {
                            // Process HTML content
                            const processedHtml = processHtml(html);
                            
                            // Create a temporary element to parse the HTML
                            const tempElement = document.createElement('div');
                            tempElement.innerHTML = processedHtml;
                            
                            // Parse the content using ProseMirror's DOMParser
                            const parser = DOMParser.fromSchema(view.state.schema);
                            const parsedSlice = parser.parseSlice(tempElement);
                            
                            // Insert the parsed content
                            view.dispatch(view.state.tr.replaceSelection(parsedSlice));
                            
                            return true;
                        } else if (text) {
                            // Process plain text
                            const processedText = processText(text);
                            
                            // Create HTML from processed text
                            const tempElement = document.createElement('div');
                            tempElement.innerHTML = processedText;
                            
                            // Parse and insert
                            const parser = DOMParser.fromSchema(view.state.schema);
                            const parsedSlice = parser.parseSlice(tempElement);
                            
                            view.dispatch(view.state.tr.replaceSelection(parsedSlice));
                            
                            return true;
                        }
                        
                        return false;
                    },
                },
            }),
        ];
    },
});
