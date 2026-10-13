//go:build integration

package repository

import (
	"testing"
	"time"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/testutils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestAuthRepo_CreateUser_GetByEmail(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		user := &models.User{
			Email:        "integration@test.com",
			Login:        "intuser",
			PasswordHash: "hashedpass",
		}
		require.NoError(t, repo.CreateUser(user))
		assert.NotZero(t, user.Id)

		found, err := repo.GetByEmail("integration@test.com")
		require.NoError(t, err)
		assert.Equal(t, user.Id, found.Id)
		assert.Equal(t, "intuser", found.Login)
	})
}

func TestAuthRepo_GetByEmail_NotFound(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)
		_, err := repo.GetByEmail("nobody@nowhere.com")
		assert.Error(t, err)
	})
}

func TestAuthRepo_GetByID(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		user := &models.User{Email: "byid@test.com", Login: "byiduser", PasswordHash: "hash"}
		require.NoError(t, repo.CreateUser(user))

		found, err := repo.GetByID(user.Id)
		require.NoError(t, err)
		assert.Equal(t, "byid@test.com", found.Email)
	})
}

func TestAuthRepo_GetByID_NotFound(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)
		_, err := repo.GetByID(999999)
		assert.Error(t, err)
	})
}

func TestAuthRepo_CreateUser_DuplicateEmail(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		user1 := &models.User{Email: "dup@test.com", Login: "user1", PasswordHash: "hash"}
		require.NoError(t, repo.CreateUser(user1))

		user2 := &models.User{Email: "dup@test.com", Login: "user2", PasswordHash: "hash"}
		err := repo.CreateUser(user2)
		assert.Error(t, err, "должна вернуть ошибку для дублирующегося email")
	})
}

func TestAuthRepo_SaveAndGetRefreshToken(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		user := &models.User{Email: "token@test.com", Login: "tokenuser", PasswordHash: "hash"}
		require.NoError(t, repo.CreateUser(user))

		tokenStr := "my-refresh-token-12345"
		expiresAt := time.Now().Add(24 * time.Hour)

		require.NoError(t, repo.SaveRefreshToken(user.Id, tokenStr, expiresAt))

		rt, err := repo.GetRefreshToken(tokenStr)
		require.NoError(t, err)
		assert.Equal(t, user.Id, rt.UserId)
		assert.Equal(t, tokenStr, rt.Token)
	})
}

func TestAuthRepo_DeleteRefreshToken(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		user := &models.User{Email: "deltoken@test.com", Login: "deltokenuser", PasswordHash: "hash"}
		require.NoError(t, repo.CreateUser(user))

		token := "delete-me-token"
		require.NoError(t, repo.SaveRefreshToken(user.Id, token, time.Now().Add(time.Hour)))
		require.NoError(t, repo.DeleteRefreshToken(token))

		_, err := repo.GetRefreshToken(token)
		assert.Error(t, err, "токен должен быть удалён")
	})
}

func TestAuthRepo_MockPayment(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		user := &models.User{Email: "pay@test.com", Login: "payuser", PasswordHash: "hash"}
		require.NoError(t, repo.CreateUser(user))

		newExpiry := time.Now().AddDate(1, 0, 0)
		require.NoError(t, repo.MockPayment(user.Id, newExpiry))

		updated, err := repo.GetByID(user.Id)
		require.NoError(t, err)
		assert.True(t, updated.PremiumExpiresAt.After(time.Now()))
	})
}

func TestAuthRepo_WithTx(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)
		txRepo := repo.WithTx(tx)
		assert.NotNil(t, txRepo)
	})
}
