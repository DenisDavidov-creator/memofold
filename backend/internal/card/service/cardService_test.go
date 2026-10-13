package service

import (
	"errors"
	"testing"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/card"
	"dimplom_harmonic/internal/mocks"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newCardSvc(t *testing.T, cardRepo *mocks.MockCardRepo, wordSetRepo *mocks.MockWordSetRepo) *CardService {
	t.Helper()
	db, _ := mocks.NewMockDB(t)
	return NewCardService(cardRepo, wordSetRepo, db)
}

func TestCreateCard_Success(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		CreateCardFn: func(cards []models.Card, userId int) error { return nil },
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	result, err := svc.CreateCard(models.Card{OriginalWord: "hello", Translation: "привет"}, 1)
	require.NoError(t, err)
	assert.Equal(t, "hello", result.OriginalWord)
}

func TestCreateCard_EmptyOriginalWord(t *testing.T) {
	svc := newCardSvc(t, &mocks.MockCardRepo{}, &mocks.MockWordSetRepo{})

	_, err := svc.CreateCard(models.Card{OriginalWord: "", Translation: "привет"}, 1)
	require.Error(t, err)
	assert.Equal(t, "Original word wasn't be empty", err.Error())
}

func TestCreateCard_RepoError(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		CreateCardFn: func(cards []models.Card, userId int) error {
			return errors.New("db error")
		},
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	_, err := svc.CreateCard(models.Card{OriginalWord: "word"}, 1)
	assert.Error(t, err)
}

func TestUpdateCard_Success(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		UpdateCardFn: func(cardId int, changeCard map[string]any) error { return nil },
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	input := models.Card{
		Id:           10,
		OriginalWord: "cat",
		Translation:  "кот",
	}
	result, err := svc.UpdateCard(input)
	require.NoError(t, err)
	assert.Equal(t, 10, result.Id)
	assert.Equal(t, "cat", result.OriginalWord)
	assert.Equal(t, "кот", result.Translation)
}

func TestUpdateCard_RepoError(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		UpdateCardFn: func(cardId int, changeCard map[string]any) error {
			return errors.New("update failed")
		},
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	_, err := svc.UpdateCard(models.Card{Id: 1, OriginalWord: "word"})
	assert.Error(t, err)
}

func TestDeleteCard_FromDeck_CardHasOtherConnections(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		DeleteCardFromDeckFn: func(c *models.Card, deck *models.Deck) error { return nil },
		GetCardByIdFn: func(cardId int) (*models.Card, error) {
			return &models.Card{
				Id:       cardId,
				Decks:    []models.Deck{{Id: 2}},
				WordSets: []models.WordSet{},
			}, nil
		},
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	deckId := 1
	err := svc.DeleteCard(card.DeleteCardParam{Id: 5, DeckId: &deckId})
	assert.NoError(t, err)
}

func TestDeleteCard_FromDeck_CardFullyDeleted(t *testing.T) {
	deleted := false
	cardRepo := &mocks.MockCardRepo{
		DeleteCardFromDeckFn: func(c *models.Card, deck *models.Deck) error { return nil },
		GetCardByIdFn: func(cardId int) (*models.Card, error) {
			return &models.Card{Id: cardId, Decks: []models.Deck{}, WordSets: []models.WordSet{}}, nil
		},
		DeleteCardFn: func(cardId int) error {
			deleted = true
			return nil
		},
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	deckId := 1
	err := svc.DeleteCard(card.DeleteCardParam{Id: 5, DeckId: &deckId})
	require.NoError(t, err)
	assert.True(t, deleted)
}

func TestDeleteCard_FromWordSet(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		DeleteCardFromWordSetFn: func(c *models.Card, ws *models.WordSet) error { return nil },
		GetCardByIdFn: func(cardId int) (*models.Card, error) {
			return &models.Card{Id: cardId, Decks: []models.Deck{{Id: 1}}, WordSets: []models.WordSet{}}, nil
		},
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	wsId := 3
	err := svc.DeleteCard(card.DeleteCardParam{Id: 7, WordSetId: &wsId})
	assert.NoError(t, err)
}

func TestDeleteCard_DeckError(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		DeleteCardFromDeckFn: func(c *models.Card, deck *models.Deck) error {
			return errors.New("delete from deck failed")
		},
	}
	svc := newCardSvc(t, cardRepo, &mocks.MockWordSetRepo{})

	deckId := 1
	err := svc.DeleteCard(card.DeleteCardParam{Id: 5, DeckId: &deckId})
	assert.Error(t, err)
}

func TestCreateHardCards_Success(t *testing.T) {
	wordSetRepo := &mocks.MockWordSetRepo{
		GetDefaultFn: func(userId int) (*models.WordSet, error) {
			return &models.WordSet{Id: 1, UserId: userId, IsDefault: true}, nil
		},
		AddConectionFn: func(ws *models.WordSet, cards []models.Card) error { return nil },
	}
	svc := newCardSvc(t, &mocks.MockCardRepo{}, wordSetRepo)

	err := svc.CreateHardCards(card.CreateHardWordsDTO{CardIds: []int{1, 2, 3}}, 1)
	assert.NoError(t, err)
}

func TestCreateHardCards_NoDefaultWordSet(t *testing.T) {
	wordSetRepo := &mocks.MockWordSetRepo{
		GetDefaultFn: func(userId int) (*models.WordSet, error) {
			return nil, errors.New("default word set not found")
		},
	}
	svc := newCardSvc(t, &mocks.MockCardRepo{}, wordSetRepo)

	err := svc.CreateHardCards(card.CreateHardWordsDTO{CardIds: []int{1}}, 1)
	assert.Error(t, err)
}
