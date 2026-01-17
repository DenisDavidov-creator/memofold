package card

import (
	models "dimplom_harmonic/domain"
)

type CreateCardRequestDTO struct {
	OriginalWord       string `json:"originalWord"`
	Translation        string `json:"translation"`
	OriginalContext    string `json:"originalContext"`
	TranslationContext string `json:"translationContext"`

	DeckId    int `json:"deckId"`
	WordSetId int `json:"wordSetId"`
}

type CreateCardsDTO struct {
	Cards []CreateCardRequestDTO `json:"cards"`
}

func CreateCardToModel(c *CreateCardRequestDTO) models.Card {

	if c.DeckId == 0 && c.WordSetId == 0 {
		return models.Card{}
	}

	newCard := models.Card{
		OriginalWord:       c.OriginalWord,
		Translation:        c.Translation,
		OriginalContext:    c.OriginalContext,
		TranslationContext: c.TranslationContext,

		Decks:    nil,
		WordSets: nil,
	}

	if c.DeckId != 0 {
		newCard.Decks = []models.Deck{{Id: c.DeckId}}
	}
	if c.WordSetId != 0 {
		newCard.WordSets = []models.WordSet{{Id: c.WordSetId}}
	}

	return newCard
}

func CreateCardBatchToModel(c *CreateCardRequestDTO, wordSetId int) models.Card {
	cardC := models.Card{
		OriginalWord:       c.OriginalWord,
		Translation:        c.Translation,
		OriginalContext:    c.OriginalContext,
		TranslationContext: c.TranslationContext,
		WordSets:           []models.WordSet{{Id: wordSetId}},
	}

	return cardC
}

func CreateCardsToModel(c []CreateCardRequestDTO, wordSetId int) []models.Card {

	var cards []models.Card
	for _, value := range c {
		c := CreateCardBatchToModel(&value, wordSetId)
		cards = append(cards, c)
	}
	return cards
}

func CreateCardModelTo(m *models.Card) CreateCardResponseDTO {
	return CreateCardResponseDTO{
		Id:                 m.Id,
		OriginalWord:       m.OriginalWord,
		Translation:        m.OriginalWord,
		OriginalContext:    m.OriginalContext,
		TranslationContext: m.TranslationContext,
	}
}

type CreateCardResponseDTO struct {
	Id                 int    `json:"id"`
	OriginalWord       string `json:"originalWord"`
	Translation        string `json:"translation"`
	OriginalContext    string `json:"originalContext"`
	TranslationContext string `json:"translationContext"`
}
type UpdateCardDTO struct {
	Id                 int    `json:"id"`
	OriginalWord       string `json:"originalWord"`
	Translation        string `json:"translation"`
	OriginalContext    string `json:"originalContext"`
	TranslationContext string `json:"translationContext"`
	IsLearning         bool   `json:"isLearning"`
}

func UpdateCardToModel(c *UpdateCardDTO) models.Card {
	return models.Card{
		Id:                 c.Id,
		OriginalWord:       c.OriginalWord,
		Translation:        c.Translation,
		OriginalContext:    c.OriginalContext,
		TranslationContext: c.TranslationContext,
	}
}

func UpdateCardModelTo(m *models.Card) UpdateCardDTO {
	return UpdateCardDTO{
		Id:                 m.Id,
		OriginalWord:       m.OriginalWord,
		Translation:        m.Translation,
		OriginalContext:    m.OriginalContext,
		TranslationContext: m.TranslationContext,
		IsLearning:         m.IsLearning,
	}
}

func GetCardsModelTo(m []models.Card) []UpdateCardDTO {
	cards := make([]UpdateCardDTO, 0)

	for _, value := range m {
		cards = append(cards, UpdateCardModelTo(&value))
	}
	return cards
}

type CreateHardWordsDTO struct {
	CardIds []int `json:"cardIds"`
}
