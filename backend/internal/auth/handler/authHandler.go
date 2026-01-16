package handler

import (
	"dimplom_harmonic/internal/auth"
	"dimplom_harmonic/internal/middleware"
	"encoding/json"
	"net/http"
	"time"
)

type UserHandler struct {
	service auth.UserService
}

func NewUserHandler(service auth.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) SetRefreshCookie(w http.ResponseWriter, refreshToken string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   false,
		Path:     "/",
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *UserHandler) HandlerRegisterUser(w http.ResponseWriter, r *http.Request) {
	var input auth.RegisterUserRequestDTO
	err := json.NewDecoder(r.Body).Decode(&input)

	if err != nil {
		http.Error(w, "Wrong format json", http.StatusBadRequest)
		return
	}

	createdUser, err := h.service.RegisterUser(auth.RegisterUserToModel(&input))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(auth.ModelToUserDTO(createdUser))
}

func (h *UserHandler) HandlerLoginUser(w http.ResponseWriter, r *http.Request) {

	var userData auth.LoginUserRequestDTO

	err := json.NewDecoder(r.Body).Decode(&userData)
	if err != nil {
		http.Error(w, "Wrong format json", http.StatusBadRequest)
		return
	}

	at, rt, err := h.service.LoginUser(userData.Email, userData.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.SetRefreshCookie(w, rt)

	json.NewEncoder(w).Encode(map[string]string{"accessToken": at})
}

func (h *UserHandler) HandlerGetProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	profile, stats, err := h.service.GetProfile(userID)
	if err != nil {
		http.Error(w, "We don't find this user", http.StatusBadRequest)
	}

	json.NewEncoder(w).Encode(auth.GetProfileToResponse(profile, stats))
}

func (h *UserHandler) HDMockPayment(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserIDKey).(int)

	var period auth.MockPaymentRequestDTO

	err := json.NewDecoder(r.Body).Decode(&period)

	if err != nil {
		http.Error(w, "Wrong format json", http.StatusBadRequest)
		return

	}
	h.service.MockPayment(userId, period.PlanId)
}

func (h *UserHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "No refresh token", http.StatusBadRequest)
		return
	}

	aceessToken, refreshToken, err := h.service.RefreshToken(cookie.Value)

	h.SetRefreshCookie(w, refreshToken)

	json.NewEncoder(w).Encode(map[string]string{"accessToken": aceessToken})
}

func (h *UserHandler) HDLogoutUser(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "No refresh token", http.StatusBadRequest)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	h.service.DeleteRefreshToken(cookie.Value)
}
