//go:build integration

package repository

import (
	"testing"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/testutils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// seedUser создаёт пользователя и необходимые дефолтные записи (schedule, wordset)
// для выполнения операций, требующих внешних ключей.
func seedUserForCard(t *testing.T, tx *gorm.DB) *models.User {
	t.Helper()
	user := &models.User{Email: "card_test@test.com", Login: "cardtest", PasswordHash: "hash"}
	require.NoError(t, tx.Create(user).Error)

	schedule := &models.DeckSchedule{UserId: user.Id, Name: "Default", IsDefault: true}
	require.NoError(t, tx.Create(schedule).Error)

	return user
}

func TestCardRepo_CreateAndGetCard(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForCard(t, tx)
		repo := NewCardRepository(tx)

		cards := []models.Card{
			{OriginalWord: "hello", Translation: "привет"},
			{OriginalWord: "world", Translation: "мир"},
		}
		require.NoError(t, repo.CreateCard(cards, user.Id))
		assert.NotZero(t, cards[0].Id)
		assert.NotZero(t, cards[1].Id)

		found, err := repo.GetCardById(cards[0].Id)
		require.NoError(t, err)
		assert.Equal(t, "hello", found.OriginalWord)
	})
}

func TestCardRepo_GetCardById_NotFound(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewCardRepository(tx)
		_, err := repo.GetCardById(999999)
		assert.Error(t, err)
	})
}

func TestCardRepo_UpdateCard(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForCard(t, tx)
		repo := NewCardRepository(tx)

		cards := []models.Card{{OriginalWord: "old", Translation: "старое"}}
		require.NoError(t, repo.CreateCard(cards, user.Id))

		require.NoError(t, repo.UpdateCard(cards[0].Id, map[string]any{
			"OriginalWord": "new",
			"Translation":  "новое",
		}))

		updated, err := repo.GetCardById(cards[0].Id)
		require.NoError(t, err)
		assert.Equal(t, "new", updated.OriginalWord)
		assert.Equal(t, "новое", updated.Translation)
	})
}

func TestCardRepo_DeleteCard(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForCard(t, tx)
		repo := NewCardRepository(tx)

		cards := []models.Card{{OriginalWord: "delete_me", Translation: "удали"}}
		require.NoError(t, repo.CreateCard(cards, user.Id))

		require.NoError(t, repo.DeleteCard(cards[0].Id))

		_, err := repo.GetCardById(cards[0].Id)
		assert.Error(t, err)
	})
}

func TestCardRepo_DeleteCardFromDeck(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForCard(t, tx)
		_ = user

		schedule := &models.DeckSchedule{UserId: user.Id, Name: "Sched"}
		require.NoError(t, tx.Create(schedule).Error)

		deck := &models.Deck{
			UserId:     user.Id,
			Name:       "Deck1",
			ScheduleId: schedule.Id,
		}
		require.NoError(t, tx.Create(deck).Error)

		card := &models.Card{OriginalWord: "word", Translation: "слово"}
		require.NoError(t, tx.Create(card).Error)
		require.NoError(t, tx.Model(deck).Association("Cards").Append(card))

		repo := NewCardRepository(tx)
		require.NoError(t, repo.DeleteCardFromDeck(card, deck))

		var count int64
		tx.Table("deck_cards").Where("deck_id = ? AND card_id = ?", deck.Id, card.Id).Count(&count)
		assert.Zero(t, count)
	})
}

func TestCardRepo_GetUserCardStats(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForCard(t, tx)
		repo := NewCardRepository(tx)

		stats, err := repo.GetUserCardStats(user.Id)
		require.NoError(t, err)
		assert.NotNil(t, stats)
		assert.GreaterOrEqual(t, stats.Learning, 0)
		assert.GreaterOrEqual(t, stats.Mastered, 0)
	})
}

func TestCardRepo_CreateHistory(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUserForCard(t, tx)

		schedule := &models.DeckSchedule{UserId: user.Id, Name: "Sched"}
		require.NoError(t, tx.Create(schedule).Error)

		deck := &models.Deck{UserId: user.Id, Name: "D", ScheduleId: schedule.Id}
		require.NoError(t, tx.Create(deck).Error)

		cards := []models.Card{{OriginalWord: "w", Translation: "с"}}
		repo := NewCardRepository(tx)
		require.NoError(t, repo.CreateCard(cards, user.Id))

		history := []models.CardHistory{
			{UserId: user.Id, DeckId: deck.Id, CardId: cards[0].Id, IsCorrect: true},
		}
		require.NoError(t, repo.CreateHistory(history))

		var count int64
		tx.Model(&models.CardHistory{}).Where("user_id = ?", user.Id).Count(&count)
		assert.Equal(t, int64(1), count)
	})
}
