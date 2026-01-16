package models

type Card struct {
	Id                 int
	OriginalWord       string
	Translation        string
	OriginalContext    string
	TranslationContext string
	IsLearning         bool `gorm:"<-:false"`

	Decks    []Deck    `gorm:"many2many:deck_cards"`
	WordSets []WordSet `gorm:"many2many:set_to_card_link"`
}

type CardReveiewResult struct {
	CardId    int
	IsCorrect bool
}
