"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet, Decoration } from "@tiptap/pm/view";

export const MentionsHighlightExtension = Extension.create({
  name: "mentionsHighlight",

  addProseMirrorPlugins() {
    const mentionRegex = /@([a-zA-Z0-9_-]+)\b/g;
    const hashtagRegex = /#([a-zA-Z0-9_-]+)\b/g;

    return [
      new Plugin({
        key: new PluginKey("mentionsHighlight"),
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: any[] = [];

            const processTextNode = (node: any, pos: number) => {
              const mentionMatches = Array.from(
                node.text.matchAll(
                  mentionRegex,
                ) as IterableIterator<RegExpMatchArray>,
              );
              for (const match of mentionMatches) {
                const start = pos + (match.index || 0);
                const end = start + match[0].length;
                const username = match[1];

                const mentionMark = Decoration.inline(start, end, {
                  class: "mention-highlight tooltip-trigger",
                  "data-username": username,
                  "data-mention": "true",
                  "data-tooltip": "true",
                });
                decorations.push(mentionMark);
              }

              const hashtagMatches = Array.from(
                node.text.matchAll(
                  hashtagRegex,
                ) as IterableIterator<RegExpMatchArray>,
              );
              for (const match of hashtagMatches) {
                const start = pos + (match.index || 0);
                const end = start + match[0].length;
                const hashtag = match[1];

                const hashtagMark = Decoration.inline(start, end, {
                  class: "hashtag-highlight",
                  "data-hashtag": hashtag,
                  "data-tag": "true",
                });
                decorations.push(hashtagMark);
              }
            };

            doc.descendants((node, pos) => {
              if (node.isText) {
                processTextNode(node, pos);
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
