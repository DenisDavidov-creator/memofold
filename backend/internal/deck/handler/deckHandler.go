package handler

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/deck"
	"dimplom_harmonic/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type DeckHandler struct {
	service deck.DeckService
}

func NewDeckHandler(service deck.DeckService) *DeckHandler {
	return &DeckHandler{service: service}
}

func (h *DeckHandler) HDCreateDeck(w http.ResponseWriter, r *http.Request) {

	userId := r.Context().Value(middleware.UserIDKey).(int)
	var input deck.CreateDeckRequestDTO
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Wrong format JSON", http.StatusBadRequest)
		return
	}

	createDeck, err := h.service.CreateDeck(input, userId)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(map[string]string{
			"error": err.Error(),
		})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createDeck)
}

func (h *DeckHandler) HDGetDecks(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	typeArchStr := r.URL.Query().Get("archived")

	typeArch, err := strconv.ParseBool(typeArchStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	decks, err := h.service.GetDecks(userId, typeArch)
	if err != nil {
		http.Error(w, "decks don't find", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(decks)
}

func (h *DeckHandler) HDGetDeckByID(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)

	strId := chi.URLParam(r, "deckID")

	deckId, err := strconv.Atoi(strId)
	if err != nil {
		http.Error(w, "Invalid deck_id", http.StatusBadRequest)
		return
	}
	deckG, err := h.service.GetDeckByID(userId, deckId)
	if err != nil {
		http.Error(w, "This deck not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(deck.DeckByIdModetlTo(deckG))
}

func (h *DeckHandler) HDReview(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)

	strId := chi.URLParam(r, "deckID")
	deckId, err := strconv.Atoi(strId)
	if err != nil {
		http.Error(w, "Invalid deck_id", http.StatusBadRequest)
		return
	}

	var input deck.ReviewResultsDTO
	err = json.NewDecoder(r.Body).Decode(&input)
	domainResults := make([]models.CardReveiewResult, len(input.Results))

	for i, value := range input.Results {
		domainResults[i] = models.CardReveiewResult{
			CardId:    value.CardId,
			IsCorrect: value.IsCorrect,
		}
	}

	responseData, err := h.service.Review(userId, deckId, domainResults)
	if err != nil {
		http.Error(w, "This deck not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(responseData)
}

func (h *DeckHandler) HDUpdateDeck(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	deckStrId := chi.URLParam(r, "deckID")
	deckId, err := strconv.Atoi(deckStrId)
	if err != nil {
		http.Error(w, "", http.StatusBadRequest)
		return
	}
	var input deck.UpdateDeckRequestDTO

	err = json.NewDecoder(r.Body).Decode(&input)

	if err != nil {
		http.Error(w, "Wrong Json Format", http.StatusBadRequest)
		return
	}
	updatedDecks, err := h.service.UpdateDeck(userId, deckId, input)

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(&updatedDecks)
}

func (h *DeckHandler) HDRestart(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	deckStrId := chi.URLParam(r, "deckID")
	deckId, err := strconv.Atoi(deckStrId)
	if err != nil {
		http.Error(w, "Error strconv", http.StatusBadRequest)
		return
	}

	err = h.service.RestartProgressDeck(userId, deckId)
	if err != nil {
		http.Error(w, "error", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
}

func (h *DeckHandler) HDDeleteDeck(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	deckIdStr := chi.URLParam(r, "deckID")
	deckId, err := strconv.Atoi(deckIdStr)
	if err != nil {
		http.Error(w, "Don't get deckId", http.StatusBadRequest)
		return
	}

	err = h.service.DeleteDeck(deckId, userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
}
