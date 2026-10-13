package mocks

import (
	"dimplom_harmonic/internal/deck"
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type MockDeckRepo struct {
	CreateDeckFn          func(d *models.Deck, userId int) error
	GetDecksFn            func(userID int, typeArch bool) ([]deck.DeckGetAllResult, error)
	GetByIDFn             func(userID, deckID int) (*models.Deck, error)
	CreateHistoryFn       func(deckHistory *models.DeckHistory) error
	UpdateFn              func(userId int, deckId int, d map[string]any) error
	DeleteHistoriesFn     func(deckId int) error
	DeleteDeckFn          func(deckId int, userId int) error
	AddConectionFn        func(d *models.Deck, cards []models.Card) error
	GetDeckStatsForUserFn func(userId int) (*deck.GetUserStatsResult, error)
	GetCountDeckFn        func(userId int, currentDate string) (*int, error)
	WithTxFn              func(tx *gorm.DB) deck.DeckRepository
}

func (m *MockDeckRepo) CreateDeck(d *models.Deck, userId int) error {
	if m.CreateDeckFn != nil {
		return m.CreateDeckFn(d, userId)
	}
	return nil
}

func (m *MockDeckRepo) GetDecks(userID int, typeArch bool) ([]deck.DeckGetAllResult, error) {
	if m.GetDecksFn != nil {
		return m.GetDecksFn(userID, typeArch)
	}
	return nil, nil
}

func (m *MockDeckRepo) GetByID(userID, deckID int) (*models.Deck, error) {
	if m.GetByIDFn != nil {
		return m.GetByIDFn(userID, deckID)
	}
	return &models.Deck{Id: deckID, UserId: userID}, nil
}

func (m *MockDeckRepo) CreateHistory(deckHistory *models.DeckHistory) error {
	if m.CreateHistoryFn != nil {
		return m.CreateHistoryFn(deckHistory)
	}
	return nil
}

func (m *MockDeckRepo) Update(userId int, deckId int, d map[string]any) error {
	if m.UpdateFn != nil {
		return m.UpdateFn(userId, deckId, d)
	}
	return nil
}

func (m *MockDeckRepo) DeleteHistories(deckId int) error {
	if m.DeleteHistoriesFn != nil {
		return m.DeleteHistoriesFn(deckId)
	}
	return nil
}

func (m *MockDeckRepo) DeleteDeck(deckId int, userId int) error {
	if m.DeleteDeckFn != nil {
		return m.DeleteDeckFn(deckId, userId)
	}
	return nil
}

func (m *MockDeckRepo) AddConection(d *models.Deck, cards []models.Card) error {
	if m.AddConectionFn != nil {
		return m.AddConectionFn(d, cards)
	}
	return nil
}

func (m *MockDeckRepo) GetDeckStatsForUser(userId int) (*deck.GetUserStatsResult, error) {
	if m.GetDeckStatsForUserFn != nil {
		return m.GetDeckStatsForUserFn(userId)
	}
	return &deck.GetUserStatsResult{}, nil
}

func (m *MockDeckRepo) GetCountDeck(userId int, currentDate string) (*int, error) {
	if m.GetCountDeckFn != nil {
		return m.GetCountDeckFn(userId, currentDate)
	}
	zero := 0
	return &zero, nil
}

func (m *MockDeckRepo) WithTx(tx *gorm.DB) deck.DeckRepository {
	if m.WithTxFn != nil {
		return m.WithTxFn(tx)
	}
	return m
}
