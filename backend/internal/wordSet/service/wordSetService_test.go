package service

import (
	"errors"
	"testing"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/mocks"
	wordset "dimplom_harmonic/internal/wordSet"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newWordSetSvc(t *testing.T, wsRepo *mocks.MockWordSetRepo, cardRepo *mocks.MockCardRepo) *WordSetService {
	t.Helper()
	db, _ := mocks.NewMockDB(t)
	return NewWordSetService(wsRepo, cardRepo, db)
}

func TestCreateWordSet_Success(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		CreateWordSetFn: func(ws *models.WordSet) error {
			ws.Id = 10
			return nil
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	input := &wordset.WordSetDTO{Name: "Travel Vocab", IsPublic: true}
	result, err := svc.CreateWordSet(input, 1)
	require.NoError(t, err)
	assert.Equal(t, "Travel Vocab", result.Name)
	assert.Equal(t, 1, result.UserId)
	assert.True(t, result.IsPublic)
}

func TestCreateWordSet_RepoError(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		CreateWordSetFn: func(ws *models.WordSet) error {
			return errors.New("db error")
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	_, err := svc.CreateWordSet(&wordset.WordSetDTO{Name: "Fail"}, 1)
	assert.Error(t, err)
}

func TestGetAllWordSet_Success(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		GetAllWordSetFn: func(filter wordset.WordSetFilter) ([]wordset.WordSetGetResult, error) {
			return []wordset.WordSetGetResult{
				{WordSet: models.WordSet{Id: 1, Name: "Set1"}, CardsCount: 5},
				{WordSet: models.WordSet{Id: 2, Name: "Set2"}, CardsCount: 3},
			}, nil
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	result, err := svc.GetAllWordSet(1, "my")
	require.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "Set1", result[0].Name)
	assert.Equal(t, 5, result[0].CardsCount)
}

func TestGetAllWordSet_Error(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		GetAllWordSetFn: func(filter wordset.WordSetFilter) ([]wordset.WordSetGetResult, error) {
			return nil, errors.New("db error")
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	_, err := svc.GetAllWordSet(1, "my")
	assert.Error(t, err)
}

func TestGetWordSetByID_Success(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		GetWordSetByIDFn: func(userId, wordSetId int) (*wordset.WordSetGetResult, error) {
			return &wordset.WordSetGetResult{
				WordSet: models.WordSet{
					Id:     wordSetId,
					Name:   "My Set",
					UserId: userId,
					Cards:  []models.Card{{Id: 1, OriginalWord: "hello"}},
				},
				UserName: "testuser",
			}, nil
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	result, err := svc.GetWordSetByID(1, 5)
	require.NoError(t, err)
	assert.Equal(t, 5, result.Id)
	assert.Equal(t, "My Set", result.Name)
	assert.Equal(t, 1, result.CardsCount)
	assert.Equal(t, "testuser", result.UserName)
}

func TestUpdateWordSet_Success(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		UpdateWordSetFn: func(wordSetId int, changeWordSet map[string]any) error { return nil },
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	result, err := svc.UpdateWordSet(5, "Updated Set", true)
	require.NoError(t, err)
	assert.Equal(t, 5, result.Id)
	assert.Equal(t, "Updated Set", result.Name)
	assert.True(t, result.IsPublic)
}

func TestUpdateWordSet_Error(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		UpdateWordSetFn: func(wordSetId int, changeWordSet map[string]any) error {
			return errors.New("update error")
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	_, err := svc.UpdateWordSet(5, "Fail", false)
	assert.Error(t, err)
}

func TestDeleteWordSet_DefaultSet_Error(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		GetWordSetByIDFn: func(userId, wordSetId int) (*wordset.WordSetGetResult, error) {
			return &wordset.WordSetGetResult{
				WordSet: models.WordSet{Id: wordSetId, IsDefault: true},
			}, nil
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	err := svc.DeleteWordSet(1, 5)
	require.Error(t, err)
	assert.Equal(t, "You can't delete default word set", err.Error())
}

func TestDeleteWordSet_Success(t *testing.T) {
	deleted := false
	wsRepo := &mocks.MockWordSetRepo{
		GetWordSetByIDFn: func(userId, wordSetId int) (*wordset.WordSetGetResult, error) {
			return &wordset.WordSetGetResult{
				WordSet: models.WordSet{Id: wordSetId, IsDefault: false},
			}, nil
		},
		DeleteWordSetFn: func(wordSetId int) error {
			deleted = true
			return nil
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	err := svc.DeleteWordSet(1, 5)
	require.NoError(t, err)
	assert.True(t, deleted)
}

func TestCopyWordSet_Success(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	wsRepo := &mocks.MockWordSetRepo{
		GetWordSetByIDFn: func(userId, wordSetId int) (*wordset.WordSetGetResult, error) {
			return &wordset.WordSetGetResult{
				WordSet: models.WordSet{
					Id:     wordSetId,
					Name:   "Original Set",
					UserId: 99,
					Cards: []models.Card{
						{Id: 1, OriginalWord: "cat", Translation: "кот"},
					},
				},
			}, nil
		},
	}
	cardRepo := &mocks.MockCardRepo{}
	svc := NewWordSetService(wsRepo, cardRepo, db)

	result, err := svc.CopyWordSet(5, 1)
	require.NoError(t, err)
	assert.Equal(t, "Original Set", result.Name)
	assert.Equal(t, 1, result.UserId)
	assert.False(t, result.IsPublic)
}

func TestCopyWordSet_GetError(t *testing.T) {
	wsRepo := &mocks.MockWordSetRepo{
		GetWordSetByIDFn: func(userId, wordSetId int) (*wordset.WordSetGetResult, error) {
			return nil, errors.New("not found")
		},
	}
	svc := newWordSetSvc(t, wsRepo, &mocks.MockCardRepo{})

	_, err := svc.CopyWordSet(5, 1)
	assert.Error(t, err)
}

func TestCreateBatchCards_Success(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		CreateCardFn: func(cards []models.Card, userId int) error { return nil },
	}
	svc := newWordSetSvc(t, &mocks.MockWordSetRepo{}, cardRepo)

	cards := []models.Card{
		{OriginalWord: "dog", Translation: "собака"},
		{OriginalWord: "cat", Translation: "кот"},
	}
	err := svc.CreateBatchCards(cards, 1)
	assert.NoError(t, err)
}

func TestCreateBatchCards_Error(t *testing.T) {
	cardRepo := &mocks.MockCardRepo{
		CreateCardFn: func(cards []models.Card, userId int) error {
			return errors.New("batch insert failed")
		},
	}
	svc := newWordSetSvc(t, &mocks.MockWordSetRepo{}, cardRepo)

	err := svc.CreateBatchCards([]models.Card{{OriginalWord: "word"}}, 1)
	assert.Error(t, err)
}
