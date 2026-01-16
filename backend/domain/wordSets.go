package models

type WordSet struct {
	Id        int `gorm:"prymaryKey"`
	UserId    int
	Name      string
	IsPublic  bool
	IsDefault bool

	Cards []Card `gorm:"many2many:set_to_card_link"`
}
