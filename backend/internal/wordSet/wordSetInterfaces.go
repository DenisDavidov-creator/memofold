package wordset

import (
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type WordSetService interface {
	CreateWordSet(input *WordSetDTO, userId int) (*models.WordSet, error)
	GetAllWordSet(userId int, typeWS string) ([]WordSetGetAllResponseDTO, error)
	GetWordSetByID(userId, wordSetId int) (*models.WordSet, error)
	UpdateWordSet(wordSetId int, name string, isPublic bool) (*WordSetResponseUpdate, error)
	DeleteWordSet(userId, wordSetId int) error
	CopyWordSet(wordSetId, userId int) (*models.WordSet, error)
	CreateBatchCards(cards []models.Card, userId int) error
}

type WordSetRepository interface {
	CreateWordSet(*models.WordSet) error
	GetAllWordSet(filter WordSetFilter) ([]WordSetGetAllResult, error)
	GetWordSetByID(userId, wordSetId int) (*models.WordSet, error)
	UpdateWordSet(wordSetId int, changeWordSet map[string]any) error
	DeleteWordSet(wordSetId int) error
	AddConection(wordSet *models.WordSet, cards []models.Card) error
	GetDefault(userId int) (*models.WordSet, error)
	WithTx(tx *gorm.DB) WordSetRepository
}

type WordSetResponseUpdate struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	IsPublic bool   `json:"isPublic"`
}

type WordSetGetAllResult struct {
	models.WordSet
	CardsCount int `json:"cardsCount"`
}

type WordSetGetAllResponseDTO struct {
	Id         int    `json:"id"`
	Name       string `json:"name"`
	IsPublic   bool   `json:"isPublic"`
	CardsCount int    `json:"cardsCount"`
	UserId     int    `json:"userId"`
	IsDefault  bool   `json:"isDefault"`
}

type WordSetFilter struct {
	UserId int
	Type   string
}
