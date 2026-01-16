package service

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/auth"
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/deck"
	"dimplom_harmonic/internal/schedule"
	wordset "dimplom_harmonic/internal/wordSet"
	"errors"
	"sort"
	"time"

	"gorm.io/gorm"
)

type DeckService struct {
	deckRepo     deck.DeckRepository
	scheduleRepo schedule.ScheduleRepository
	cardRepo     card.CardRepository
	userRepo     auth.UserRepository
	wordSetRepo  wordset.WordSetRepository
	db           *gorm.DB
}

func NewDeckService(deckRepo deck.DeckRepository, scheduleRepo schedule.ScheduleRepository, cardRepo card.CardRepository, userRepo auth.UserRepository, wordSetRepo wordset.WordSetRepository, db *gorm.DB) deck.DeckService {
	return &DeckService{
		deckRepo:     deckRepo,
		scheduleRepo: scheduleRepo,
		cardRepo:     cardRepo,
		userRepo:     userRepo,
		wordSetRepo:  wordSetRepo,
		db:           db,
	}
}

func (s *DeckService) CreateDeck(input deck.CreateDeckRequestDTO, userId int) (*deck.CreateDeckResponseDTO, error) {

	user, err := s.userRepo.GetByID(userId)
	if err != nil {
		return nil, err
	}

	var isPremium bool
	if user.PremiumExpiresAt.After(time.Now()) {
		isPremium = true
	} else {
		isPremium = false
	}

	if isPremium == false {

		if len(input.ExistingCardIds)+len(input.NewCards) > 7 {
			return nil, errors.New("free_limit_words_exceeded")
		}

		currentData := time.Now().Format("2006-01-02")
		countDecks, err := s.deckRepo.GetCountDeck(userId, currentData)

		if err != nil {
			return nil, err
		}

		if *countDecks >= 1 {
			return nil, errors.New("free_limit_decks_exceeded")
		}
	}
	newDeck := &models.Deck{
		UserId:               userId,
		Name:                 input.Name,
		CreatedAt:            time.Now(),
		CurrentLevel:         0,
		NextReviewDate:       input.NextReviewDate,
		NextPrimaryDirection: true,
		ScheduleId:           input.ScheduleId,
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {

		txDeckRepo := s.deckRepo.WithTx(tx)
		txCardRepo := s.cardRepo.WithTx(tx)
		txWordSetRepo := s.wordSetRepo.WithTx(tx)

		if err := txDeckRepo.CreateDeck(newDeck, userId); err != nil {
			return err
		}
		var cards []models.Card
		for _, value := range input.NewCards {
			card := models.Card{
				OriginalWord:       value.OriginalWord,
				Translation:        value.Translation,
				OriginalContext:    value.OriginalContext,
				TranslationContext: value.TranslationContext,
			}
			card.Decks = []models.Deck{{Id: newDeck.Id}}
			cards = append(cards, card)
		}

		if len(cards) != 0 {
			err := txCardRepo.CreateCard(cards, userId)
			if err != nil {
				return err
			}
			newDeck.Cards = cards
		}
		var cardsToLink []models.Card

		for _, value := range input.ExistingCardIds {
			cardsToLink = append(cardsToLink, models.Card{Id: value})
		}

		if len(cardsToLink) != 0 {
			err := txDeckRepo.AddConection(newDeck, cardsToLink)
			if err != nil {
				return err
			}

			defaultWordSet, err := txWordSetRepo.GetDefault(userId)
			if err != nil {
				return err
			}

			txCardRepo.DeleteCardFromDefaultWordSet(defaultWordSet.Id, input.ExistingCardIds)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	responseDeck := deck.CreateDeckResponseDTO{
		Name:           newDeck.Name,
		NextReviewDate: newDeck.NextReviewDate,
		ScheduleId:     newDeck.ScheduleId,
	}

	return &responseDeck, nil
}

func (s *DeckService) GetDecks(userId int, typeArch bool) ([]deck.GetAllDecksResponseDTO, error) {

	decks, err := s.deckRepo.GetDecks(userId, typeArch)
	var requestDecks []deck.GetAllDecksResponseDTO

	for _, value := range decks {
		requestDeck := deck.GetAllDecksResponseDTO{
			Id:             value.Id,
			Name:           value.Name,
			CurrentLevel:   value.CurrentLevel,
			NextReviewDate: value.NextReviewDate,
			CardsCount:     value.CardsCount,
			IsArchived:     value.IsArchived,
		}

		requestDecks = append(requestDecks, requestDeck)
	}

	if err != nil {
		return nil, err
	}
	return requestDecks, nil
}

func (s *DeckService) GetDeckByID(userId, deckId int) (*models.Deck, error) {
	deckG, err := s.deckRepo.GetByID(userId, deckId)

	var deckHistories []models.DeckHistory
	for _, value := range deckG.DeckHistories {
		history := models.DeckHistory{
			ReviewDate: value.ReviewDate,
			Accuracy:   value.Accuracy,
		}
		deckHistories = append(deckHistories, history)
	}

	deckG.DeckHistories = deckHistories
	if err != nil {
		return nil, err
	}

	return deckG, nil
}

func (s *DeckService) Review(userId int, deckId int, results []models.CardReveiewResult) (*deck.ResponseReviewResult, error) {

	dataDeck, err := s.deckRepo.GetByID(userId, deckId)
	if err != nil {
		return nil, err
	}

	changeDeck := make(map[string]any)

	var countCorrect int
	var historyBatch []models.CardHistory

	for _, value := range results {
		if value.IsCorrect == true {
			countCorrect++
		}

		cardHistory := models.CardHistory{
			UserId:     userId,
			DeckId:     deckId,
			CardId:     value.CardId,
			ReviewDate: time.Now(),
			IsCorrect:  value.IsCorrect,
		}
		historyBatch = append(historyBatch, cardHistory)
	}

	successRate := 100 * (float64(countCorrect) / float64(len(results)))

	deckHistory := models.DeckHistory{
		DeckId:     deckId,
		ReviewDate: time.Now(),
		Accuracy:   int(successRate),
	}

	interval, err := s.scheduleRepo.GetSchedule(dataDeck.ScheduleId)
	if err != nil {
		return nil, err
	}

	steps := interval.ScheduleSteps
	sort.Slice(steps, func(i, j int) bool {
		return steps[i].Level < steps[j].Level
	})

	var currentStep *models.ScheduleStep
	for _, s := range steps {
		if s.Level == dataDeck.CurrentLevel {
			currentStep = &s
			break
		}
	}

	responceData := deck.ResponseReviewResult{
		Accuracy: int(successRate),
	}

	if currentStep != nil {

		nextReviewDate := time.Now().Add(time.Duration(currentStep.IntervalMinutes) * time.Minute)
		newCurrentStep := currentStep.Level + 1

		changeDeck["NextReviewDate"] = nextReviewDate
		changeDeck["CurrentLevel"] = newCurrentStep
		responceData.Level = newCurrentStep
		responceData.NextReviewDate = nextReviewDate
	} else {
		changeDeck["IsArchived"] = true
		responceData.Level = dataDeck.CurrentLevel
		responceData.NextReviewDate = time.Now().AddDate(1000, 0, 0)
	}

	if successRate >= 65 {
		changeDeck["NextPrimaryDirection"] = !dataDeck.NextPrimaryDirection
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {
		err = s.cardRepo.CreateHistory(historyBatch)
		if err != nil {
			return err
		}

		err = s.deckRepo.CreateHistory(&deckHistory)
		if err != nil {
			return err
		}

		err = s.deckRepo.Update(userId, deckId, changeDeck)
		if err != nil {
			return err
		}
		return nil
	})

	return &responceData, nil
}

func (s *DeckService) UpdateDeck(userId int, deckId int, input deck.UpdateDeckRequestDTO) (*deck.UpdateDecResposnsekDTO, error) {
	changeDeck := make(map[string]any, 4)

	changeDeck["Name"] = input.Name
	changeDeck["NextReviewDate"] = input.NextReviewDate
	changeDeck["ScheduleId"] = input.ScheduleId

	err := s.deckRepo.Update(userId, deckId, changeDeck)
	if err != nil {
		return nil, err
	}

	var updatedDeck = deck.UpdateDecResposnsekDTO{
		Name:           input.Name,
		ScheduleId:     input.ScheduleId,
		NextReviewDate: input.NextReviewDate,
	}

	return &updatedDeck, nil
}

func (s *DeckService) RestartProgressDeck(userId, deckId int) error {

	return s.db.Transaction(func(tx *gorm.DB) error {

		txCardRepo := s.cardRepo.WithTx(tx)
		txDeckRepo := s.deckRepo.WithTx(tx)

		err := txCardRepo.DeleteHistories(userId, deckId)
		if err != nil {
			return err
		}

		err = txDeckRepo.DeleteHistories(deckId)
		if err != nil {
			return err
		}

		changeDeck := make(map[string]any)
		changeDeck["CurrentLevel"] = 0
		changeDeck["NextReviewDate"] = time.Now()
		changeDeck["is_archived"] = false

		err = txDeckRepo.Update(userId, deckId, changeDeck)
		if err != nil {
			return err
		}

		return nil
	})
}

func (s *DeckService) DeleteDeck(deckId int, userId int) error {
	err := s.deckRepo.DeleteDeck(deckId, userId)
	if err != nil {
		return err
	}
	return nil
}
