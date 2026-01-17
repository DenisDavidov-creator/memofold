package handler

import (
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type CardHandler struct {
	service card.CardService
}

func NewCardHandler(service card.CardService) *CardHandler {
	return &CardHandler{service: service}
}

func (h *CardHandler) HDCreateCard(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	var input card.CreateCardRequestDTO
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Wrong Json format", http.StatusBadRequest)
	}

	createCard, err := h.service.CreateCard(card.CreateCardToModel(&input), userId)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return

	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(card.CreateCardModelTo(createCard))
}

func (h *CardHandler) HDDeleteCard(w http.ResponseWriter, r *http.Request) {
	cardIdStr := chi.URLParam(r, "cardID")
	deckIdStr := r.URL.Query().Get("deckID")
	wordSetIdStr := r.URL.Query().Get("wordSetID")
	var deleteCard card.DeleteCardParam

	cardId, err := strconv.Atoi(cardIdStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	deleteCard.Id = cardId
	if deckIdStr != "" {
		deckId, err := strconv.Atoi(deckIdStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		deleteCard.DeckId = &deckId
	}

	if wordSetIdStr != "" {
		wordSetId, err := strconv.Atoi(wordSetIdStr)
		if cardIdStr != "" && err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		deleteCard.WordSetId = &wordSetId
	}
	err = h.service.DeleteCard(deleteCard)

	w.WriteHeader(http.StatusOK)
}

func (h *CardHandler) HDUpdateCard(w http.ResponseWriter, r *http.Request) {
	var input card.UpdateCardDTO
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "wrong json type", http.StatusBadRequest)
		return
	}

	changedCard, err := h.service.UpdateCard(card.UpdateCardToModel(&input))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(card.UpdateCardModelTo(changedCard))
}

func (h *CardHandler) HDCreateHardCards(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	var cardIds card.CreateHardWordsDTO

	err := json.NewDecoder(r.Body).Decode(&cardIds)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err = h.service.CreateHardCards(cardIds, userId)

	w.WriteHeader(http.StatusCreated)

}
