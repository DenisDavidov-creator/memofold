package service

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/card"
	wordset "dimplom_harmonic/internal/wordSet"
	"errors"

	"gorm.io/gorm"
)

type WordSetService struct {
	wordSetRepo wordset.WordSetRepository
	cardRepo    card.CardRepository
	db          *gorm.DB
}

func NewWordSetService(wordSetRepo wordset.WordSetRepository, cardRepo card.CardRepository, db *gorm.DB) *WordSetService {
	return &WordSetService{
		wordSetRepo: wordSetRepo,
		cardRepo:    cardRepo,
		db:          db,
	}
}

func (s *WordSetService) CreateWordSet(input *wordset.WordSetDTO, userId int) (*models.WordSet, error) {

	newWordSet := &models.WordSet{
		UserId:   userId,
		Name:     input.Name,
		IsPublic: input.IsPublic,
	}
	if err := s.wordSetRepo.CreateWordSet(newWordSet); err != nil {
		return nil, err
	}

	return newWordSet, nil
}

func (s *WordSetService) GetAllWordSet(userId int, typeWS string) ([]wordset.WordSetGetAllResponseDTO, error) {

	filter := wordset.WordSetFilter{
		UserId: userId,
		Type:   typeWS,
	}

	wordSets, err := s.wordSetRepo.GetAllWordSet(filter)

	var wordSetsResponse []wordset.WordSetGetAllResponseDTO
	for _, value := range wordSets {
		wordSet := wordset.WordSetGetAllResponseDTO{
			Id:         value.Id,
			Name:       value.Name,
			IsPublic:   value.IsPublic,
			CardsCount: value.CardsCount,
			UserId:     value.UserId,
			IsDefault:  value.IsDefault,
		}
		wordSetsResponse = append(wordSetsResponse, wordSet)
	}
	if err != nil {
		return nil, err
	}

	return wordSetsResponse, nil
}
func (s *WordSetService) GetWordSetByID(userId, wordSetId int) (*models.WordSet, error) {

	wordSet, err := s.wordSetRepo.GetWordSetByID(userId, wordSetId)

	if err != nil {
		return nil, err
	}

	return wordSet, nil
}

func (s *WordSetService) UpdateWordSet(wordSetId int, name string, isPublic bool) (*wordset.WordSetResponseUpdate, error) {
	changeWordSet := make(map[string]any)
	changeWordSet["Name"] = name
	changeWordSet["IsPublic"] = isPublic

	err := s.wordSetRepo.UpdateWordSet(wordSetId, changeWordSet)
	if err != nil {
		return nil, err
	}
	wordSetUpdated := wordset.WordSetResponseUpdate{
		Id:       wordSetId,
		Name:     name,
		IsPublic: isPublic,
	}

	return &wordSetUpdated, nil
}

func (s *WordSetService) DeleteWordSet(userId, wordSetId int) error {

	set, err := s.wordSetRepo.GetWordSetByID(userId, wordSetId)
	if err != nil {
		return err
	}
	if set.IsDefault == true {
		return errors.New("You can't delete default word set")
	}

	err = s.wordSetRepo.DeleteWordSet(wordSetId)
	if err != nil {
		return err
	}
	return nil
}

func (s *WordSetService) CopyWordSet(wordSetId, userId int) (*models.WordSet, error) {

	copyWS, err := s.wordSetRepo.GetWordSetByID(userId, wordSetId)
	if err != nil {
		return nil, err
	}

	newWordSet := models.WordSet{
		UserId:   userId,
		Name:     copyWS.Name,
		IsPublic: false,
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {

		txWordSetRepo := s.wordSetRepo.WithTx(tx)
		txCardRepo := s.cardRepo.WithTx(tx)

		err = txWordSetRepo.CreateWordSet(&newWordSet)

		if err != nil {
			return err
		}
		var newCards []models.Card
		for _, value := range copyWS.Cards {
			copyCard := models.Card{
				OriginalWord:       value.OriginalWord,
				Translation:        value.Translation,
				OriginalContext:    value.OriginalContext,
				TranslationContext: value.TranslationContext,
			}
			newCards = append(newCards, copyCard)
		}
		err = txCardRepo.CreateCard(newCards, userId)
		if err != nil {
			return err
		}

		err = txWordSetRepo.AddConection(&newWordSet, newCards)
		if err != nil {
			return err
		}

		return nil
	})

	return &newWordSet, nil
}

func (s *WordSetService) CreateBatchCards(cards []models.Card, userId int) error {
	err := s.cardRepo.CreateCard(cards, userId)
	if err != nil {
		return err
	}
	return nil
}
