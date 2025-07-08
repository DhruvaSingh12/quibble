"use client";

import { UserSuggestion } from "./types";

export class SuggestionPopupUI {
  private container: HTMLElement | null = null;

  constructor(private options = { debugMode: false }) {}

  create() {
    console.log('Creating popup container');
    
    this.remove();
    
    this.container = document.createElement('div');
    this.container.className = 'mentions-suggestions-popup';
    this.container.setAttribute('data-testid', 'mentions-suggestions');
    
    if (this.options.debugMode) {
      this.container.style.border = '2px solid red';
      this.container.style.backgroundColor = 'white';
    }
    
    document.body.appendChild(this.container);
    console.log('Popup container created:', this.container);
    return this.container;
  }

  remove() {
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }

  position(coords: { left: number; bottom: number }) {
    if (!this.container) return;
    
    this.container.style.position = 'absolute';
    this.container.style.zIndex = '9999';
    this.container.style.left = `${coords.left}px`;
    this.container.style.top = `${coords.bottom + window.scrollY}px`;
  }

  render(params: {
    suggestions: UserSuggestion[];
    selectedIndex: number;
    searchQuery: string;
    onSelect: (user: UserSuggestion) => void;
  }) {
    if (!this.container) return;
    
    // Clear existing content
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    const { suggestions, selectedIndex, searchQuery, onSelect } = params;

    // Show message if no suggestions
    if (suggestions.length === 0) {
      const message = document.createElement('div');
      message.className = 'px-3 py-2 text-sm text-muted-foreground';
      message.textContent = searchQuery 
        ? `No users found for "${searchQuery}"`
        : 'Start typing to search for users';
      this.container.appendChild(message);
      return;
    }

    // Create elements for each suggestion
    suggestions.forEach((user, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-primary-foreground transition-colors ${
        selectedIndex === index ? 'bg-primary text-primary-foreground' : ''
      }`;
      
      item.onclick = () => onSelect(user);
      
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
      this.container!.appendChild(item);
    });
  }

  get isVisible() {
    return !!this.container;
  }
}
