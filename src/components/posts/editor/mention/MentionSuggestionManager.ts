"use client";

import { getFollowingSuggestions } from "../actions";

// Type for user suggestion
export interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Class to manage mention suggestion popup
 */
export class MentionSuggestionManager {
  private view: any;
  private popupContainer: HTMLElement | null = null;
  private searching = false;
  private searchQuery = '';
  private range: { from: number; to: number } | null = null;
  private suggestions: UserSuggestion[] = [];
  private selectedIndex = 0;

  /**
   * Create the suggestion popup
   */
  createPopupContainer() {
    console.log('Creating popup container');
    
    // Remove existing container if present
    this.removePopupContainer();
    
    // Create new container
    this.popupContainer = document.createElement('div');
    this.popupContainer.className = 'mentions-suggestions-popup';
    this.popupContainer.setAttribute('data-testid', 'mentions-suggestions');
    
    // Debug styling to make it more visible during development
    this.popupContainer.style.border = '2px solid red';
    this.popupContainer.style.backgroundColor = 'white';
    
    document.body.appendChild(this.popupContainer);
    console.log('Popup container created:', this.popupContainer);
  }
  
  /**
   * Remove the suggestion popup
   */
  removePopupContainer() {
    if (!this.popupContainer) return;
    
    document.body.removeChild(this.popupContainer);
    this.popupContainer = null;
  }
  
  /**
   * Render the suggestions in the popup
   */
  renderSuggestions() {
    console.log('Rendering suggestions:', {
      hasPopupContainer: !!this.popupContainer,
      hasRange: !!this.range,
      hasView: !!this.view,
      suggestionsCount: this.suggestions.length,
      selectedIndex: this.selectedIndex
    });
    
    if (!this.popupContainer || !this.range || !this.view) {
      console.log('Missing required elements for rendering suggestions');
      return;
    }
    
    // Position the popup relative to the cursor
    const editorView = this.view;
    const coords = editorView.coordsAtPos(this.range.from);
    const editorPosition = editorView.dom.getBoundingClientRect();
    
    console.log('Popup positioning:', { coords, editorPosition });
    
    this.popupContainer.style.position = 'absolute';
    this.popupContainer.style.zIndex = '9999'; // Ensure high z-index to display above other elements
    this.popupContainer.style.left = `${coords.left}px`;
    this.popupContainer.style.top = `${coords.bottom + window.scrollY}px`;
    
    // Add a debugging visual marker
    this.popupContainer.style.border = '2px solid red';
    
    // Clear existing content
    while (this.popupContainer.firstChild) {
      this.popupContainer.removeChild(this.popupContainer.firstChild);
    }
    
    // If no suggestions, show a message
    if (this.suggestions.length === 0) {
      const message = document.createElement('div');
      message.className = 'px-3 py-2 text-sm text-muted-foreground';
      message.textContent = this.searchQuery 
        ? `No users found for "${this.searchQuery}"`
        : 'Start typing to search for users';
      this.popupContainer.appendChild(message);
      return;
    }
    
    // Create elements for each suggestion
    this.suggestions.forEach((user, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-primary-foreground transition-colors ${
        this.selectedIndex === index ? 'bg-primary text-primary-foreground' : ''
      }`;
      
      // Handle click on suggestion
      item.onclick = () => this.insertMention(user);
      
      // Avatar
      const avatar = document.createElement('img');
      avatar.src = user.avatarUrl || '/avatar-placeholder.png';
      avatar.className = 'w-6 h-6 rounded-full flex-shrink-0';
      avatar.alt = user.displayName || user.username;
      item.appendChild(avatar);
      
      // Text container
      const textContainer = document.createElement('div');
      textContainer.className = 'flex-1 overflow-hidden';
      
      // Display name
      const displayName = document.createElement('div');
      displayName.className = 'font-medium text-sm truncate';
      displayName.textContent = user.displayName || user.username;
      textContainer.appendChild(displayName);
      
      // Username
      const username = document.createElement('div');
      username.className = 'text-xs text-muted-foreground truncate';
      username.textContent = `@${user.username}`;
      textContainer.appendChild(username);
      
      item.appendChild(textContainer);
      if (this.popupContainer) {
        this.popupContainer.appendChild(item);
      }
    });
  }
  
  /**
   * Insert mention for selected user
   */
  insertMention(user: UserSuggestion) {
    if (!this.view || !this.range) return;
    
    const { state, dispatch } = this.view;
    
    console.log('Inserting mention for user:', user.username);
    console.log('Range:', this.range);
    
    // Delete the current @mention text (including the @)
    const tr = state.tr.delete(
      this.range.from, // From the @ character
      this.range.to
    );
    
    // Insert the username with trailing space
    tr.insertText(`@${user.username} `);
    
    console.log('Transaction created, dispatching');
    
    // Apply the transaction
    dispatch(tr);
    
    // Focus back on editor
    this.view.focus();
    
    // Clear suggestion state
    this.clearSuggestions();
  }
  
  /**
   * Clear all suggestion state
   */
  clearSuggestions() {
    this.range = null;
    this.searchQuery = '';
    this.suggestions = [];
    this.selectedIndex = 0;
    this.removePopupContainer();
  }
  
  /**
   * Load suggestions for a search query
   */
  async loadSuggestions(query: string) {
    if (this.searching) return;
    
    this.searching = true;
    console.log('Loading suggestions for:', query);
    
    try {
      // If query is empty, still fetch some initial suggestions
      const users = await getFollowingSuggestions(query || '');
      console.log('Received suggestions:', users);
      
      if (users && Array.isArray(users)) {
        this.suggestions = users;
      } else {
        console.log('Invalid response format from getFollowingSuggestions');
        this.suggestions = [];
      }
      
      // Always render, even if no suggestions - shows "No users found"
      this.renderSuggestions();
    } catch (error) {
      console.error('Error fetching mention suggestions:', error);
      this.suggestions = [];
      this.renderSuggestions();
    } finally {
      this.searching = false;
    }
  }
  
  /**
   * Set current view and update suggestions
   */
  update(updatedView: any) {
    this.view = updatedView;
    
    // Get current cursor position
    const { state } = updatedView;
    const { selection } = state;
    const { from } = selection;
    
    // Only show suggestions if we're in a text node
    const $pos = state.doc.resolve(from);
    if (!$pos.parent.isTextblock) {
      this.clearSuggestions();
      return;
    }
    
    // Get text before cursor in current paragraph
    const currentPos = $pos.start();
    const textBeforeCursor = state.doc.textBetween(
      currentPos, 
      from, 
      '\n', 
      '\0'
    );
    
    console.log('Text before cursor:', textBeforeCursor);
    
    // Look for the @ symbol closest to the cursor
    const atIndex = textBeforeCursor.lastIndexOf('@');
    console.log('@ index:', atIndex);
    
    // If there's an @ symbol
    if (atIndex !== -1) {
      console.log('Found @ at index', atIndex);
      
      // Check if it's at the start of text or has whitespace/punctuation before it
      const isValidStart = (
        atIndex === 0 || 
        /[\s.,!?;:()\[\]{}]/.test(textBeforeCursor[atIndex - 1])
      );
      
      console.log('Is valid start?', isValidStart);
      
      if (isValidStart) {
        const textAfterAt = textBeforeCursor.substring(atIndex + 1);
        console.log('Text after @:', textAfterAt);
        
        // Always trigger suggestions when just the @ is typed
        if (textAfterAt === '') {
          console.log('Empty search, showing all suggestions');
          this.searchQuery = '';
          this.range = { from: currentPos + atIndex, to: from };
          this.selectedIndex = 0;
          this.createPopupContainer();
          this.loadSuggestions('');
          return;
        }
        
        // Only show suggestions if we're not in the middle of a word
        // (the character after @ must be part of a username or nothing)
        if (/^[a-zA-Z0-9_-]*$/.test(textAfterAt)) {
          const newSearchQuery = textAfterAt;
          const queryStart = currentPos + atIndex;
          
          console.log('Found mention trigger, search query:', newSearchQuery);
          console.log('Query start:', queryStart, 'Current pos:', from);
          
          // Set range for replacing with the selected suggestion later
          this.range = { from: queryStart, to: from };
          
          // If query has changed, load new suggestions
          if (newSearchQuery !== this.searchQuery) {
            console.log('Loading new suggestions for:', newSearchQuery);
            this.searchQuery = newSearchQuery;
            this.selectedIndex = 0;
            
            // Create popup container if it doesn't exist
            this.createPopupContainer();
            
            // Load suggestions
            this.loadSuggestions(this.searchQuery);
          }
          return;
        }
      }
    }
    
    // Not typing a valid mention
    this.clearSuggestions();
  }
  
  /**
   * Handle keyboard events
   */
  handleKeyDown(view: any, event: KeyboardEvent): boolean {
    // Close suggestions with Escape only
    if (event.key === 'Escape' && this.popupContainer) {
      event.preventDefault();
      this.clearSuggestions();
      return true;
    }
    return false;
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    this.removePopupContainer();
  }
}
