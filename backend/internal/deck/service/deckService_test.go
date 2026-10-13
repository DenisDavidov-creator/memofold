package service

import (
	"errors"
	"testing"
	"time"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/deck"
	"dimplom_harmonic/internal/mocks"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newDeckSvc(t *testing.T, deckRepo *mocks.MockDeckRepo, schedRepo *mocks.MockScheduleRepo, cardRepo *mocks.MockCardRepo, authRepo *mocks.MockAuthRepo, wsRepo *mocks.MockWordSetRepo) deck.DeckService {
	t.Helper()
	db, _ := mocks.NewMockDB(t)
	return NewDeckService(deckRepo, schedRepo, cardRepo, authRepo, wsRepo, db)
}

func premiumUser(t *testing.T) *mocks.MockAuthRepo {
	t.Helper()
	return &mocks.MockAuthRepo{
		GetByIDFn: func(id int) (*models.User, error) {
			return &models.User{Id: id, PremiumExpiresAt: time.Now().AddDate(1, 0, 0)}, nil
		},
	}
}

func freeUser(t *testing.T) *mocks.MockAuthRepo {
	t.Helper()
	return &mocks.MockAuthRepo{
		GetByIDFn: func(id int) (*models.User, error) {
			return &models.User{Id: id, PremiumExpiresAt: time.Now().AddDate(-1, 0, 0)}, nil
		},
	}
}

func TestCreateDeck_FreeUser_TooManyWords(t *testing.T) {
	svc := newDeckSvc(t, &mocks.MockDeckRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, freeUser(t), &mocks.MockWordSetRepo{})

	input := deck.CreateDeckRequestDTO{
		Name:        "My Deck",
		NewCards:    make([]card.CreateCardRequestDTO, 8),
		ScheduleId:  1,
	}
	_, err := svc.CreateDeck(input, 1)
	require.Error(t, err)
	assert.Equal(t, "free_limit_words_exceeded", err.Error())
}

func TestCreateDeck_FreeUser_TooManyDecks(t *testing.T) {
	count := 1
	deckRepo := &mocks.MockDeckRepo{
		GetCountDeckFn: func(userId int, currentDate string) (*int, error) { return &count, nil },
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, freeUser(t), &mocks.MockWordSetRepo{})

	input := deck.CreateDeckRequestDTO{Name: "Deck", NewCards: []card.CreateCardRequestDTO{{OriginalWord: "word"}}, ScheduleId: 1}
	_, err := svc.CreateDeck(input, 1)
	require.Error(t, err)
	assert.Equal(t, "free_limit_decks_exceeded", err.Error())
}

func TestCreateDeck_PremiumUser_Success(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	deckRepo := &mocks.MockDeckRepo{}
	cardRepo := &mocks.MockCardRepo{}
	wsRepo := &mocks.MockWordSetRepo{}

	svc := NewDeckService(deckRepo, &mocks.MockScheduleRepo{}, cardRepo, premiumUser(t), wsRepo, db)

	input := deck.CreateDeckRequestDTO{
		Name:           "Premium Deck",
		NewCards:       []card.CreateCardRequestDTO{{OriginalWord: "word", Translation: "слово"}},
		ScheduleId:     1,
		NextReviewDate: time.Now().Add(24 * time.Hour),
	}
	result, err := svc.CreateDeck(input, 1)
	require.NoError(t, err)
	assert.Equal(t, "Premium Deck", result.Name)
}

func TestCreateDeck_FreeUser_WithExistingCards_Success(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	count := 0
	deckRepo := &mocks.MockDeckRepo{
		GetCountDeckFn: func(userId int, currentDate string) (*int, error) { return &count, nil },
	}
	wsRepo := &mocks.MockWordSetRepo{}
	cardRepo := &mocks.MockCardRepo{}

	svc := NewDeckService(deckRepo, &mocks.MockScheduleRepo{}, cardRepo, freeUser(t), wsRepo, db)

	input := deck.CreateDeckRequestDTO{
		Name:            "Free Deck",
		ExistingCardIds: []int{1, 2},
		ScheduleId:      1,
	}
	result, err := svc.CreateDeck(input, 1)
	require.NoError(t, err)
	assert.Equal(t, "Free Deck", result.Name)
}

func TestGetDecks_Success(t *testing.T) {
	deckRepo := &mocks.MockDeckRepo{
		GetDecksFn: func(userID int, typeArch bool) ([]deck.DeckGetAllResult, error) {
			return []deck.DeckGetAllResult{
				{Deck: models.Deck{Id: 1, Name: "Deck1"}, CardsCount: 5},
				{Deck: models.Deck{Id: 2, Name: "Deck2"}, CardsCount: 3},
			}, nil
		},
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{})

	result, err := svc.GetDecks(1, false)
	require.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "Deck1", result[0].Name)
	assert.Equal(t, 5, result[0].CardsCount)
}

func TestGetDecks_Error(t *testing.T) {
	deckRepo := &mocks.MockDeckRepo{
		GetDecksFn: func(userID int, typeArch bool) ([]deck.DeckGetAllResult, error) {
			return nil, errors.New("db error")
		},
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{})

	_, err := svc.GetDecks(1, false)
	assert.Error(t, err)
}

func TestGetDeckByID_Success(t *testing.T) {
	deckRepo := &mocks.MockDeckRepo{
		GetByIDFn: func(userID, deckID int) (*models.Deck, error) {
			return &models.Deck{Id: deckID, UserId: userID, Name: "Test Deck"}, nil
		},
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{})

	result, err := svc.GetDeckByID(1, 10)
	require.NoError(t, err)
	assert.Equal(t, 10, result.Id)
	assert.Equal(t, "Test Deck", result.Name)
}

func TestReview_Success_HighAccuracy(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	d := &models.Deck{
		Id:                   1,
		CurrentLevel:         0,
		NextPrimaryDirection: true,
		ScheduleId:           1,
	}
	schedule := &models.DeckSchedule{
		Id: 1,
		ScheduleSteps: []models.ScheduleStep{
			{Level: 0, IntervalMinutes: 480},
			{Level: 1, IntervalMinutes: 1440},
		},
	}

	deckRepo := &mocks.MockDeckRepo{
		GetByIDFn: func(userID, deckID int) (*models.Deck, error) { return d, nil },
	}
	schedRepo := &mocks.MockScheduleRepo{
		GetScheduleFn: func(scheduleId int) (*models.DeckSchedule, error) { return schedule, nil },
	}
	cardRepo := &mocks.MockCardRepo{}

	svc := NewDeckService(deckRepo, schedRepo, cardRepo, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{}, db)

	results := []models.CardReveiewResult{
		{CardId: 1, IsCorrect: true},
		{CardId: 2, IsCorrect: true},
		{CardId: 3, IsCorrect: true},
	}
	response, err := svc.Review(1, 1, results)
	require.NoError(t, err)
	assert.Equal(t, 100, response.Accuracy)
	assert.Equal(t, 1, response.Level)
}

func TestReview_LowAccuracy_DirectionUnchanged(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	d := &models.Deck{
		Id:                   1,
		CurrentLevel:         0,
		NextPrimaryDirection: true,
		ScheduleId:           1,
	}
	schedule := &models.DeckSchedule{
		Id:            1,
		ScheduleSteps: []models.ScheduleStep{{Level: 0, IntervalMinutes: 480}},
	}

	deckRepo := &mocks.MockDeckRepo{
		GetByIDFn: func(userID, deckID int) (*models.Deck, error) { return d, nil },
	}
	schedRepo := &mocks.MockScheduleRepo{
		GetScheduleFn: func(scheduleId int) (*models.DeckSchedule, error) { return schedule, nil },
	}

	svc := NewDeckService(deckRepo, schedRepo, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{}, db)

	results := []models.CardReveiewResult{
		{CardId: 1, IsCorrect: false},
		{CardId: 2, IsCorrect: false},
		{CardId: 3, IsCorrect: true},
	}
	response, err := svc.Review(1, 1, results)
	require.NoError(t, err)
	assert.Equal(t, 33, response.Accuracy)
}

func TestReview_LastLevel_DeckArchived(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	d := &models.Deck{
		Id:           1,
		CurrentLevel: 5,
		ScheduleId:   1,
	}
	// Только уровень 0, текущий уровень 5 — шаг не найден
	schedule := &models.DeckSchedule{
		Id:            1,
		ScheduleSteps: []models.ScheduleStep{{Level: 0, IntervalMinutes: 480}},
	}

	deckRepo := &mocks.MockDeckRepo{
		GetByIDFn: func(userID, deckID int) (*models.Deck, error) { return d, nil },
	}
	schedRepo := &mocks.MockScheduleRepo{
		GetScheduleFn: func(scheduleId int) (*models.DeckSchedule, error) { return schedule, nil },
	}
	svc := NewDeckService(deckRepo, schedRepo, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{}, db)

	results := []models.CardReveiewResult{{CardId: 1, IsCorrect: true}}
	response, err := svc.Review(1, 1, results)
	require.NoError(t, err)
	assert.Equal(t, 5, response.Level)
	assert.True(t, response.NextReviewDate.After(time.Now().AddDate(999, 0, 0)))
}

func TestUpdateDeck_Success(t *testing.T) {
	deckRepo := &mocks.MockDeckRepo{
		UpdateFn: func(userId int, deckId int, d map[string]any) error { return nil },
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{})

	input := deck.UpdateDeckRequestDTO{Name: "Updated", ScheduleId: 2, NextReviewDate: time.Now()}
	result, err := svc.UpdateDeck(1, 10, input)
	require.NoError(t, err)
	assert.Equal(t, "Updated", result.Name)
	assert.Equal(t, 2, result.ScheduleId)
}

func TestUpdateDeck_Error(t *testing.T) {
	deckRepo := &mocks.MockDeckRepo{
		UpdateFn: func(userId int, deckId int, d map[string]any) error {
			return errors.New("update error")
		},
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{})

	_, err := svc.UpdateDeck(1, 10, deck.UpdateDeckRequestDTO{Name: "X"})
	assert.Error(t, err)
}

func TestRestartProgressDeck_Success(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	svc := NewDeckService(&mocks.MockDeckRepo{}, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{}, db)

	err := svc.RestartProgressDeck(1, 10)
	assert.NoError(t, err)
}

func TestDeleteDeck_Success(t *testing.T) {
	deleted := false
	deckRepo := &mocks.MockDeckRepo{
		DeleteDeckFn: func(deckId int, userId int) error {
			deleted = true
			return nil
		},
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{})

	err := svc.DeleteDeck(10, 1)
	require.NoError(t, err)
	assert.True(t, deleted)
}

func TestDeleteDeck_Error(t *testing.T) {
	deckRepo := &mocks.MockDeckRepo{
		DeleteDeckFn: func(deckId int, userId int) error {
			return errors.New("not found")
		},
	}
	svc := newDeckSvc(t, deckRepo, &mocks.MockScheduleRepo{}, &mocks.MockCardRepo{}, &mocks.MockAuthRepo{}, &mocks.MockWordSetRepo{})

	err := svc.DeleteDeck(10, 1)
	assert.Error(t, err)
}
