package service

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/card"
	wordset "dimplom_harmonic/internal/wordSet"
	"errors"
	"log"

	"gorm.io/gorm"
)

type CardService struct {
	cardRepo    card.CardRepository
	wordSetRepo wordset.WordSetRepository
	db          *gorm.DB
}

func NewCardService(cardRepo card.CardRepository, wordSetRepo wordset.WordSetRepository, db *gorm.DB) *CardService {
	return &CardService{cardRepo: cardRepo, wordSetRepo: wordSetRepo, db: db}
}

func (s *CardService) CreateCard(input models.Card, userId int) (*models.Card, error) {

	if input.OriginalWord == "" {
		return nil, errors.New("Original word wasn't be empty")
	}

	var cards []models.Card
	cards = append(cards, input)
	if err := s.cardRepo.CreateCard(cards, userId); err != nil {
		return nil, err
	}

	return &input, nil
}

func (s *CardService) DeleteCard(deleteCard card.DeleteCardParam) error {

	delCard := models.Card{Id: deleteCard.Id}

	if deleteCard.DeckId != nil {
		deck := models.Deck{Id: *deleteCard.DeckId}
		err := s.cardRepo.DeleteCardFromDeck(&delCard, &deck)
		if err != nil {
			return err
		}
	} else if deleteCard.WordSetId != nil {
		wordSet := models.WordSet{Id: *deleteCard.WordSetId}
		err := s.cardRepo.DeleteCardFromWordSet(&delCard, &wordSet)
		if err != nil {
			return err
		}
	}

	card, err := s.cardRepo.GetCardById(delCard.Id)
	if err != nil {
		return err
	}

	count := len(card.Decks) + len(card.WordSets)
	log.Println(card)

	if count == 0 {
		err = s.cardRepo.DeleteCard(card.Id)
		if err != nil {
			return err
		}
	}

	if err != nil {
		return err
	}

	return nil
}
func (s *CardService) UpdateCard(input models.Card) (*models.Card, error) {
	var changeCard = make(map[string]any)
	changeCard["OriginalWord"] = input.OriginalWord
	changeCard["Translation"] = input.Translation
	changeCard["OriginalContext"] = input.OriginalContext
	changeCard["TranslationContext"] = input.TranslationContext

	err := s.cardRepo.UpdateCard(input.Id, changeCard)
	if err != nil {
		return nil, err
	}
	changedCard := models.Card{
		Id:                 input.Id,
		OriginalWord:       input.OriginalWord,
		Translation:        input.Translation,
		OriginalContext:    input.OriginalContext,
		TranslationContext: input.TranslationContext,
	}

	return &changedCard, err
}

func (s *CardService) CreateHardCards(cards card.CreateHardWordsDTO, userId int) error {

	wordSet, err := s.wordSetRepo.GetDefault(userId)
	if err != nil {
		return err
	}
	var cardsConnection []models.Card

	for _, value := range cards.CardIds {
		cardConnection := models.Card{
			Id: value,
		}
		cardsConnection = append(cardsConnection, cardConnection)
	}

	err = s.wordSetRepo.AddConection(wordSet, cardsConnection)
	if err != nil {
		return err
	}

	return nil
}
