import { apiClient } from "../../shared/api/client";
import type { Card, DeleteCardParams } from "../decks/types";
import type { AddCardToSetPayload, CreateWordSetPayload, WordSet, WordSetDetails } from "./types";


export const getWordSets = async (type: 'my' | 'public' = 'my'): Promise<WordSet[]> => {
  return await apiClient.get('word-sets', { 
      searchParams: { type } 
  }).json();  
};

// Новый метод копирования
export const copyWordSet = async (id: number): Promise<WordSet> => {
  return await apiClient.post(`word-sets/${id}/copy`).json();
};

export const createWordSet = async (payload: CreateWordSetPayload): Promise<WordSet> => {
  return await apiClient.post('word-sets', { json: payload }).json();
};

export const getWordSetById = async (id: string): Promise<WordSetDetails> => {
  return await apiClient.get(`word-sets/${id}`).json();
};

// Добавить карту в набор
export const addCardToSet = async (payload: AddCardToSetPayload): Promise<Card> => {
  // Проверь URL на бэкенде. Часто это POST /api/word-sets/{id}/cards
  return await apiClient.post(`cards`, {json: payload}).json();
};

export const updateWordSet = async (id: number, payload: { name?: string; isPublic?: boolean }): Promise<WordSet> => {
  return await apiClient.put(`word-sets/${id}`, { json: payload }).json();
};

// Удалить набор
export const deleteWordSet = async (id: number) => {
  return await apiClient.delete(`word-sets/${id}`).json();
};



export const deleteCard = async ({ cardId, deckId, wordSetId }: DeleteCardParams) => {
  const searchParams = new URLSearchParams();
  
  if (deckId !== undefined) searchParams.append('deckID', String(deckId));
  if (wordSetId !== undefined) searchParams.append('wordSetID', String(wordSetId));
  return await apiClient.delete(`cards/${cardId}`, { searchParams }).json();
};

export const    markCardsAsHard = async (cardIds: number[]) => {
  return await apiClient.post('cards/hard', { json: { cardIds } }).json();
};

export interface AddCardsToSetPayload {
  wordSetId: number;
  cards: {
    originalWord: string;
    translation: string;
    originalContext?: string;
    translationContext?: string;
  }[];
}

// Эндпоинт
export const addCardsToSet = async (payload: AddCardsToSetPayload) => {
  // Шлем POST /word-sets/{id}/cards/batch
  return await apiClient.post(`word-sets/${payload.wordSetId}/cards/batch`, { 
    json: { cards: payload.cards } 
  }).json();
};