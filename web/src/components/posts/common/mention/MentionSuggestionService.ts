"use client";

import { MentionRange, UserSuggestion } from "./types";
import { SuggestionPopupUI } from "./SuggestionPopupUI";
import { getFollowingSuggestions } from "../../create/actions";
import { EditorView } from "@tiptap/pm/view";

export class MentionSuggestionService {
  private view: EditorView | null = null;
  private searching = false;
  private searchQuery = '';
  private lastFetchedQuery: string | null = null;
  private range: MentionRange | null = null;
  private suggestions: UserSuggestion[] = [];
  private selectedIndex = 0;
  private popup: SuggestionPopupUI;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options = { debugMode: false }) {
    this.popup = new SuggestionPopupUI(options);
  }

  private async loadSuggestions(query: string) {
    // Skip if already fetched for this exact query
    if (this.lastFetchedQuery === query && this.suggestions.length > 0) {
      this.renderSuggestions();
      return;
    }

    // Debounce to avoid rapid-fire calls
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      if (this.searching) return;

      this.searching = true;

      try {
        const users = await getFollowingSuggestions(query || '');

        if (users && Array.isArray(users)) {
          this.suggestions = users;
        } else {
          this.suggestions = [];
        }

        this.lastFetchedQuery = query;
        this.renderSuggestions();
      } catch (error) {
        console.error('Error fetching mention suggestions:', error);
        this.suggestions = [];
        this.renderSuggestions();
      } finally {
        this.searching = false;
      }
    }, 300);
  }

  private renderSuggestions() {
    if (!this.range || !this.view) return;

    const coords = this.view.coordsAtPos(this.range.from);
    this.popup.position(coords);
    
    this.popup.render({
      suggestions: this.suggestions,
      selectedIndex: this.selectedIndex,
      searchQuery: this.searchQuery,
      onSelect: (user) => this.insertMention(user)
    });
  }

  private insertMention(user: UserSuggestion) {
    if (!this.view || !this.range) return;
    
    const { state, dispatch } = this.view;
    
    const tr = state.tr.delete(this.range.from, this.range.to)
                      .insertText(`@${user.username} `);
    
    dispatch(tr);
    this.view.focus();
    this.clearSuggestions();
  }

  clearSuggestions() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.range = null;
    this.searchQuery = '';
    this.lastFetchedQuery = null;
    this.suggestions = [];
    this.selectedIndex = 0;
    this.popup.remove();
  }

  update(updatedView: EditorView) {
    this.view = updatedView;
    
    const { state } = updatedView;
    const { selection } = state;
    const { from } = selection;
    
    const $pos = state.doc.resolve(from);
    if (!$pos.parent.isTextblock) {
      this.clearSuggestions();
      return;
    }
    
    const currentPos = $pos.start();
    const textBeforeCursor = state.doc.textBetween(currentPos, from, '\n', '\0');
    
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) {
      this.clearSuggestions();
      return;
    }
    
    const isValidStart = atIndex === 0 || /[\s.,!?;:()\[\]{}]/.test(textBeforeCursor[atIndex - 1]);
    if (!isValidStart) {
      this.clearSuggestions();
      return;
    }
    
    const textAfterAt = textBeforeCursor.substring(atIndex + 1);
    
    if (textAfterAt === '') {
      this.range = { from: currentPos + atIndex, to: from };
      
      if (this.searchQuery !== '' || this.lastFetchedQuery === null) {
        this.searchQuery = '';
        this.selectedIndex = 0;
        this.popup.create();
        this.loadSuggestions('');
      }
      return;
    }
    
    if (/^[a-zA-Z0-9_-]*$/.test(textAfterAt)) {
      const newSearchQuery = textAfterAt;
      const queryStart = currentPos + atIndex;
      
      this.range = { from: queryStart, to: from };
      
      if (newSearchQuery !== this.searchQuery) {
        this.searchQuery = newSearchQuery;
        this.selectedIndex = 0;
        this.popup.create();
        this.loadSuggestions(this.searchQuery);
      }
      return;
    }
    
    this.clearSuggestions();
  }

  handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
    if (event.key === 'Escape' && this.popup.isVisible) {
      event.preventDefault();
      this.clearSuggestions();
      return true;
    }
    return false;
  }

  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.popup.remove();
  }
}
