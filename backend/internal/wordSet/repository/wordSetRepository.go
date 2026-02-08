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

func (r *WordSetRepository) GetAllWordSet(filter wordset.WordSetFilter) ([]wordset.WordSetGetResult, error) {
	var results []wordset.WordSetGetResult

	query := r.db.Model(&models.WordSet{}).
		Select("word_sets.*, COUNT(set_to_card_link.card_id) as cards_count, users.login as user_name").
		Joins("LEFT JOIN set_to_card_link ON set_to_card_link.word_set_id = word_sets.id").
		Joins("LEFT JOIN users ON word_sets.user_id = users.id")

	if filter.Type == "public" {
		query.Where("word_sets.is_public = ? AND word_sets.user_id != ?", true, filter.UserId)
	} else {
		query.Where("word_sets.user_id = ?", filter.UserId)
	}
	err := query.
		Group("word_sets.id, users.id").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	return results, nil
}

func (r *WordSetRepository) GetWordSetByID(userId, wordSetId int) (*wordset.WordSetGetResult, error) {
	// 1. Get the WordSet and User Name
	var wsResult struct {
		models.WordSet
		UserName string `gorm:"column:user_name"`
	}

	err := r.db.Table("word_sets").
		Select("word_sets.*, users.login as user_name").
		Joins("LEFT JOIN users ON word_sets.user_id = users.id").
		Where("word_sets.id = ?", wordSetId).
		Scan(&wsResult).Error

	if err != nil {
		return nil, err
	}

	// 2. Prepare the final result
	result := &wordset.WordSetGetResult{
		UserName: wsResult.UserName,
		WordSet:  wsResult.WordSet,
	}

	// 3. Fetch Cards directly into the model slice
	// Since models.Card now has IsLearning `gorm:"<-:false"`,
	// GORM will map the column "is_learning" automatically.
	cards := make([]models.Card, 0)

	err = r.db.Table("cards").
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
		Scan(&cards).Error // Direct Scan! No temporary struct needed.

	if err != nil {
		return nil, err
	}

	result.WordSet.Cards = cards

	return result, nil
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
