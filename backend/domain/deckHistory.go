package models

import "time"

type DeckHistory struct {
	Id         int
	DeckId     int
	ReviewDate time.Time
	Accuracy   int
}
