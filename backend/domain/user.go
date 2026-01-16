package models

import "time"

type User struct {
	Id               int    `gorm:"primaryKey"`
	Email            string `gorm:"unique"`
	Login            string `gorm:"unique"`
	PasswordHash     string
	PremiumExpiresAt time.Time

	Decks []Deck `gorm:"foreignKey:UserId"`
}
