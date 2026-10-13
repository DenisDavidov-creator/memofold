//go:build integration

// Пакет integration содержит end-to-end тесты, которые проверяют полный стек:
// сервис → репозиторий → реальная PostgreSQL БД.
package integration

import (
	"testing"
	"time"

	models "dimplom_harmonic/domain"
	authinterfaces "dimplom_harmonic/internal/auth"
	authrepo "dimplom_harmonic/internal/auth/repository"
	authsvc "dimplom_harmonic/internal/auth/service"
	"dimplom_harmonic/internal/card"
	cardrepo "dimplom_harmonic/internal/card/repository"
	cardsvc "dimplom_harmonic/internal/card/service"
	"dimplom_harmonic/internal/deck"
	deckrepo "dimplom_harmonic/internal/deck/repository"
	decksvc "dimplom_harmonic/internal/deck/service"
	schedrepo "dimplom_harmonic/internal/schedule/repository"
	schedsvc "dimplom_harmonic/internal/schedule/service"
	"dimplom_harmonic/internal/testutils"
	wordset "dimplom_harmonic/internal/wordSet"
	wsrepo "dimplom_harmonic/internal/wordSet/repository"
	wssvc "dimplom_harmonic/internal/wordSet/service"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type services struct {
	auth     authinterfaces.UserService
	card     *cardsvc.CardService
	deck     deck.DeckService
	schedule *schedsvc.ScheduleService
	wordSet  *wssvc.WordSetService
	db       *gorm.DB
}

func newServices(db *gorm.DB) *services {
	aRepo := authrepo.NewUserRepository(db)
	cRepo := cardrepo.NewCardRepository(db)
	dRepo := deckrepo.NewDeckRepository(db)
	sRepo := schedrepo.NewScheduleRepository(db)
	wRepo := wsrepo.NewWordSetRepository(db)

	return &services{
		auth:     authsvc.NewUserService(aRepo, wRepo, sRepo, dRepo, cRepo, []byte("integration-test-secret"), db),
		card:     cardsvc.NewCardService(cRepo, wRepo, db),
		deck:     decksvc.NewDeckService(dRepo, sRepo, cRepo, aRepo, wRepo, db),
		schedule: schedsvc.NewScheduleService(sRepo, db),
		wordSet:  wssvc.NewWordSetService(wRepo, cRepo, db),
		db:       db,
	}
}

// ──────────────────────── Auth ────────────────────────

func TestIntegration_RegisterAndLogin(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	newUser, err := svc.auth.RegisterUser(models.User{
		Email:        "reg@test.com",
		Login:        "reguser",
		PasswordHash: "password123",
	})
	require.NoError(t, err)
	assert.NotZero(t, newUser.Id)
	assert.Equal(t, "reg@test.com", newUser.Email)

	access, refresh, err := svc.auth.LoginUser("reg@test.com", "password123")
	require.NoError(t, err)
	assert.NotEmpty(t, access)
	assert.NotEmpty(t, refresh)
}

func TestIntegration_RegisterDuplicateEmail(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	_, err := svc.auth.RegisterUser(models.User{Email: "dup@test.com", Login: "u1", PasswordHash: "pass"})
	require.NoError(t, err)

	_, err = svc.auth.RegisterUser(models.User{Email: "dup@test.com", Login: "u2", PasswordHash: "pass"})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "already taken")
}

func TestIntegration_LoginWrongPassword(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	_, err := svc.auth.RegisterUser(models.User{Email: "wrongpass@test.com", Login: "wpuser", PasswordHash: "correctpass"})
	require.NoError(t, err)

	_, _, err = svc.auth.LoginUser("wrongpass@test.com", "wrongpass")
	assert.Error(t, err)
}

func TestIntegration_GetProfile(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	newUser, err := svc.auth.RegisterUser(models.User{Email: "profile@test.com", Login: "profileuser", PasswordHash: "pass"})
	require.NoError(t, err)

	profile, stats, err := svc.auth.GetProfile(newUser.Id)
	require.NoError(t, err)
	assert.Equal(t, "profile@test.com", profile.Email)
	assert.Equal(t, "free", profile.Status)
	assert.Zero(t, stats.ActiveDecksCount)
}

func TestIntegration_MockPayment(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "pay@test.com", Login: "payuser", PasswordHash: "pass"})
	require.NoError(t, err)

	require.NoError(t, svc.auth.MockPayment(user.Id, "month"))

	profile, _, err := svc.auth.GetProfile(user.Id)
	require.NoError(t, err)
	assert.Equal(t, "premium", profile.Status)
}

func TestIntegration_RefreshToken(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	_, err := svc.auth.RegisterUser(models.User{Email: "refresh@test.com", Login: "refreshuser", PasswordHash: "pass"})
	require.NoError(t, err)

	_, refreshToken, err := svc.auth.LoginUser("refresh@test.com", "pass")
	require.NoError(t, err)

	newAccess, newRefresh, err := svc.auth.RefreshToken(refreshToken)
	require.NoError(t, err)
	assert.NotEmpty(t, newAccess)
	assert.NotEmpty(t, newRefresh)
	assert.NotEqual(t, refreshToken, newRefresh)
}

// ──────────────────────── Cards ────────────────────────

func TestIntegration_Card_CreateUpdateDelete(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "cards@test.com", Login: "carduser", PasswordHash: "pass"})
	require.NoError(t, err)

	created, err := svc.card.CreateCard(models.Card{
		OriginalWord: "apple",
		Translation:  "яблоко",
	}, user.Id)
	require.NoError(t, err)
	assert.NotZero(t, created.Id)

	updated, err := svc.card.UpdateCard(models.Card{
		Id:           created.Id,
		OriginalWord: "apple updated",
		Translation:  "яблоко обновлено",
	})
	require.NoError(t, err)
	assert.Equal(t, "apple updated", updated.OriginalWord)
}

func TestIntegration_Card_CreateEmptyWord(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "emptycard@test.com", Login: "emptycard", PasswordHash: "pass"})
	require.NoError(t, err)

	_, err = svc.card.CreateCard(models.Card{OriginalWord: "", Translation: "test"}, user.Id)
	require.Error(t, err)
}

func TestIntegration_Card_HardCards(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "hard@test.com", Login: "harduser", PasswordHash: "pass"})
	require.NoError(t, err)

	c1, err := svc.card.CreateCard(models.Card{OriginalWord: "hard1", Translation: "т1"}, user.Id)
	require.NoError(t, err)
	c2, err := svc.card.CreateCard(models.Card{OriginalWord: "hard2", Translation: "т2"}, user.Id)
	require.NoError(t, err)

	err = svc.card.CreateHardCards(card.CreateHardWordsDTO{CardIds: []int{c1.Id, c2.Id}}, user.Id)
	require.NoError(t, err)
}

// ──────────────────────── Decks ────────────────────────

func TestIntegration_Deck_CreateAndGet(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "deck@test.com", Login: "deckuser", PasswordHash: "pass"})
	require.NoError(t, err)

	profile, _, err := svc.auth.GetProfile(user.Id)
	require.NoError(t, err)
	_ = profile

	schedules, err := svc.schedule.GetAllSchedules(user.Id)
	require.NoError(t, err)
	require.Len(t, schedules, 1, "должен существовать дефолтный schedule после регистрации")

	created, err := svc.deck.CreateDeck(deck.CreateDeckRequestDTO{
		Name:           "My Deck",
		ScheduleId:     schedules[0].Id,
		NextReviewDate: time.Now().Add(24 * time.Hour),
		NewCards: []card.CreateCardRequestDTO{
			{OriginalWord: "cat", Translation: "кот"},
		},
	}, user.Id)
	require.NoError(t, err)
	assert.Equal(t, "My Deck", created.Name)

	decks, err := svc.deck.GetDecks(user.Id, false)
	require.NoError(t, err)
	assert.Len(t, decks, 1)
	assert.Equal(t, 1, decks[0].CardsCount)
}

func TestIntegration_Deck_FreeUserLimits(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "free@test.com", Login: "freeuser", PasswordHash: "pass"})
	require.NoError(t, err)

	schedules, err := svc.schedule.GetAllSchedules(user.Id)
	require.NoError(t, err)
	schedId := schedules[0].Id

	// Первая колода — успешно
	_, err = svc.deck.CreateDeck(deck.CreateDeckRequestDTO{
		Name:           "Deck1",
		ScheduleId:     schedId,
		NextReviewDate: time.Now().Add(time.Hour),
		NewCards:       []card.CreateCardRequestDTO{{OriginalWord: "w", Translation: "с"}},
	}, user.Id)
	require.NoError(t, err)

	// Вторая колода в тот же день — превышение лимита
	_, err = svc.deck.CreateDeck(deck.CreateDeckRequestDTO{
		Name:           "Deck2",
		ScheduleId:     schedId,
		NextReviewDate: time.Now().Add(time.Hour),
		NewCards:       []card.CreateCardRequestDTO{{OriginalWord: "x", Translation: "й"}},
	}, user.Id)
	require.Error(t, err)
	assert.Equal(t, "free_limit_decks_exceeded", err.Error())
}

func TestIntegration_Deck_Review(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "review@test.com", Login: "reviewuser", PasswordHash: "pass"})
	require.NoError(t, err)

	schedules, err := svc.schedule.GetAllSchedules(user.Id)
	require.NoError(t, err)
	schedId := schedules[0].Id

	created, err := svc.deck.CreateDeck(deck.CreateDeckRequestDTO{
		Name:           "Review Deck",
		ScheduleId:     schedId,
		NextReviewDate: time.Now(),
		NewCards: []card.CreateCardRequestDTO{
			{OriginalWord: "dog", Translation: "собака"},
			{OriginalWord: "cat", Translation: "кот"},
		},
	}, user.Id)
	require.NoError(t, err)

	deckData, err := svc.deck.GetDecks(user.Id, false)
	require.NoError(t, err)
	require.Len(t, deckData, 1)
	deckId := deckData[0].Id

	fullDeck, err := svc.deck.GetDeckByID(user.Id, deckId)
	require.NoError(t, err)
	require.Len(t, fullDeck.Cards, 2)

	results := []models.CardReveiewResult{
		{CardId: fullDeck.Cards[0].Id, IsCorrect: true},
		{CardId: fullDeck.Cards[1].Id, IsCorrect: true},
	}

	response, err := svc.deck.Review(user.Id, deckId, results)
	require.NoError(t, err)
	assert.Equal(t, 100, response.Accuracy)
	assert.Equal(t, 1, response.Level)
	assert.True(t, response.NextReviewDate.After(time.Now()))
	_ = created.Name
}

func TestIntegration_Deck_UpdateAndDelete(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "updel@test.com", Login: "updeluser", PasswordHash: "pass"})
	require.NoError(t, err)

	schedules, err := svc.schedule.GetAllSchedules(user.Id)
	require.NoError(t, err)

	_, err = svc.deck.CreateDeck(deck.CreateDeckRequestDTO{
		Name:           "ToUpdate",
		ScheduleId:     schedules[0].Id,
		NextReviewDate: time.Now().Add(time.Hour),
		NewCards:       []card.CreateCardRequestDTO{{OriginalWord: "w", Translation: "с"}},
	}, user.Id)
	require.NoError(t, err)

	decks, err := svc.deck.GetDecks(user.Id, false)
	require.NoError(t, err)
	deckId := decks[0].Id

	updated, err := svc.deck.UpdateDeck(user.Id, deckId, deck.UpdateDeckRequestDTO{
		Name:           "Updated Name",
		ScheduleId:     schedules[0].Id,
		NextReviewDate: time.Now().Add(48 * time.Hour),
	})
	require.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)

	require.NoError(t, svc.deck.DeleteDeck(deckId, user.Id))

	remaining, err := svc.deck.GetDecks(user.Id, false)
	require.NoError(t, err)
	assert.Len(t, remaining, 0)
}

func TestIntegration_Deck_RestartProgress(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "restart@test.com", Login: "restartuser", PasswordHash: "pass"})
	require.NoError(t, err)

	schedules, err := svc.schedule.GetAllSchedules(user.Id)
	require.NoError(t, err)

	_, err = svc.deck.CreateDeck(deck.CreateDeckRequestDTO{
		Name:           "Restart Deck",
		ScheduleId:     schedules[0].Id,
		NextReviewDate: time.Now(),
		NewCards:       []card.CreateCardRequestDTO{{OriginalWord: "w", Translation: "с"}},
	}, user.Id)
	require.NoError(t, err)

	decks, err := svc.deck.GetDecks(user.Id, false)
	require.NoError(t, err)

	require.NoError(t, svc.deck.RestartProgressDeck(user.Id, decks[0].Id))

	restarted, err := svc.deck.GetDeckByID(user.Id, decks[0].Id)
	require.NoError(t, err)
	assert.Equal(t, 0, restarted.CurrentLevel)
}

// ──────────────────────── Schedule ────────────────────────

func TestIntegration_Schedule_CreateAndGet(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "sched_svc@test.com", Login: "schedsvc", PasswordHash: "pass"})
	require.NoError(t, err)

	sched := models.DeckSchedule{Name: "Custom Schedule", UserId: user.Id}
	levels := []models.ScheduleStep{
		{Level: 0, IntervalMinutes: 60},
		{Level: 1, IntervalMinutes: 180},
	}

	created, err := svc.schedule.CreateSchedule(sched, levels)
	require.NoError(t, err)
	assert.Equal(t, "Custom Schedule", created.Name)
	assert.Len(t, created.ScheduleSteps, 2)

	all, err := svc.schedule.GetAllSchedules(user.Id)
	require.NoError(t, err)
	// Дефолтный из регистрации + новый
	assert.GreaterOrEqual(t, len(all), 2)
}

func TestIntegration_Schedule_DeleteDefaultFails(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "del_def_sched@test.com", Login: "deldefsched", PasswordHash: "pass"})
	require.NoError(t, err)

	schedules, err := svc.schedule.GetAllSchedules(user.Id)
	require.NoError(t, err)
	require.Len(t, schedules, 1)
	defaultId := schedules[0].Id

	err = svc.schedule.DeleteSchedule(defaultId, defaultId)
	require.Error(t, err)
	assert.Equal(t, "You can't delete default schedule", err.Error())
}

func TestIntegration_Schedule_UpdateSchedule(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "upd_sched_svc@test.com", Login: "updschedsvc", PasswordHash: "pass"})
	require.NoError(t, err)

	sched, err := svc.schedule.CreateSchedule(
		models.DeckSchedule{Name: "OldName", UserId: user.Id},
		[]models.ScheduleStep{{Level: 0, IntervalMinutes: 100}},
	)
	require.NoError(t, err)

	updated, err := svc.schedule.UpdateSchedule(user.Id, sched.Id, "NewName", []models.ScheduleStep{
		{Level: 0, IntervalMinutes: 200},
		{Level: 1, IntervalMinutes: 400},
	})
	require.NoError(t, err)
	assert.Equal(t, "NewName", updated.Name)
	assert.Len(t, updated.ScheduleSteps, 2)
}

// ──────────────────────── WordSet ────────────────────────

func TestIntegration_WordSet_CreateAndGet(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "ws_svc@test.com", Login: "wssvc", PasswordHash: "pass"})
	require.NoError(t, err)

	ws, err := svc.wordSet.CreateWordSet(&wordset.WordSetDTO{Name: "Phrasal Verbs", IsPublic: true}, user.Id)
	require.NoError(t, err)
	assert.Equal(t, "Phrasal Verbs", ws.Name)
	assert.NotZero(t, ws.Id)

	all, err := svc.wordSet.GetAllWordSet(user.Id, "my")
	require.NoError(t, err)
	// Дефолтный ("Difficult words") + новый
	assert.GreaterOrEqual(t, len(all), 2)
}

func TestIntegration_WordSet_DeleteDefaultFails(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "del_def_ws@test.com", Login: "deldefws", PasswordHash: "pass"})
	require.NoError(t, err)

	all, err := svc.wordSet.GetAllWordSet(user.Id, "my")
	require.NoError(t, err)
	require.Len(t, all, 1)

	err = svc.wordSet.DeleteWordSet(user.Id, all[0].Id)
	require.Error(t, err)
	assert.Equal(t, "You can't delete default word set", err.Error())
}

func TestIntegration_WordSet_UpdateWordSet(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	user, err := svc.auth.RegisterUser(models.User{Email: "upd_ws@test.com", Login: "updws", PasswordHash: "pass"})
	require.NoError(t, err)

	ws, err := svc.wordSet.CreateWordSet(&wordset.WordSetDTO{Name: "Old", IsPublic: false}, user.Id)
	require.NoError(t, err)

	updated, err := svc.wordSet.UpdateWordSet(ws.Id, "New Name", true)
	require.NoError(t, err)
	assert.Equal(t, "New Name", updated.Name)
	assert.True(t, updated.IsPublic)
}

func TestIntegration_WordSet_CopyWordSet(t *testing.T) {
	db := testutils.SetupTestDB(t)
	svc := newServices(db)

	owner, err := svc.auth.RegisterUser(models.User{Email: "ws_owner@test.com", Login: "wsowner", PasswordHash: "pass"})
	require.NoError(t, err)
	viewer, err := svc.auth.RegisterUser(models.User{Email: "ws_viewer@test.com", Login: "wsviewer", PasswordHash: "pass"})
	require.NoError(t, err)

	ws, err := svc.wordSet.CreateWordSet(&wordset.WordSetDTO{Name: "Public Set", IsPublic: true}, owner.Id)
	require.NoError(t, err)

	_, err = svc.card.CreateCard(models.Card{OriginalWord: "sun", Translation: "солнце"}, owner.Id)
	require.NoError(t, err)

	copied, err := svc.wordSet.CopyWordSet(ws.Id, viewer.Id)
	require.NoError(t, err)
	assert.Equal(t, "Public Set", copied.Name)
	assert.Equal(t, viewer.Id, copied.UserId)
	assert.False(t, copied.IsPublic)
}
