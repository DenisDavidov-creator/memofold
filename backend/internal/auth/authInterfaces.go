package auth

import (
	models "dimplom_harmonic/domain"
	"time"

	"gorm.io/gorm"
)

type UserService interface {
	LoginUser(email, password string) (string, string, error)
	RegisterUser(models.User) (*models.User, error)
	GetProfile(id int) (*Profile, *Stats, error)
	MockPayment(userId int, period string) error
	GeneratePairTokens(user *models.User) (string, string, error)
	RefreshToken(oldToken string) (string, string, error)
	DeleteRefreshToken(token string) error
}

type UserRepository interface {
	CreateUser(user *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id int) (*models.User, error)
	MockPayment(userId int, expiresAt time.Time) error
	SaveRefreshToken(userId int, refreshToken string, expiresAt time.Time) error
	GetRefreshToken(token string) (*RefreshToken, error)
	DeleteRefreshToken(oldRefreshToken string) error
	WithTx(tx *gorm.DB) UserRepository
}

type Profile struct {
	Id               int       `json:"id" gorm:"primaryKey"`
	Email            string    `json:"email" gorm:"unique"`
	Login            string    `json:"login" gorm:"unique"`
	PremiumExpiresAt time.Time `json:"premiumExpiresAt"`
	Status           string    `json:"status"`
}

type Stats struct {
	TotalWordsLearning int `json:"totalWordsLearning"`
	TotalWordsMastered int `json:"totalWordsMastered"`
	ActiveDecksCount   int `json:"activeDecksCount"`
	ArchivedDecksCount int `json:"archivedDecksCount"`
	TotalReviews       int `json:"totalReviews"`
}

type GetProfileResults struct {
	Id                 int       `json:"id" gorm:"primaryKey"`
	Email              string    `json:"email" gorm:"unique"`
	Login              string    `json:"login" gorm:"unique"`
	PremiumExpiresAt   time.Time `json:"premiumExpiresAt"`
	Status             string    `json:"status"`
	TotalWordsLearning int       `json:"totalWordsLearning"`
	TotalWordsMastered int       `json:"totalWordsMastered"`
	ActiveDecksCount   int       `json:"activeDecksCount"`
	ArchivedDecksCount int       `json:"archivedDecksCount"`
	TotalReviews       int       `json:"totalReviews"`
}

type RefreshToken struct {
	UserId    int
	Token     string
	ExpiresAt time.Time
}
