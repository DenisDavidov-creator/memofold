package models

type UserCardStats struct {
	UserId      int  `json:"userId" gorm:"prymaryKey"`
	CardId      int  `json:"cardId" gorm:"prymaryKey"`
	IsDifficult bool `json:"isDifficult"`
}
