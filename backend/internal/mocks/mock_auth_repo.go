package mocks

import (
	"dimplom_harmonic/internal/auth"
	models "dimplom_harmonic/domain"
	"time"

	"gorm.io/gorm"
)

type MockAuthRepo struct {
	GetByEmailFn         func(email string) (*models.User, error)
	GetByIDFn            func(id int) (*models.User, error)
	CreateUserFn         func(user *models.User) error
	MockPaymentFn        func(userId int, expiresAt time.Time) error
	SaveRefreshTokenFn   func(userId int, refreshToken string, expiresAt time.Time) error
	GetRefreshTokenFn    func(token string) (*auth.RefreshToken, error)
	DeleteRefreshTokenFn func(oldRefreshToken string) error
	WithTxFn             func(tx *gorm.DB) auth.UserRepository
}

func (m *MockAuthRepo) GetByEmail(email string) (*models.User, error) {
	return m.GetByEmailFn(email)
}

func (m *MockAuthRepo) GetByID(id int) (*models.User, error) {
	return m.GetByIDFn(id)
}

func (m *MockAuthRepo) CreateUser(user *models.User) error {
	if m.CreateUserFn != nil {
		return m.CreateUserFn(user)
	}
	return nil
}

func (m *MockAuthRepo) MockPayment(userId int, expiresAt time.Time) error {
	if m.MockPaymentFn != nil {
		return m.MockPaymentFn(userId, expiresAt)
	}
	return nil
}

func (m *MockAuthRepo) SaveRefreshToken(userId int, refreshToken string, expiresAt time.Time) error {
	if m.SaveRefreshTokenFn != nil {
		return m.SaveRefreshTokenFn(userId, refreshToken, expiresAt)
	}
	return nil
}

func (m *MockAuthRepo) GetRefreshToken(token string) (*auth.RefreshToken, error) {
	return m.GetRefreshTokenFn(token)
}

func (m *MockAuthRepo) DeleteRefreshToken(oldRefreshToken string) error {
	if m.DeleteRefreshTokenFn != nil {
		return m.DeleteRefreshTokenFn(oldRefreshToken)
	}
	return nil
}

func (m *MockAuthRepo) WithTx(tx *gorm.DB) auth.UserRepository {
	if m.WithTxFn != nil {
		return m.WithTxFn(tx)
	}
	return m
}
