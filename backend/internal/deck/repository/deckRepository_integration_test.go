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

func seedUserAndSchedule(t *testing.T, tx *gorm.DB) (*models.User, *models.DeckSchedule) {
	t.Helper()

	user := &models.User{Email: "deck_int@test.com", Login: "deckint", PasswordHash: "hash"}
	require.NoError(t, tx.Create(user).Error)

	schedule := &models.DeckSchedule{UserId: user.Id, Name: "Standard", IsDefault: true}
	require.NoError(t, tx.Create(schedule).Error)

	steps := []models.ScheduleStep{
		{DeckScheduleId: schedule.Id, Level: 0, IntervalMinutes: 480},
		{DeckScheduleId: schedule.Id, Level: 1, IntervalMinutes: 1440},
	}
	require.NoError(t, tx.Create(&steps).Error)

	return user, schedule
}

func TestDeckRepo_CreateAndGetDecks(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		deck := &models.Deck{
			UserId:               user.Id,
			Name:                 "English Vocab",
			ScheduleId:           schedule.Id,
			CurrentLevel:         0,
			NextReviewDate:       time.Now().Add(24 * time.Hour),
			NextPrimaryDirection: true,
		}
		require.NoError(t, repo.CreateDeck(deck, user.Id))
		assert.NotZero(t, deck.Id)

		decks, err := repo.GetDecks(user.Id, false)
		require.NoError(t, err)
		assert.Len(t, decks, 1)
		assert.Equal(t, "English Vocab", decks[0].Name)
	})
}

func TestDeckRepo_GetByID(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		deck := &models.Deck{
			UserId:         user.Id,
			Name:           "Science Terms",
			ScheduleId:     schedule.Id,
			NextReviewDate: time.Now(),
		}
		require.NoError(t, repo.CreateDeck(deck, user.Id))

		found, err := repo.GetByID(user.Id, deck.Id)
		require.NoError(t, err)
		assert.Equal(t, "Science Terms", found.Name)
		assert.Equal(t, user.Id, found.UserId)
	})
}

func TestDeckRepo_GetByID_WrongUser(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		deck := &models.Deck{UserId: user.Id, Name: "Private", ScheduleId: schedule.Id, NextReviewDate: time.Now()}
		require.NoError(t, repo.CreateDeck(deck, user.Id))

		_, err := repo.GetByID(999, deck.Id)
		assert.Error(t, err)
	})
}

func TestDeckRepo_UpdateDeck(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		deck := &models.Deck{UserId: user.Id, Name: "Old Name", ScheduleId: schedule.Id, NextReviewDate: time.Now()}
		require.NoError(t, repo.CreateDeck(deck, user.Id))

		require.NoError(t, repo.Update(user.Id, deck.Id, map[string]any{"Name": "New Name"}))

		found, err := repo.GetByID(user.Id, deck.Id)
		require.NoError(t, err)
		assert.Equal(t, "New Name", found.Name)
	})
}

func TestDeckRepo_DeleteDeck(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		deck := &models.Deck{UserId: user.Id, Name: "ToDelete", ScheduleId: schedule.Id, NextReviewDate: time.Now()}
		require.NoError(t, repo.CreateDeck(deck, user.Id))

		require.NoError(t, repo.DeleteDeck(deck.Id, user.Id))

		_, err := repo.GetByID(user.Id, deck.Id)
		assert.Error(t, err)
	})
}

func TestDeckRepo_CreateAndDeleteHistory(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		deck := &models.Deck{UserId: user.Id, Name: "History Test", ScheduleId: schedule.Id, NextReviewDate: time.Now()}
		require.NoError(t, repo.CreateDeck(deck, user.Id))

		history := &models.DeckHistory{DeckId: deck.Id, ReviewDate: time.Now(), Accuracy: 80}
		require.NoError(t, repo.CreateHistory(history))
		assert.NotZero(t, history.Id)

		require.NoError(t, repo.DeleteHistories(deck.Id))

		var count int64
		tx.Model(&models.DeckHistory{}).Where("deck_id = ?", deck.Id).Count(&count)
		assert.Zero(t, count)
	})
}

func TestDeckRepo_GetDeckStatsForUser(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		active := &models.Deck{UserId: user.Id, Name: "Active", ScheduleId: schedule.Id, NextReviewDate: time.Now(), IsArchived: false}
		archived := &models.Deck{UserId: user.Id, Name: "Archived", ScheduleId: schedule.Id, NextReviewDate: time.Now(), IsArchived: true}
		require.NoError(t, repo.CreateDeck(active, user.Id))
		require.NoError(t, repo.CreateDeck(archived, user.Id))

		stats, err := repo.GetDeckStatsForUser(user.Id)
		require.NoError(t, err)
		assert.Equal(t, 1, stats.ActiveDecks)
		assert.Equal(t, 1, stats.ArchivedDecks)
	})
}

func TestDeckRepo_GetCountDeck(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		deck := &models.Deck{UserId: user.Id, Name: "CountMe", ScheduleId: schedule.Id, NextReviewDate: time.Now()}
		require.NoError(t, repo.CreateDeck(deck, user.Id))

		today := time.Now().Format("2006-01-02")
		count, err := repo.GetCountDeck(user.Id, today)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, *count, 1)
	})
}

func TestDeckRepo_ArchivedDecks(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user, schedule := seedUserAndSchedule(t, tx)
		repo := NewDeckRepository(tx)

		d := &models.Deck{UserId: user.Id, Name: "Arch", ScheduleId: schedule.Id, NextReviewDate: time.Now(), IsArchived: true}
		require.NoError(t, repo.CreateDeck(d, user.Id))

		archived, err := repo.GetDecks(user.Id, true)
		require.NoError(t, err)
		assert.Len(t, archived, 1)

		active, err := repo.GetDecks(user.Id, false)
		require.NoError(t, err)
		assert.Len(t, active, 0)
	})
}
