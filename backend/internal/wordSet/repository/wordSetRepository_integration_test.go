//go:build integration

package repository

import (
	"testing"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/testutils"
	wordset "dimplom_harmonic/internal/wordSet"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func seedUserForWS(t *testing.T, tx *gorm.DB, email, login string) *models.User {
	t.Helper()
	user := &models.User{Email: email, Login: login, PasswordHash: "hash"}
	require.NoError(t, tx.Create(user).Error)
	return user
}

func TestWordSetRepo_CreateAndGetAll(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForWS(t, tx, "ws@test.com", "wsuser")
		repo := NewWordSetRepository(tx)

		ws := &models.WordSet{UserId: user.Id, Name: "Travel", IsPublic: false}
		require.NoError(t, repo.CreateWordSet(ws))
		assert.NotZero(t, ws.Id)

		all, err := repo.GetAllWordSet(wordset.WordSetFilter{UserId: user.Id, Type: "my"})
		require.NoError(t, err)
		assert.Len(t, all, 1)
		assert.Equal(t, "Travel", all[0].Name)
	})
}

func TestWordSetRepo_GetAllWordSet_PublicFilter(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		owner := seedUserForWS(t, tx, "owner@test.com", "owner")
		viewer := seedUserForWS(t, tx, "viewer@test.com", "viewer")

		repo := NewWordSetRepository(tx)

		public := &models.WordSet{UserId: owner.Id, Name: "Public Set", IsPublic: true}
		private := &models.WordSet{UserId: owner.Id, Name: "Private Set", IsPublic: false}
		require.NoError(t, repo.CreateWordSet(public))
		require.NoError(t, repo.CreateWordSet(private))

		result, err := repo.GetAllWordSet(wordset.WordSetFilter{UserId: viewer.Id, Type: "public"})
		require.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "Public Set", result[0].Name)
	})
}

func TestWordSetRepo_GetWordSetByID(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForWS(t, tx, "byid_ws@test.com", "byidws")
		repo := NewWordSetRepository(tx)

		ws := &models.WordSet{UserId: user.Id, Name: "My Set"}
		require.NoError(t, repo.CreateWordSet(ws))

		found, err := repo.GetWordSetByID(user.Id, ws.Id)
		require.NoError(t, err)
		assert.Equal(t, "My Set", found.Name)
		assert.Equal(t, user.Id, found.UserId)
	})
}

func TestWordSetRepo_UpdateWordSet(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForWS(t, tx, "upd_ws@test.com", "updws")
		repo := NewWordSetRepository(tx)

		ws := &models.WordSet{UserId: user.Id, Name: "OldName", IsPublic: false}
		require.NoError(t, repo.CreateWordSet(ws))

		require.NoError(t, repo.UpdateWordSet(ws.Id, map[string]any{"Name": "NewName", "IsPublic": true}))

		found, err := repo.GetWordSetByID(user.Id, ws.Id)
		require.NoError(t, err)
		assert.Equal(t, "NewName", found.Name)
	})
}

func TestWordSetRepo_DeleteWordSet(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForWS(t, tx, "del_ws@test.com", "delws")
		repo := NewWordSetRepository(tx)

		ws := &models.WordSet{UserId: user.Id, Name: "ToDelete"}
		require.NoError(t, repo.CreateWordSet(ws))

		require.NoError(t, repo.DeleteWordSet(ws.Id))

		var count int64
		tx.Model(&models.WordSet{}).Where("id = ?", ws.Id).Count(&count)
		assert.Zero(t, count)
	})
}

func TestWordSetRepo_GetDefault(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForWS(t, tx, "default_ws@test.com", "defaultws")
		repo := NewWordSetRepository(tx)

		defaultWS := &models.WordSet{UserId: user.Id, Name: "Difficult words", IsDefault: true}
		otherWS := &models.WordSet{UserId: user.Id, Name: "Other", IsDefault: false}
		require.NoError(t, repo.CreateWordSet(defaultWS))
		require.NoError(t, repo.CreateWordSet(otherWS))

		found, err := repo.GetDefault(user.Id)
		require.NoError(t, err)
		assert.Equal(t, "Difficult words", found.Name)
		assert.True(t, found.IsDefault)
	})
}

func TestWordSetRepo_AddConnection(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForWS(t, tx, "addconn_ws@test.com", "addconnws")
		repo := NewWordSetRepository(tx)

		ws := &models.WordSet{UserId: user.Id, Name: "Vocab"}
		require.NoError(t, repo.CreateWordSet(ws))

		card1 := &models.Card{OriginalWord: "apple", Translation: "яблоко"}
		card2 := &models.Card{OriginalWord: "banana", Translation: "банан"}
		require.NoError(t, tx.Create(card1).Error)
		require.NoError(t, tx.Create(card2).Error)

		require.NoError(t, repo.AddConection(ws, []models.Card{*card1, *card2}))

		found, err := repo.GetWordSetByID(user.Id, ws.Id)
		require.NoError(t, err)
		assert.Len(t, found.Cards, 2)
	})
}

func TestWordSetRepo_CardsCount(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForWS(t, tx, "cardcount_ws@test.com", "cardcountws")
		repo := NewWordSetRepository(tx)

		ws := &models.WordSet{UserId: user.Id, Name: "Counted"}
		require.NoError(t, repo.CreateWordSet(ws))

		for i := 0; i < 3; i++ {
			card := &models.Card{OriginalWord: "word", Translation: "слово"}
			require.NoError(t, tx.Create(card).Error)
			require.NoError(t, repo.AddConection(ws, []models.Card{*card}))
		}

		all, err := repo.GetAllWordSet(wordset.WordSetFilter{UserId: user.Id, Type: "my"})
		require.NoError(t, err)
		require.Len(t, all, 1)
		assert.Equal(t, 3, all[0].CardsCount)
	})
}
