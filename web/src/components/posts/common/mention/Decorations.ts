"use client";

import { DecorationSet, Decoration } from "@tiptap/pm/view";
import { EditorState } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Creates decorations for mentions and hashtags in the document
 * @param state The editor state containing the document
 * @returns DecorationSet with appropriate styling
 */
export function createMentionHashtagDecorations(
  state: EditorState,
): DecorationSet {
  const decorations: Decoration[] = [];
  const mentionRegex = /@([a-zA-Z0-9_-]+)\b/g;
  const hashtagRegex = /#([a-zA-Z0-9_-]+)\b/g;

  // Function to process a text node for mentions and hashtags
  const processTextNode = (node: ProseMirrorNode, pos: number) => {
    if (!node.text) return;
    
    // Process @mentions
    const mentionMatches = Array.from(
      node.text.matchAll(mentionRegex) as IterableIterator<RegExpMatchArray>,
    );
    for (const match of mentionMatches) {
      const start = pos + (match.index || 0);
      const end = start + match[0].length;

      const mentionMark = Decoration.inline(start, end, {
        class: "mention-input",
      });
      decorations.push(mentionMark);
    }

    // Process #hashtags
    const hashtagMatches = Array.from(
      node.text.matchAll(hashtagRegex) as IterableIterator<RegExpMatchArray>,
    );
    for (const match of hashtagMatches) {
      const start = pos + (match.index || 0);
      const end = start + match[0].length;

      const hashtagMark = Decoration.inline(start, end, {
        class: "hashtag-input",
      });
      decorations.push(hashtagMark);
    }
  };

  // Traverse the document to find text nodes
  state.doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (node.isText) {
      processTextNode(node, pos);
    }
  });

  return DecorationSet.create(state.doc, decorations);
}
