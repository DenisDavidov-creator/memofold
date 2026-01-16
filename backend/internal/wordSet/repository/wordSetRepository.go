package repository

import (
	models "dimplom_harmonic/domain"
	wordset "dimplom_harmonic/internal/wordSet"

	"gorm.io/gorm"
)

type WordSetRepository struct {
	db *gorm.DB
}

func NewWordSetRepository(db *gorm.DB) *WordSetRepository {
	return &WordSetRepository{db: db}
}

func (r *WordSetRepository) CreateWordSet(wordSet *models.WordSet) error {
	result := r.db.Create(wordSet)

	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *WordSetRepository) GetAllWordSet(filter wordset.WordSetFilter) ([]wordset.WordSetGetAllResult, error) {
	var results []wordset.WordSetGetAllResult

	query := r.db.Model(&models.WordSet{}).
		Select("word_sets.*, COUNT(set_to_card_link.card_id) as cards_count").
		Joins("LEFT JOIN set_to_card_link ON set_to_card_link.word_set_id = word_sets.id")

	if filter.Type == "public" {
		query.Where("word_sets.is_public = ? AND word_sets.user_id != ?", true, filter.UserId)
	} else {
		query.Where("word_sets.user_id = ?", filter.UserId)
	}
	err := query.
		Group("word_sets.id").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	return results, nil
}

func (r *WordSetRepository) GetWordSetByID(userId, wordSetId int) (*models.WordSet, error) {
	var wordSet models.WordSet

	if err := r.db.First(&wordSet, wordSetId).Error; err != nil {
		return nil, err
	}

	cards := make([]models.Card, 0)

	err := r.db.Table("cards").
		// Добавил запятую после cards.* и исправил cards.id
		Select(`
            cards.*, 
            EXISTS (
                SELECT 1 FROM deck_cards dc 
                JOIN decks d ON d.id = dc.deck_id 
                WHERE dc.card_id = cards.id 
                AND d.user_id = ? 
            ) as is_learning
        `, userId).
		Joins("JOIN set_to_card_link link ON link.card_id = cards.id").
		Where("link.word_set_id = ?", wordSetId).
		Scan(&cards).Error // Используем Scan, чтобы GORM замапил результаты в структуру
	if err != nil {
		return nil, err
	}

	wordSet.Cards = cards

	return &wordSet, nil
}

func (r *WordSetRepository) UpdateWordSet(wordSetId int, changeWordSet map[string]any) error {
	err := r.db.Model(&models.WordSet{}).Where("id = ? AND is_default = FALSE", wordSetId).Updates(changeWordSet).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *WordSetRepository) DeleteWordSet(wordSetId int) error {
	err := r.db.Delete(&models.WordSet{}, wordSetId).Error

	if err != nil {
		return err
	}
	return nil
}

func (r *WordSetRepository) AddConection(wordSet *models.WordSet, cards []models.Card) error {
	return r.db.Model(wordSet).Association("Cards").Append(cards)
}

func (r *WordSetRepository) GetDefault(userId int) (*models.WordSet, error) {
	var getWordSet models.WordSet

	query := `
		SELECT *
		FROM word_sets w 
		WHERE w.user_id = ? AND is_default = TRUE
	`

	err := r.db.Raw(query, userId).Scan(&getWordSet).Error

	if err != nil {
		return nil, err
	}
	return &getWordSet, nil
}

func (r *WordSetRepository) WithTx(tx *gorm.DB) wordset.WordSetRepository {
	return &WordSetRepository{
		db: tx,
	}
}
