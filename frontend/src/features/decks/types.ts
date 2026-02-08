export interface Deck {
    id: number
    name: string
    currentLevel: number
    nextReviewDate: string
    cardsCount: number
    isArchived: boolean
    nextPrimaryDirection: boolean
    scheduleId: number  // Added this to match backend
}

export interface Card {
    id: number
    originalWord: string
    translation: string
    originalContext?: string
    translationContext?: string

    deckId?: number;     // Опционально (если добавляем в колоду)
    wordSetId?: number;  // Опционально (если добавляем в набор)
}

export interface DeckDetails extends Deck {
  cards: Card[];
  deckHistories: { reviewDate: string; accuracy: number }[];
  schedule?: { id: number; name: string }; // Added optional schedule object if you need to display the strategy name
}

export interface CreateCardPayload {
    deckId: number;
    originalWord: string;
    translation: string;
    originalContext?: string;
    translationContext?: string;
}

export interface DeleteCardParams {
  cardId: number;
  deckId?: number;     // Если удаляем из колоды
  wordSetId?: number;  // Если удаляем из набора
}

export interface CreateDeckWithCardsPayload {
  name: string;
  scheduleId: number;
  
  // Список ID существующих карт (из word-sets)
  existingCardIds: number[]; 
  
  // Список новых карт (ручной ввод)
  newCards: {
    originalWord: string;
    translation: string;
    originalContext?: string;
    translationContext?: string;
  }[];
  nextReviewDate: string
}

export interface UpdateDeckPayload {
  name?: string;
  scheduleId?: number; // Needed for the Settings modal
  nextReviewDate?: string
}

export interface UpdateCardPayload {
  id: number;
  originalWord: string;
  translation: string;
  originalContext?: string;
  translationContext?: string;
}