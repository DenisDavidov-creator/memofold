package repository

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/card"

	"gorm.io/gorm"
)

type CardRepository struct {
	db *gorm.DB
}

func NewCardRepository(db *gorm.DB) *CardRepository {
	return &CardRepository{db: db}
}

func (r *CardRepository) CreateCard(cards []models.Card, userId int) error {
	result := r.db.Create(cards)

	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (r *CardRepository) CreateHistory(history []models.CardHistory) error {
	result := r.db.Create(history)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *CardRepository) GetCardById(cardId int) (*models.Card, error) {
	var card models.Card
	err := r.db.Where("id = ?", cardId).First(&card).Error
	if err != nil {
		return nil, err
	}

	return &card, nil
}

func (r *CardRepository) DeleteCardFromDeck(card *models.Card, deck *models.Deck) error {
	err := r.db.Model(deck).Association("Cards").Delete(card)
	if err != nil {
		return err
	}
	return nil
}

func (r *CardRepository) DeleteCardFromWordSet(card *models.Card, wordSet *models.WordSet) error {
	err := r.db.Debug().Model(wordSet).Association("Cards").Delete(card)
	if err != nil {
		return err
	}
	return nil
}

func (r *CardRepository) DeleteCard(cardId int) error {
	err := r.db.Delete(&models.Card{}, cardId).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *CardRepository) DeleteHistories(userId, deckId int) error {

	subQuery := r.db.Table("deck_cards").
		Select("card_id").
		Where("deck_id = ?", deckId)

	err := r.db.Where("user_id = ?", userId).
		Where("card_id IN (?)", subQuery).
		Delete(&models.CardHistory{}).Error

	if err != nil {
		return err
	}

	return nil
}

func (r *CardRepository) UpdateCard(cardId int, changeCard map[string]any) error {
	return r.db.Model(&models.Card{}).Where("id = ?", cardId).Updates(changeCard).Error
}

func (r *CardRepository) GetUserCardStats(userId int) (*card.GetUserCardStats, error) {
	var res card.GetUserCardStats

	query := `
		SELECT 
			COUNT(CASE WHEN d.is_archived = true then d.id end) as mastered,
			COUNT(CASE WHEN d.is_archived = false then d.id end) as learning
		FROM 
			decks d 
		JOIN 
			deck_cards dc ON dc.deck_id = d.id
		WHERE 
			d.id = dc.deck_id AND d.user_id = ?

	`
	err := r.db.Raw(query, userId).Scan(&res).Error

	if err != nil {
		return nil, err
	}

	return &res, nil
}

func (r *CardRepository) DeleteCardFromDefaultWordSet(wordSetId int, cards []int) error {
	query := `
		DELETE 
		FROM 
			set_to_card_link s
		WHERE 
			s.word_set_id = ? AND s.card_id IN ?
	`
	err := r.db.Exec(query, wordSetId, cards).Error
	if err != nil {
		return err
	}

	return nil
}

func (r *CardRepository) WithTx(tx *gorm.DB) card.CardRepository {
	return &CardRepository{
		db: tx,
	}
}
