package mocks

import (
	"dimplom_harmonic/internal/card"
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type MockCardRepo struct {
	CreateCardFn                  func(cards []models.Card, userId int) error
	CreateHistoryFn               func(history []models.CardHistory) error
	DeleteCardFromDeckFn          func(c *models.Card, deck *models.Deck) error
	DeleteCardFromWordSetFn       func(c *models.Card, wordSet *models.WordSet) error
	GetCardByIdFn                 func(cardId int) (*models.Card, error)
	DeleteCardFn                  func(cardId int) error
	DeleteHistoriesFn             func(userId, deckId int) error
	UpdateCardFn                  func(cardId int, changeCard map[string]any) error
	GetUserCardStatsFn            func(userId int) (*card.GetUserCardStats, error)
	DeleteCardFromDefaultWordSetFn func(wordSetId int, cards []int) error
	WithTxFn                      func(tx *gorm.DB) card.CardRepository
}

func (m *MockCardRepo) CreateCard(cards []models.Card, userId int) error {
	if m.CreateCardFn != nil {
		return m.CreateCardFn(cards, userId)
	}
	return nil
}

func (m *MockCardRepo) CreateHistory(history []models.CardHistory) error {
	if m.CreateHistoryFn != nil {
		return m.CreateHistoryFn(history)
	}
	return nil
}

func (m *MockCardRepo) DeleteCardFromDeck(c *models.Card, deck *models.Deck) error {
	if m.DeleteCardFromDeckFn != nil {
		return m.DeleteCardFromDeckFn(c, deck)
	}
	return nil
}

func (m *MockCardRepo) DeleteCardFromWordSet(c *models.Card, wordSet *models.WordSet) error {
	if m.DeleteCardFromWordSetFn != nil {
		return m.DeleteCardFromWordSetFn(c, wordSet)
	}
	return nil
}

func (m *MockCardRepo) GetCardById(cardId int) (*models.Card, error) {
	if m.GetCardByIdFn != nil {
		return m.GetCardByIdFn(cardId)
	}
	return &models.Card{Id: cardId}, nil
}

func (m *MockCardRepo) DeleteCard(cardId int) error {
	if m.DeleteCardFn != nil {
		return m.DeleteCardFn(cardId)
	}
	return nil
}

func (m *MockCardRepo) DeleteHistories(userId, deckId int) error {
	if m.DeleteHistoriesFn != nil {
		return m.DeleteHistoriesFn(userId, deckId)
	}
	return nil
}

func (m *MockCardRepo) UpdateCard(cardId int, changeCard map[string]any) error {
	if m.UpdateCardFn != nil {
		return m.UpdateCardFn(cardId, changeCard)
	}
	return nil
}

func (m *MockCardRepo) GetUserCardStats(userId int) (*card.GetUserCardStats, error) {
	if m.GetUserCardStatsFn != nil {
		return m.GetUserCardStatsFn(userId)
	}
	return &card.GetUserCardStats{}, nil
}

func (m *MockCardRepo) DeleteCardFromDefaultWordSet(wordSetId int, cards []int) error {
	if m.DeleteCardFromDefaultWordSetFn != nil {
		return m.DeleteCardFromDefaultWordSetFn(wordSetId, cards)
	}
	return nil
}

func (m *MockCardRepo) WithTx(tx *gorm.DB) card.CardRepository {
	if m.WithTxFn != nil {
		return m.WithTxFn(tx)
	}
	return m
}
