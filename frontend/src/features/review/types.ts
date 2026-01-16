export interface ReviewCard {
  id: number;
  // Используем твои названия
  originalWord: string; 
  translation: string;
  originalContext?: string;
  translationContext?: string;
}

export interface CardReviewResult {
  cardId: number;
  isCorrect: boolean;
}

export interface ReviewSessionPayload {
  results: CardReviewResult[];
}