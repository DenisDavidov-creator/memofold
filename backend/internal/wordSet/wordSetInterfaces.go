package wordset

import (
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type WordSetService interface {
	CreateWordSet(input *WordSetDTO, userId int) (*models.WordSet, error)
	GetAllWordSet(userId int, typeWS string) ([]WordSetGetResponseDTO, error)
	GetWordSetByID(userId, wordSetId int) (*WordSetGetResponseByIdDTO, error)
	UpdateWordSet(wordSetId int, name string, isPublic bool) (*WordSetResponseUpdate, error)
	DeleteWordSet(userId, wordSetId int) error
	CopyWordSet(wordSetId, userId int) (*models.WordSet, error)
	CreateBatchCards(cards []models.Card, userId int) error
}

type WordSetRepository interface {
	CreateWordSet(*models.WordSet) error
	GetAllWordSet(filter WordSetFilter) ([]WordSetGetResult, error)
	GetWordSetByID(userId, wordSetId int) (*WordSetGetResult, error)
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

type WordSetGetResult struct {
	models.WordSet
	CardsCount int
	UserName   string
}

type WordSetGetResponseByIdDTO struct {
	Id         int           `json:"id"`
	Name       string        `json:"name"`
	IsPublic   bool          `json:"isPublic"`
	CardsCount int           `json:"cardsCount"`
	UserId     int           `json:"userId"`
	IsDefault  bool          `json:"isDefault"`
	UserName   string        `json:"userName"`
	Cards      []models.Card `json:"cards"`
}

type WordSetGetResponseDTO struct {
	Id         int    `json:"id"`
	Name       string `json:"name"`
	IsPublic   bool   `json:"isPublic"`
	CardsCount int    `json:"cardsCount"`
	UserId     int    `json:"userId"`
	IsDefault  bool   `json:"isDefault"`
	UserName   string `json:"userName"`
}

type WordSetFilter struct {
	UserId int
	Type   string
}
