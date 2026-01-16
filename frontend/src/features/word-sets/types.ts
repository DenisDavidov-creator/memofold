import type { Card } from "../decks/types";


export interface WordSet {
  id: number;
  name: string;
  isPublic: boolean;
  cardsCount: number
  userId: number
  isDefault: boolean 
}

export interface WordSetDetails extends WordSet {
  cards: Card[];
  isLerning: boolean
}

export interface CreateWordSetPayload {
  name: string;
  isPublic?: boolean;
}

// Пейлоад для добавления карты в набор
// Обычно это та же карта, но привязанная к setId вместо deckId
export interface AddCardToSetPayload {
  wordSetId: number; 
  originalWord: string;
  translation: string;
  originalContext?: string;
  translationContext?: string;
}