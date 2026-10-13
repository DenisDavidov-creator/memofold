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

func seedUser(t *testing.T, tx *gorm.DB, email, login string) *models.User {
	t.Helper()
	user := &models.User{Email: email, Login: login, PasswordHash: "hash"}
	require.NoError(t, tx.Create(user).Error)
	return user
}

func TestScheduleRepo_CreateAndGetAll(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUser(t, tx, "sched@test.com", "scheduser")
		repo := NewScheduleRepository(tx)

		sched := &models.DeckSchedule{Name: "My Schedule", UserId: user.Id}
		require.NoError(t, repo.CreateSchedule(sched))
		assert.NotZero(t, sched.Id)

		steps := []models.ScheduleStep{
			{DeckScheduleId: sched.Id, Level: 0, IntervalMinutes: 480},
			{DeckScheduleId: sched.Id, Level: 1, IntervalMinutes: 1440},
		}
		require.NoError(t, repo.CreateScheduleInterval(steps))

		all, err := repo.GetAllSchedules(user.Id)
		require.NoError(t, err)
		assert.Len(t, all, 1)
		assert.Equal(t, "My Schedule", all[0].Name)
		assert.Len(t, all[0].ScheduleSteps, 2)
	})
}

func TestScheduleRepo_GetSchedule(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUser(t, tx, "get_sched@test.com", "getsched")
		repo := NewScheduleRepository(tx)

		sched := &models.DeckSchedule{Name: "Intensive", UserId: user.Id}
		require.NoError(t, repo.CreateSchedule(sched))

		steps := []models.ScheduleStep{
			{DeckScheduleId: sched.Id, Level: 0, IntervalMinutes: 60},
		}
		require.NoError(t, repo.CreateScheduleInterval(steps))

		found, err := repo.GetSchedule(sched.Id)
		require.NoError(t, err)
		assert.Equal(t, "Intensive", found.Name)
		assert.Len(t, found.ScheduleSteps, 1)
	})
}

func TestScheduleRepo_GetSchedule_NotFound(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		repo := NewScheduleRepository(tx)
		_, err := repo.GetSchedule(999999)
		assert.Error(t, err)
	})
}

func TestScheduleRepo_UpdateScheduleName(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUser(t, tx, "upd_sched@test.com", "updsched")
		repo := NewScheduleRepository(tx)

		sched := &models.DeckSchedule{Name: "OldName", UserId: user.Id}
		require.NoError(t, repo.CreateSchedule(sched))

		require.NoError(t, repo.UpdateScheduleName(sched.Id, map[string]any{"name": "NewName"}))

		found, err := repo.GetSchedule(sched.Id)
		require.NoError(t, err)
		assert.Equal(t, "NewName", found.Name)
	})
}

func TestScheduleRepo_DeleteScheduleInterval(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUser(t, tx, "del_interval@test.com", "delinterval")
		repo := NewScheduleRepository(tx)

		sched := &models.DeckSchedule{Name: "S", UserId: user.Id}
		require.NoError(t, repo.CreateSchedule(sched))

		steps := []models.ScheduleStep{
			{DeckScheduleId: sched.Id, Level: 0, IntervalMinutes: 100},
			{DeckScheduleId: sched.Id, Level: 1, IntervalMinutes: 200},
		}
		require.NoError(t, repo.CreateScheduleInterval(steps))

		require.NoError(t, repo.DeleteScheduleInterval(sched.Id))

		found, err := repo.GetSchedule(sched.Id)
		require.NoError(t, err)
		assert.Len(t, found.ScheduleSteps, 0)
	})
}

func TestScheduleRepo_DeleteSchedule(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUser(t, tx, "del_sched@test.com", "delsched")
		repo := NewScheduleRepository(tx)

		sched := &models.DeckSchedule{Name: "DeleteMe", UserId: user.Id}
		require.NoError(t, repo.CreateSchedule(sched))

		require.NoError(t, repo.DeleteSchedule(&models.DeckSchedule{}, sched.Id))

		_, err := repo.GetSchedule(sched.Id)
		assert.Error(t, err)
	})
}

func TestScheduleRepo_GetInterval(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUser(t, tx, "getinterval@test.com", "getintervaluser")
		repo := NewScheduleRepository(tx)

		sched := &models.DeckSchedule{Name: "Interval Test", UserId: user.Id}
		require.NoError(t, repo.CreateSchedule(sched))

		steps := []models.ScheduleStep{
			{DeckScheduleId: sched.Id, Level: 0, IntervalMinutes: 480},
		}
		require.NoError(t, repo.CreateScheduleInterval(steps))

		interval, err := repo.GetInterval(sched.Id, 0)
		require.NoError(t, err)
		assert.Equal(t, 480, *interval)
	})
}

func TestScheduleRepo_UpdateSchedule_MigrateDecks(t *testing.T) {
	db := testutils.SetupTestDB(t)

	testutils.WithTx(t, db, func(tx *gorm.DB) {
		user := seedUser(t, tx, "migrate_sched@test.com", "migratesched")
		repo := NewScheduleRepository(tx)

		oldSched := &models.DeckSchedule{Name: "Old", UserId: user.Id}
		newSched := &models.DeckSchedule{Name: "New", UserId: user.Id}
		require.NoError(t, repo.CreateSchedule(oldSched))
		require.NoError(t, repo.CreateSchedule(newSched))

		deck := &models.Deck{UserId: user.Id, Name: "D", ScheduleId: oldSched.Id}
		require.NoError(t, tx.Create(deck).Error)

		require.NoError(t, repo.UpdateSchedule(oldSched.Id, newSched.Id))

		var updatedDeck models.Deck
		require.NoError(t, tx.First(&updatedDeck, deck.Id).Error)
		assert.Equal(t, newSched.Id, updatedDeck.ScheduleId)
	})
}
