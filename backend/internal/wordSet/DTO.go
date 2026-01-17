package wordset

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/card"
)

type WordSetDTO struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	IsPublic bool   `json:"isPublic"`
}

type WordSetByIdDTO struct {
	Id        int    `json:"id"`
	UserId    int    `json:"userId"`
	Name      string `json:"name"`
	IsPublic  bool   `json:"isPublic"`
	IsDefault bool   `json:"isDefault"`

	Cards []card.UpdateCardDTO `json:"cards"`
}

func WordSetModelTo(m *models.WordSet) WordSetDTO {
	return WordSetDTO{
		Id:       m.Id,
		Name:     m.Name,
		IsPublic: m.IsPublic,
	}
}

func WordSetGetModelTo(m *models.WordSet) WordSetByIdDTO {
	// cards := make([]card.UpdateCardDTO, 0)

	WS := WordSetByIdDTO{
		Id:        m.Id,
		UserId:    m.UserId,
		Name:      m.Name,
		IsPublic:  m.IsPublic,
		IsDefault: m.IsDefault,
	}

	cards := card.GetCardsModelTo(m.Cards)

	WS.Cards = cards
	return WS
}
