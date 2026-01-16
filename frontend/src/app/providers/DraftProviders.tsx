import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DraftCard } from "../../features/deckBuilder/types";


interface DraftContextType {
  draftCards: DraftCard[];
  addToDraft: (cards: DraftCard[]) => void;
  removeFromDraft: (originalWord: string) => void; // Удаляем по слову, т.к. ID может не быть
  clearDraft: () => void;
  isInDraft: (originalWord: string) => boolean;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

const STORAGE_KEY = 'memofold_draft';

export const DraftProvider = ({ children }: { children: ReactNode }) => {
  const [draftCards, setDraftCards] = useState<DraftCard[]>([]);

  // 1. Загрузка из LocalStorage при старте
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDraftCards(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  // 2. Сохранение в LocalStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftCards));
  }, [draftCards]);

  const addToDraft = (cards: DraftCard[]) => {
    setDraftCards((prev) => {
      // Фильтруем дубликаты по слову (originalWord)
      const newCards = cards.filter(
        (c) => !prev.some((p) => p.originalWord.toLowerCase() === c.originalWord.toLowerCase())
      );
      return [...prev, ...newCards];
    });
  };

  const removeFromDraft = (word: string) => {
    setDraftCards((prev) => prev.filter((c) => c.originalWord !== word));
  };

  const clearDraft = () => {
    setDraftCards([]);
  };

  const isInDraft = (word: string) => {
    return draftCards.some((c) => c.originalWord.toLowerCase() === word.toLowerCase());
  };

  return (
    <DraftContext.Provider value={{ draftCards, addToDraft, removeFromDraft, clearDraft, isInDraft }}>
      {children}
    </DraftContext.Provider>
  );
};

// Хук для удобного использования
export const useDraft = () => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft must be used within a DraftProvider');
  }
  return context;
};