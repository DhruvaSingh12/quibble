"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { createMentionHashtagDecorations } from "./Decorations";
import { MentionSuggestionService } from "./MentionSuggestionService";

export const MentionsInputExtension = Extension.create({
  name: "mentionsInput",

  addProseMirrorPlugins() {
    const mentionSuggestionsKey = new PluginKey("mentionSuggestions");

    return [
      new Plugin({
        key: new PluginKey("mentionsInputDecorations"),
        props: {
          decorations(state) {
            return createMentionHashtagDecorations(state);
          },
        },
      }),

      new Plugin({
        key: mentionSuggestionsKey,
        view: () => new MentionSuggestionService(),
      }),
    ];
  },
});
