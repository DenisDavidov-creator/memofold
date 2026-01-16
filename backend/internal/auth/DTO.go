package auth

import (
	models "dimplom_harmonic/domain"
	"time"
)

type UserDTO struct {
	Id               int       `json:"id"`
	Email            string    `json:"email"`
	Login            string    `json:"login"`
	PasswordHash     string    `json:"-"`
	PremiumExpiresAt time.Time `json:"premiumExpiresAt"`
}

func ModelToUserDTO(m *models.User) UserDTO {
	return UserDTO{
		Id:               m.Id,
		Email:            m.Email,
		Login:            m.Login,
		PremiumExpiresAt: m.PremiumExpiresAt,
	}
}

type RegisterUserRequestDTO struct {
	Email        string `json:"email"`
	Login        string `json:"login"`
	PasswordHash string `json:"password"`
}

func RegisterUserToModel(r *RegisterUserRequestDTO) models.User {
	return models.User{
		Email:        r.Email,
		Login:        r.Login,
		PasswordHash: r.PasswordHash,
	}
}

type LoginUserRequestDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type GetProfileUserResponseDTO struct {
	User  Profile `json:"user"`
	Stats Stats   `json:"stats"`
}

func GetProfileToResponse(p *Profile, s *Stats) GetProfileUserResponseDTO {
	return GetProfileUserResponseDTO{
		User:  *p,
		Stats: *s,
	}
}

type MockPaymentRequestDTO struct {
	PlanId string `json:"planId"`
}
