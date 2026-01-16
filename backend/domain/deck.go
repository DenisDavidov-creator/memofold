package models

import "time"

type Deck struct {
	Id                   int       `json:"id" gorm:"primaryKey"`
	UserId               int       `json:"userId" gorm:"column:user_id"`
	Name                 string    `json:"name"`
	CreatedAt            time.Time `json:"createdAt" gorm:"column:created_at"`
	CurrentLevel         int       `json:"currentLevel" gorm:"column:current_level"`
	IsArchived           bool      `json:"isArchived" gorm:"column:is_archived"`
	NextReviewDate       time.Time `json:"nextReviewDate" gorm:"column:next_review_date"`
	NextPrimaryDirection bool      `json:"nextPrimaryDirection" gorm:"column:next_primary_direction"`

	ScheduleId int          `json:"scheduleId" gorm:"column:schedule_id"`
	Schedule   DeckSchedule `json:"schedule,omitempty" gorm:"foreignKey:ScheduleId"`

	Cards []Card `json:"cards,omitempty" gorm:"many2many:deck_cards;"`

	DeckHistories []DeckHistory `json:"deckHistories,omitempty" gorm:"foreignKey:DeckId"`
}

func (Deck) TableName() string {
	return "decks"
}
