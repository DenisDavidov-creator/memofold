package models

import "time"

type CardHistory struct {
	Id         int
	UserId     int
	DeckId     int
	CardId     int
	ReviewDate time.Time
	IsCorrect  bool
}
