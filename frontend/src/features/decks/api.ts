import { apiClient } from "../../shared/api/client";
import type { Card, CreateCardPayload, CreateDeckWithCardsPayload, Deck, DeckDetails, DeleteCardParams, UpdateCardPayload, UpdateDeckPayload } from "./types";

export const getDecks = async (isArchived: boolean = false): Promise<Deck[]> => {
  return await apiClient.get('decks', {
      searchParams: { archived: String(isArchived) } 
  }).json();
};

export const createDeckWithCards = async (payload: CreateDeckWithCardsPayload): Promise<Deck> => {
  return await apiClient.post('decks', { json: payload }).json();
};

export const getDeckById = async (id: string):Promise<DeckDetails> => {
    return await apiClient.get(`decks/${id}`).json()
}

export const createCard = async (payload:CreateCardPayload):Promise<Card> => {
    return await apiClient.post('cards',{json:payload}).json()
}

export const deleteCard = async ({ cardId, deckId, wordSetId }: DeleteCardParams) => {
  const searchParams = new URLSearchParams();

  if (deckId !== undefined) searchParams.append('deckID', String(deckId));
  if (wordSetId !== undefined) searchParams.append('wordSetID', String(wordSetId));

  return await apiClient.delete(`cards/${cardId}`, { searchParams }).json();
};



export const updateDeck = async (id: number, payload: UpdateDeckPayload): Promise<Deck> => {
  return await apiClient.put(`decks/${id}`, { json: payload }).json();
};

// Удалить колоду
export const deleteDeck = async (id: number) => {
  return await apiClient.delete(`decks/${id}`).json();
};

export const resetDeck = async (id: number) => {
  return await apiClient.delete(`decks/${id}/histories`).json()
}

export const updateCard = async (payload: UpdateCardPayload): Promise<Card> => {
  return await apiClient.put(`cards/${payload.id}`, { json: payload }).json();
};