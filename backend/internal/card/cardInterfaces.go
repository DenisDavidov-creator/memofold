package card

import (
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type CardService interface {
	CreateCard(card models.Card, userId int) (*models.Card, error)
	DeleteCard(deleteCard DeleteCardParam) error
	UpdateCard(input models.Card) (*models.Card, error)
	CreateHardCards(ids CreateHardWordsDTO, userId int) error
}

type CardRepository interface {
	CreateCard([]models.Card, int) error
	CreateHistory(history []models.CardHistory) error

	DeleteCardFromDeck(card *models.Card, deck *models.Deck) error
	DeleteCardFromWordSet(card *models.Card, wordSet *models.WordSet) error
	GetCardById(cardId int) (*models.Card, error)
	DeleteCard(cardId int) error

	DeleteHistories(userId, deckId int) error
	UpdateCard(cardId int, changeCard map[string]any) error

	GetUserCardStats(userId int) (*GetUserCardStats, error)
	DeleteCardFromDefaultWordSet(wordSetId int, cards []int) error
	WithTx(tx *gorm.DB) CardRepository
}

type DeleteCardParam struct {
	Id        int
	DeckId    *int
	WordSetId *int
}

type GetUserCardStats struct {
	Learning int
	Mastered int
}
