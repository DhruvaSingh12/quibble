export interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface MentionRange {
  from: number;
  to: number;
}

export interface SuggestionPopupOptions {
  className?: string;
  testId?: string;
  debugMode?: boolean;
}
