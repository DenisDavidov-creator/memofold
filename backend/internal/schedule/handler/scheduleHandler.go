package handler

import (
	"dimplom_harmonic/internal/middleware"
	"dimplom_harmonic/internal/schedule"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ScheduleHandler struct {
	service schedule.ScheduleService
}

func NewScheduleHandler(service schedule.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{service: service}
}

func (h *ScheduleHandler) HDCreateSchedule(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	var input schedule.ScheduleDTO

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Wrong type json", http.StatusBadRequest)
		return
	}

	responseData, err := h.service.CreateSchedule(schedule.CreateScheduleToModels(&input, userId))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(schedule.ScheduleModelTo(responseData))
}

func (h *ScheduleHandler) HDGetAllSchedules(w http.ResponseWriter, r *http.Request) {

	userId := r.Context().Value(middleware.UserIDKey).(int)

	responseData, err := h.service.GetAllSchedules(userId)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(schedule.ScheduleListModelTo(responseData))
}

func (h *ScheduleHandler) HDDeleteSchedule(w http.ResponseWriter, r *http.Request) {
	scheduleIdStr := chi.URLParam(r, "scheduleID")

	var newScheduleId schedule.DeleteScheduleRequest

	err := json.NewDecoder(r.Body).Decode(&newScheduleId)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	scheduleId, err := strconv.Atoi(scheduleIdStr)

	err = h.service.DeleteSchedule(scheduleId, newScheduleId.NewScheduleId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
}

func (h *ScheduleHandler) HDUpdateSchedule(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)
	scheduleIdStr := chi.URLParam(r, "scheduleID")
	scheduleId, err := strconv.Atoi(scheduleIdStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var input schedule.UpdateScheduleDTO

	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Wrong Json format", http.StatusBadRequest)
		return
	}
	responseData, err := h.service.UpdateSchedule(userId, scheduleId, input.Name, input.Levels)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(responseData)
}
