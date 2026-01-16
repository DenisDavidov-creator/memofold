package deck

import (
	models "dimplom_harmonic/domain"
	"time"

	"gorm.io/gorm"
)

type DeckService interface {
	CreateDeck(deck CreateDeckRequestDTO, userId int) (*CreateDeckResponseDTO, error)
	GetDecks(userID int, typeArch bool) ([]GetAllDecksResponseDTO, error)
	GetDeckByID(userID, deckID int) (*models.Deck, error)
	Review(scheduleId int, level int, domainResults []models.CardReveiewResult) (*ResponseReviewResult, error)
	UpdateDeck(userId int, deckId int, input UpdateDeckRequestDTO) (*UpdateDecResposnsekDTO, error)
	RestartProgressDeck(userId, deckId int) error
	DeleteDeck(deckId int, userId int) error
}

type DeckRepository interface {
	CreateDeck(deck *models.Deck, userId int) error
	GetDecks(userID int, typeArch bool) ([]DeckGetAllResult, error)
	GetByID(userID, deckID int) (*models.Deck, error)
	CreateHistory(deckHistory *models.DeckHistory) error
	Update(userId int, deckId int, deck map[string]any) error
	DeleteHistories(deckId int) error
	DeleteDeck(deckId int, userId int) error
	AddConection(deck *models.Deck, cards []models.Card) error
	GetDeckStatsForUser(userId int) (*GetUserStatsResult, error)
	GetCountDeck(userId int, currentDate string) (*int, error)
	WithTx(tx *gorm.DB) DeckRepository
}

type ResponseReviewResult struct {
	Accuracy       int
	Level          int
	NextReviewDate time.Time
}

type DeckHistory struct {
	ReviewDate time.Time
	Accuracy   int
}

type DeckGetAllResult struct {
	models.Deck
	CardsCount int
}

type GetDeckByIDResult struct {
	Id                   int `gorm:"primaryKey"`
	UserId               int `gorm:"column:user_id"`
	Name                 string
	CreatedAt            time.Time `gorm:"column:created_at"`
	CurrentLevel         int       `gorm:"column:current_level"`
	IsArchived           bool      `gorm:"column:is_archived"`
	NextReviewDate       time.Time ` gorm:"column:next_review_date"`
	NextPrimaryDirection bool      `gorm:"column:next_primary_direction"`

	ScheduleId int                 `gorm:"column:schedule_id"`
	Schedule   models.DeckSchedule `gorm:"foreignKey:ScheduleId"`

	Cards []models.Card `gorm:"many2many:deck_cards;"`

	DeckHistories []models.DeckHistory `gorm:"foreignKey:DeckId"`
}

func (GetDeckByIDResult) TableName() string {
	return "decks"
}

type GetUserStatsResult struct {
	ActiveDecks   int
	ArchivedDecks int
	TotalReviews  int
}
