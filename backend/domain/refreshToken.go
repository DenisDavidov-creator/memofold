package models

import "time"

type RefreshToken struct {
	Id        int
	UserId    int
	Token     string `gorm:"unique"`
	ExpiresAt time.Time
}
