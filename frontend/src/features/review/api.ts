import { apiClient } from "../../shared/api/client";
import type { ReviewSessionPayload } from "./types";


// Отправить результаты
export const submitReview = async (deckId: string, payload: ReviewSessionPayload) => {
  return await apiClient.post(`decks/${deckId}/review`, { json: payload }).json();
};