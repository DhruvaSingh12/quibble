import { FC } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

interface NavigationButtonProps {
  history: string[];
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  setWord: React.Dispatch<React.SetStateAction<string>>;
  fetchWord: (word: string, saveToHistory?: boolean) => void;
}

export const BackButton: FC<NavigationButtonProps> = ({
  history,
  historyIndex,
  setHistoryIndex,
  setWord,
  fetchWord,
}) => {
  const handleBack = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const previousWord = history[newIndex];
      setWord(previousWord);
      fetchWord(previousWord, false);
    }
  };

  return (
    <button
      onClick={handleBack}
      disabled={historyIndex >= history.length - 1}
      className={`transform bg-background rounded-full p-2 transition-colors ${
        historyIndex >= history.length - 1 
          ? 'text-muted-foreground/50 cursor-not-allowed' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
      aria-label="Go back in search history"
    >
      <FaArrowLeft size={22} />
    </button>
  );
};

export const ForwardButton: FC<NavigationButtonProps> = ({
  history,
  historyIndex,
  setHistoryIndex,
  setWord,
  fetchWord,
}) => {
  const handleForward = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const nextWord = history[newIndex];
      setWord(nextWord);
      fetchWord(nextWord, false);
    }
  };

  return (
    <button
      onClick={handleForward}
      disabled={historyIndex <= 0}
      className={`transform bg-background rounded-full p-2 transition-colors ${
        historyIndex <= 0 
          ? 'text-muted-foreground/50 cursor-not-allowed' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
      aria-label="Go forward in search history"
    >
      <FaArrowRight size={22} />
    </button>
  );
};
