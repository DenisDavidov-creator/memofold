package service

import (
	"errors"
	"testing"
	"time"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/auth"
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/deck"
	"dimplom_harmonic/internal/mocks"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func makeHashedPassword(t *testing.T, plain string) string {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.MinCost)
	require.NoError(t, err)
	return string(hash)
}

func TestGenerateRefreshToken(t *testing.T) {
	token, err := GenerateRefreshToken()
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	token2, err := GenerateRefreshToken()
	require.NoError(t, err)
	assert.NotEqual(t, token, token2, "каждый токен должен быть уникальным")
}

func TestLoginUser_Success(t *testing.T) {
	password := "securePass123"
	hash := makeHashedPassword(t, password)

	user := &models.User{Id: 1, Email: "test@test.com", Login: "testuser", PasswordHash: hash}

	authRepo := &mocks.MockAuthRepo{
		GetByEmailFn:       func(email string) (*models.User, error) { return user, nil },
		SaveRefreshTokenFn: func(userId int, token string, exp time.Time) error { return nil },
	}
	wordSetRepo := &mocks.MockWordSetRepo{}
	scheduleRepo := &mocks.MockScheduleRepo{}
	deckRepo := &mocks.MockDeckRepo{}
	cardRepo := &mocks.MockCardRepo{}

	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, wordSetRepo, scheduleRepo, deckRepo, cardRepo, []byte("secret"), db)

	accessToken, refreshToken, err := svc.LoginUser("test@test.com", password)
	require.NoError(t, err)
	assert.NotEmpty(t, accessToken)
	assert.NotEmpty(t, refreshToken)
}

func TestLoginUser_WrongEmail(t *testing.T) {
	authRepo := &mocks.MockAuthRepo{
		GetByEmailFn: func(email string) (*models.User, error) {
			return nil, errors.New("not found")
		},
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	_, _, err := svc.LoginUser("wrong@test.com", "pass")
	assert.Error(t, err)
}

func TestLoginUser_WrongPassword(t *testing.T) {
	hash := makeHashedPassword(t, "correctPass")
	user := &models.User{Id: 1, PasswordHash: hash}

	authRepo := &mocks.MockAuthRepo{
		GetByEmailFn: func(email string) (*models.User, error) { return user, nil },
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	_, _, err := svc.LoginUser("test@test.com", "wrongPass")
	assert.Error(t, err)
}

func TestRegisterUser_EmailAlreadyTaken(t *testing.T) {
	authRepo := &mocks.MockAuthRepo{
		GetByEmailFn: func(email string) (*models.User, error) {
			return &models.User{}, nil
		},
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	_, err := svc.RegisterUser(models.User{Email: "taken@test.com", Login: "user", PasswordHash: "pass"})
	require.Error(t, err)
	assert.Equal(t, "This email is already taken", err.Error())
}

func TestRegisterUser_Success(t *testing.T) {
	authRepo := &mocks.MockAuthRepo{
		GetByEmailFn: func(email string) (*models.User, error) {
			return nil, errors.New("not found")
		},
		CreateUserFn: func(user *models.User) error {
			user.Id = 42
			return nil
		},
	}
	wordSetRepo := &mocks.MockWordSetRepo{}
	scheduleRepo := &mocks.MockScheduleRepo{}

	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	svc := NewUserService(authRepo, wordSetRepo, scheduleRepo, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	newUser, err := svc.RegisterUser(models.User{Email: "new@test.com", Login: "newuser", PasswordHash: "password123"})
	require.NoError(t, err)
	assert.Equal(t, "new@test.com", newUser.Email)
	assert.NotEqual(t, "password123", newUser.PasswordHash, "пароль должен быть захеширован")
}

func TestGetProfile_Success(t *testing.T) {
	now := time.Now()
	user := &models.User{
		Id:               1,
		Email:            "user@test.com",
		Login:            "user",
		PremiumExpiresAt: now.AddDate(0, 1, 0),
	}

	authRepo := &mocks.MockAuthRepo{
		GetByIDFn: func(id int) (*models.User, error) { return user, nil },
	}
	deckRepo := &mocks.MockDeckRepo{
		GetDeckStatsForUserFn: func(userId int) (*deck.GetUserStatsResult, error) {
			return &deck.GetUserStatsResult{ActiveDecks: 3, ArchivedDecks: 1, TotalReviews: 10}, nil
		},
	}
	cardRepo := &mocks.MockCardRepo{
		GetUserCardStatsFn: func(userId int) (*card.GetUserCardStats, error) {
			return &card.GetUserCardStats{Learning: 15, Mastered: 5}, nil
		},
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, deckRepo, cardRepo, []byte("secret"), db)

	profile, stats, err := svc.GetProfile(1)
	require.NoError(t, err)
	assert.Equal(t, "user@test.com", profile.Email)
	assert.Equal(t, "premium", profile.Status)
	assert.Equal(t, 3, stats.ActiveDecksCount)
	assert.Equal(t, 15, stats.TotalWordsLearning)
}

func TestGetProfile_FreeUser(t *testing.T) {
	user := &models.User{
		Id:               2,
		Email:            "free@test.com",
		Login:            "free",
		PremiumExpiresAt: time.Now().AddDate(-1, 0, 0),
	}

	authRepo := &mocks.MockAuthRepo{
		GetByIDFn: func(id int) (*models.User, error) { return user, nil },
	}
	deckRepo := &mocks.MockDeckRepo{}
	cardRepo := &mocks.MockCardRepo{}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, deckRepo, cardRepo, []byte("secret"), db)

	profile, _, err := svc.GetProfile(2)
	require.NoError(t, err)
	assert.Equal(t, "free", profile.Status)
}

func TestGetProfile_LifetimeUser(t *testing.T) {
	user := &models.User{
		Id:               3,
		Email:            "lifetime@test.com",
		Login:            "lifetime",
		PremiumExpiresAt: time.Now().AddDate(1001, 0, 0),
	}

	authRepo := &mocks.MockAuthRepo{
		GetByIDFn: func(id int) (*models.User, error) { return user, nil },
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	profile, _, err := svc.GetProfile(3)
	require.NoError(t, err)
	assert.Equal(t, "lifetime", profile.Status)
}

func TestMockPayment_Month(t *testing.T) {
	user := &models.User{Id: 1, PremiumExpiresAt: time.Now().AddDate(-1, 0, 0)}

	authRepo := &mocks.MockAuthRepo{
		GetByIDFn:     func(id int) (*models.User, error) { return user, nil },
		MockPaymentFn: func(userId int, expiresAt time.Time) error { return nil },
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	err := svc.MockPayment(1, "month")
	assert.NoError(t, err)
}

func TestMockPayment_Year(t *testing.T) {
	user := &models.User{Id: 1, PremiumExpiresAt: time.Now().AddDate(0, 1, 0)}

	authRepo := &mocks.MockAuthRepo{
		GetByIDFn:     func(id int) (*models.User, error) { return user, nil },
		MockPaymentFn: func(userId int, expiresAt time.Time) error { return nil },
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	err := svc.MockPayment(1, "year")
	assert.NoError(t, err)
}

func TestMockPayment_Lifetime(t *testing.T) {
	user := &models.User{Id: 1, PremiumExpiresAt: time.Now().AddDate(-1, 0, 0)}

	authRepo := &mocks.MockAuthRepo{
		GetByIDFn:     func(id int) (*models.User, error) { return user, nil },
		MockPaymentFn: func(userId int, expiresAt time.Time) error { return nil },
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	err := svc.MockPayment(1, "lifetime")
	assert.NoError(t, err)
}

func TestRefreshToken_Success(t *testing.T) {
	user := &models.User{Id: 1, Email: "u@t.com", Login: "u", PremiumExpiresAt: time.Now().AddDate(-1, 0, 0)}

	authRepo := &mocks.MockAuthRepo{
		GetRefreshTokenFn: func(token string) (*auth.RefreshToken, error) {
			return &auth.RefreshToken{UserId: 1, Token: token, ExpiresAt: time.Now().Add(time.Hour)}, nil
		},
		GetByIDFn:            func(id int) (*models.User, error) { return user, nil },
		DeleteRefreshTokenFn: func(t string) error { return nil },
		SaveRefreshTokenFn:   func(userId int, token string, exp time.Time) error { return nil },
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	accessToken, refreshToken, err := svc.RefreshToken("old-token")
	require.NoError(t, err)
	assert.NotEmpty(t, accessToken)
	assert.NotEmpty(t, refreshToken)
}

func TestDeleteRefreshToken(t *testing.T) {
	deleted := false
	authRepo := &mocks.MockAuthRepo{
		DeleteRefreshTokenFn: func(token string) error {
			deleted = true
			return nil
		},
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("secret"), db)

	err := svc.DeleteRefreshToken("some-token")
	require.NoError(t, err)
	assert.True(t, deleted)
}

func TestGeneratePairTokens(t *testing.T) {
	user := &models.User{Id: 5, Login: "dev", PremiumExpiresAt: time.Now().AddDate(0, 1, 0)}

	authRepo := &mocks.MockAuthRepo{
		SaveRefreshTokenFn: func(userId int, token string, exp time.Time) error { return nil },
	}
	db, _ := mocks.NewMockDB(t)
	svc := NewUserService(authRepo, &mocks.MockWordSetRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockDeckRepo{}, &mocks.MockCardRepo{}, []byte("my-jwt-key"), db)

	access, refresh, err := svc.GeneratePairTokens(user)
	require.NoError(t, err)
	assert.NotEmpty(t, access)
	assert.NotEmpty(t, refresh)
}
