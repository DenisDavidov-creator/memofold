package deck

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/schedule"
	"time"
)

type CreateDeckRequestDTO struct {
	Name            string                      `json:"name"`
	NextReviewDate  time.Time                   `json:"nextReviewDate"`
	ScheduleId      int                         `json:"scheduleId"`
	ExistingCardIds []int                       `json:"existingCardIds"`
	NewCards        []card.CreateCardRequestDTO `json:"newCards"`
}

type CreateDeckResponseDTO struct {
	Name           string    `json:"name"`
	NextReviewDate time.Time `json:"nextReviewDate"`
	ScheduleId     int       `json:"scheduleId"`
}

type ReviewResultsDTO struct {
	Results []SubmitReviewDTO `json:"results"`
}

type SubmitReviewDTO struct {
	CardId    int  `json:"cardId"`
	IsCorrect bool `json:"isCorrect"`
}

type GetAllDecksResponseDTO struct {
	Id             int       `json:"id"`
	Name           string    `json:"name"`
	CurrentLevel   int       `json:"currentLevel"`
	NextReviewDate time.Time `json:"nextReviewDate"`
	CardsCount     int       `json:"cardsCount"`
	IsArchived     bool      `json:"isArchived"`
}
type UpdateDeckRequestDTO struct {
	Id             int       `json:"id"`
	Name           string    `json:"name"`
	ScheduleId     int       `json:"scheduleId"`
	NextReviewDate time.Time `json:"nextReviewDate"`
}

type UpdateDecResposnsekDTO struct {
	Name           string    `json:"name"`
	ScheduleId     int       `json:"scheduleId"`
	NextReviewDate time.Time `json:"nextReviewDate"`
}

type GetDeckByIdResponseDTO struct {
	Id                   int       `json:"id"`
	UserId               int       `json:"userId"`
	Name                 string    `json:"name"`
	CurrentLevel         int       `json:"currentLevel"`
	IsArchived           bool      `json:"isArchived"`
	NextReviewDate       time.Time `json:"nextReviewDate"`
	NextPrimaryDirection bool      `json:"nextPrimaryDirection"`

	ScheduleId int                  `json:"scheduleId"`
	Schedule   schedule.ScheduleDTO `json:"schedule,omitempty"`

	Cards []card.UpdateCardDTO `json:"cards,omitempty"`

	DeckHistories []DeckHistoriesDTO `json:"deckHistories,omitempty"`
}

func DeckByIdModetlTo(m *models.Deck) GetDeckByIdResponseDTO {

	deckResponse := GetDeckByIdResponseDTO{
		Id:                   m.Id,
		UserId:               m.UserId,
		Name:                 m.Name,
		CurrentLevel:         m.CurrentLevel,
		IsArchived:           m.IsArchived,
		NextReviewDate:       m.NextReviewDate,
		NextPrimaryDirection: m.NextPrimaryDirection,
		ScheduleId:           m.ScheduleId,
		Schedule:             schedule.ScheduleModelTo(&m.Schedule),
		Cards:                card.GetCardsModelTo(m.Cards),
		DeckHistories:        DeckHistoryModelTo(m.DeckHistories),
	}

	return deckResponse
}

type DeckHistoriesDTO struct {
	Id         int       `json:"id"`
	DeckId     int       `json:"deckId"`
	ReviewDate time.Time `json:"reviewDate"`
	Accuracy   int       `json:"accuracy"`
}

func DeckHistoryModelTo(m []models.DeckHistory) []DeckHistoriesDTO {
	var deckHistoryG []DeckHistoriesDTO

	for _, value := range m {
		deckG := DeckHistoriesDTO{
			Id:         value.Id,
			DeckId:     value.DeckId,
			ReviewDate: value.ReviewDate,
			Accuracy:   value.Accuracy,
		}
		deckHistoryG = append(deckHistoryG, deckG)
	}
	return deckHistoryG
}
