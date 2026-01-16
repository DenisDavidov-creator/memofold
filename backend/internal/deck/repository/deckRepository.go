package repository

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/deck"

	"gorm.io/gorm"
)

type DeckRepository struct {
	db *gorm.DB
}

func NewDeckRepository(db *gorm.DB) *DeckRepository {
	return &DeckRepository{db: db}
}

func (r *DeckRepository) WithTx(tx *gorm.DB) deck.DeckRepository {
	return &DeckRepository{
		db: tx,
	}
}

func (r *DeckRepository) CreateDeck(deck *models.Deck, userId int) error {
	result := r.db.Where("user_id = ?", userId).Create(deck)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *DeckRepository) GetDecks(userId int, typeArch bool) ([]deck.DeckGetAllResult, error) {
	var decks []deck.DeckGetAllResult

	err := r.db.Model(&models.Deck{}).
		Select("decks.*, COUNT(deck_cards.card_id) as cards_count").
		Joins("LEFT JOIN deck_cards ON deck_cards.deck_id = decks.id").
		Where("decks.user_id = ?", userId).
		Where("is_archived = ?", typeArch).
		Group("decks.id").
		Scan(&decks).Error

	if err != nil {
		return nil, err
	}

	return decks, nil
}

func (r *DeckRepository) GetByID(userId, deckId int) (*models.Deck, error) {
	var deck models.Deck
	result := r.db.Preload("Cards").Preload("DeckHistories").Where("user_id = ? AND id = ?", userId, deckId).First(&deck)
	if result.Error != nil {
		return nil, result.Error
	}

	return &deck, nil
}

func (r *DeckRepository) CreateHistory(deckHistory *models.DeckHistory) error {
	result := r.db.Create(deckHistory)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *DeckRepository) Update(userId int, deckId int, deck map[string]any) error {
	err := r.db.Model(&models.Deck{}).Where("id = ? AND user_id = ?", deckId, userId).Updates(deck).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *DeckRepository) DeleteHistories(deckId int) error {
	err := r.db.Where("deck_id = ?", deckId).Delete(&models.DeckHistory{}).Error
	if err != nil {
		return err
	}

	return nil
}

func (r *DeckRepository) DeleteDeck(deckId int, userId int) error {
	return r.db.Where("user_id = ?", userId).Delete(&models.Deck{}, deckId).Error
}

func (r *DeckRepository) AddConection(deck *models.Deck, cards []models.Card) error {
	return r.db.Model(deck).Association("Cards").Append(cards)
}

func (r *DeckRepository) GetDeckStatsForUser(userId int) (*deck.GetUserStatsResult, error) {
	var res deck.GetUserStatsResult

	query := `
		SELECT 
			COUNT(DISTINCT CASE WHEN d.is_archived = false THEN 1 END) as active_decks,
			COUNT(DISTINCT CASE WHEN d.is_archived = true THEN 1 END) as archived_decks,
			(SELECT COUNT(*) FROM deck_histories dh JOIN decks d2 ON d2.id = dh.deck_id WHERE d2.user_id = ?) as total_reviews
		FROM 
			decks d 
		WHERE 
			user_id = ?
	`

	err := r.db.Raw(query, userId, userId).Scan(&res).Error

	if err != nil {
		return nil, err
	}

	return &res, nil
}

func (r *DeckRepository) GetCountDeck(userId int, currentDate string) (*int, error) {

	var countDeck int

	query := `
		SELECT 
			COUNT(*)
		FROM 
			decks d
		WHERE 
			d.created_at >= ? 
			AND
			d.user_id = ?
	`

	r.db.Raw(query, currentDate, userId).Scan(&countDeck)
	return &countDeck, nil
}
