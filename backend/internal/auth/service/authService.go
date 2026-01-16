package service

import (
	"crypto/rand"
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/auth"
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/deck"
	"dimplom_harmonic/internal/schedule"
	wordset "dimplom_harmonic/internal/wordSet"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserServiceImpl struct {
	authRepo     auth.UserRepository
	wordSetRepo  wordset.WordSetRepository
	scheduleRepo schedule.ScheduleRepository
	deckRepo     deck.DeckRepository
	cardRepo     card.CardRepository
	jwtKey       []byte
	db           *gorm.DB
}

func NewUserService(authRepo auth.UserRepository, wordSetRepo wordset.WordSetRepository, scheduleRepo schedule.ScheduleRepository, deckRepo deck.DeckRepository, cardRepo card.CardRepository, jwtKey []byte, db *gorm.DB) auth.UserService {
	return &UserServiceImpl{authRepo: authRepo, wordSetRepo: wordSetRepo, scheduleRepo: scheduleRepo, deckRepo: deckRepo, cardRepo: cardRepo, jwtKey: jwtKey, db: db}
}

func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *UserServiceImpl) GeneratePairTokens(user *models.User) (string, string, error) {

	claims := models.AppClaims{
		UserID:    user.Id,
		Login:     user.Login,
		IsPremium: user.PremiumExpiresAt.After(time.Now()),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Minute)),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := accessToken.SignedString(s.jwtKey)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		return "", "", err
	}

	expireAt := time.Now().Add(30 * 24 * time.Hour)
	s.authRepo.SaveRefreshToken(user.Id, refreshToken, expireAt)

	return tokenString, refreshToken, nil
}

func (s *UserServiceImpl) LoginUser(email, password string) (string, string, error) {

	user, err := s.authRepo.GetByEmail(email)
	if err != nil {
		return "", "", err
	}

	cleanPassword := strings.TrimSpace(password)
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(cleanPassword))
	if err != nil {
		return "", "", err
	}

	return s.GeneratePairTokens(user)
}

func (s *UserServiceImpl) RegisterUser(input models.User) (*models.User, error) {
	_, err := s.authRepo.GetByEmail(input.Email)
	if err == nil {
		return nil, errors.New("This email is already taken")
	}

	cleanPassword := strings.TrimSpace(input.PasswordHash)
	hashedPassowrd, err := bcrypt.GenerateFromPassword([]byte(cleanPassword), bcrypt.DefaultCost)

	if err != nil {
		return nil, err
	}

	newUser := &models.User{
		Email:        input.Email,
		Login:        input.Login,
		PasswordHash: string(hashedPassowrd),
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {
		txUserRepo := s.authRepo.WithTx(tx)
		txWordSetRepo := s.wordSetRepo.WithTx(tx)
		txSceduleRepo := s.scheduleRepo.WithTx(tx)

		if err := txUserRepo.CreateUser(newUser); err != nil {
			return err
		}

		defaultWordSet := models.WordSet{
			UserId:    newUser.Id,
			Name:      "Difficult words",
			IsPublic:  false,
			IsDefault: true,
		}
		if err = txWordSetRepo.CreateWordSet(&defaultWordSet); err != nil {
			return err
		}

		defaultSchedule := models.DeckSchedule{
			UserId:    newUser.Id,
			Name:      "Standart",
			IsDefault: true,
		}

		if err = txSceduleRepo.CreateSchedule(&defaultSchedule); err != nil {
			return err
		}

		var standartIntervals []models.ScheduleStep

		intervalesInMinutes := []int{480, 1440, 4320, 10080, 20160, 43200}

		for i, value := range intervalesInMinutes {
			interval := models.ScheduleStep{
				Level:           i,
				DeckScheduleId:  defaultSchedule.Id,
				IntervalMinutes: value,
			}
			standartIntervals = append(standartIntervals, interval)
		}

		err = txSceduleRepo.CreateScheduleInterval(standartIntervals)
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return newUser, nil
}

func (s *UserServiceImpl) GetProfile(id int) (*auth.Profile, *auth.Stats, error) {

	user, err := s.authRepo.GetByID(id)
	if err != nil {
		return nil, nil, err
	}

	deckStats, err := s.deckRepo.GetDeckStatsForUser(user.Id)
	if err != nil {
		return nil, nil, err
	}

	cardStats, err := s.cardRepo.GetUserCardStats(user.Id)
	if err != nil {
		return nil, nil, err
	}

	var status string
	if user.PremiumExpiresAt.After(time.Now().Add(time.Hour * 24 * 365 * 100)) {
		status = "lifetime"
	} else if user.PremiumExpiresAt.After(time.Now()) {
		status = "premium"
	} else {
		status = "free"
	}
	var profile auth.Profile
	var stats auth.Stats

	profile.Email = user.Email
	profile.Id = user.Id
	profile.Login = user.Login
	profile.PremiumExpiresAt = user.PremiumExpiresAt
	profile.Status = status

	stats.ActiveDecksCount = deckStats.ActiveDecks
	stats.ArchivedDecksCount = deckStats.ArchivedDecks
	stats.TotalReviews = deckStats.TotalReviews
	stats.TotalWordsLearning = cardStats.Learning
	stats.TotalWordsMastered = cardStats.Mastered

	return &profile, &stats, nil
}

func (s *UserServiceImpl) MockPayment(userId int, period string) error {
	user, err := s.authRepo.GetByID(userId)
	if err != nil {
		return err
	}

	now := time.Now()
	if user.PremiumExpiresAt.After(now) {
		now = user.PremiumExpiresAt
	}

	var newTime time.Time

	switch period {
	case "month":
		newTime = now.AddDate(0, 1, 0)
	case "year":
		newTime = now.AddDate(1, 0, 0)
	case "lifetime":
		newTime = now.AddDate(1000, 0, 0)
	}

	err = s.authRepo.MockPayment(userId, newTime)

	if err != nil {
		return err
	}
	return nil
}

func (s *UserServiceImpl) RefreshToken(oldToken string) (string, string, error) {
	rt, err := s.authRepo.GetRefreshToken(oldToken)
	if err != nil {
		return "", "", err
	}
	user, err := s.authRepo.GetByID(rt.UserId)

	err = s.authRepo.DeleteRefreshToken(oldToken)
	if err != nil {
		return "", "", err
	}

	return s.GeneratePairTokens(user)
}

func (s *UserServiceImpl) DeleteRefreshToken(token string) error {
	err := s.authRepo.DeleteRefreshToken(token)
	if err != nil {
		return err
	}
	return nil
}
