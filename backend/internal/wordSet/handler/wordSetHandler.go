package handler

import (
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/middleware"
	wordset "dimplom_harmonic/internal/wordSet"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type WordSetHandler struct {
	service wordset.WordSetService
}

func NewWordSetHandler(service wordset.WordSetService) *WordSetHandler {
	return &WordSetHandler{service: service}
}

func (h *WordSetHandler) HDCreateWordSet(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	var input wordset.WordSetDTO

	err := json.NewDecoder(r.Body).Decode(&input)

	if err != nil {
		http.Error(w, "Wrong Json Format", http.StatusBadRequest)
		return
	}

	createWordSet, err := h.service.CreateWordSet(&input, userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return

	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wordset.WordSetModelTo(createWordSet))
}

func (h *WordSetHandler) HDGetAllWordSet(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)

	typeWS := r.URL.Query().Get("type")

	wordSets, err := h.service.GetAllWordSet(userId, typeWS)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return

	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wordSets)
}

func (h *WordSetHandler) HDGetWordSetById(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	wordSetIdStr := chi.URLParam(r, "wordSetID")
	wordSetId, err := strconv.Atoi(wordSetIdStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	wordSetM, err := h.service.GetWordSetByID(userId, wordSetId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wordset.WordSetGetByIdModelTo(wordSetM))
}

func (h *WordSetHandler) HDUpdateWordSet(w http.ResponseWriter, r *http.Request) {
	var input wordset.WordSetDTO
	wordSetIdStr := chi.URLParam(r, "wordSetID")
	wordSetId, err := strconv.Atoi(wordSetIdStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	wordSetUpdated, err := h.service.UpdateWordSet(wordSetId, input.Name, input.IsPublic)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(wordSetUpdated)
}

func (h *WordSetHandler) HDDeleteWordSet(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)

	wordSetIdStr := chi.URLParam(r, "wordSetID")
	wordSetId, err := strconv.Atoi(wordSetIdStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = h.service.DeleteWordSet(userId, wordSetId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func (h *WordSetHandler) HDCopyWordSet(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)

	wordSetIdStr := chi.URLParam(r, "wordSetID")
	wordSetId, err := strconv.Atoi(wordSetIdStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	wordSetC, err := h.service.CopyWordSet(wordSetId, userId)
	if err != nil {
		http.Error(w, "Internal error", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(wordset.WordSetGetModelTo(wordSetC))
}

func (h *WordSetHandler) HDCreateBatchCards(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	var cards card.CreateCardsDTO

	wordSetIdStr := chi.URLParam(r, "wordSetID")
	wordSetId, err := strconv.Atoi(wordSetIdStr)
	if err != nil {
		http.Error(w, "Internal error12", http.StatusBadRequest)
		return
	}

	err = json.NewDecoder(r.Body).Decode(&cards)
	if err != nil {
		http.Error(w, "Wrong JSON format", http.StatusBadRequest)
		return
	}

	h.service.CreateBatchCards(card.CreateCardsToModel(cards.Cards, wordSetId), userId)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}
