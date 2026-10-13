package mocks

import (
	wordset "dimplom_harmonic/internal/wordSet"
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type MockWordSetRepo struct {
	CreateWordSetFn  func(ws *models.WordSet) error
	GetAllWordSetFn  func(filter wordset.WordSetFilter) ([]wordset.WordSetGetResult, error)
	GetWordSetByIDFn func(userId, wordSetId int) (*wordset.WordSetGetResult, error)
	UpdateWordSetFn  func(wordSetId int, changeWordSet map[string]any) error
	DeleteWordSetFn  func(wordSetId int) error
	AddConectionFn   func(wordSet *models.WordSet, cards []models.Card) error
	GetDefaultFn     func(userId int) (*models.WordSet, error)
	WithTxFn         func(tx *gorm.DB) wordset.WordSetRepository
}

func (m *MockWordSetRepo) CreateWordSet(ws *models.WordSet) error {
	if m.CreateWordSetFn != nil {
		return m.CreateWordSetFn(ws)
	}
	return nil
}

func (m *MockWordSetRepo) GetAllWordSet(filter wordset.WordSetFilter) ([]wordset.WordSetGetResult, error) {
	if m.GetAllWordSetFn != nil {
		return m.GetAllWordSetFn(filter)
	}
	return nil, nil
}

func (m *MockWordSetRepo) GetWordSetByID(userId, wordSetId int) (*wordset.WordSetGetResult, error) {
	if m.GetWordSetByIDFn != nil {
		return m.GetWordSetByIDFn(userId, wordSetId)
	}
	return &wordset.WordSetGetResult{WordSet: models.WordSet{Id: wordSetId, UserId: userId}}, nil
}

func (m *MockWordSetRepo) UpdateWordSet(wordSetId int, changeWordSet map[string]any) error {
	if m.UpdateWordSetFn != nil {
		return m.UpdateWordSetFn(wordSetId, changeWordSet)
	}
	return nil
}

func (m *MockWordSetRepo) DeleteWordSet(wordSetId int) error {
	if m.DeleteWordSetFn != nil {
		return m.DeleteWordSetFn(wordSetId)
	}
	return nil
}

func (m *MockWordSetRepo) AddConection(wordSet *models.WordSet, cards []models.Card) error {
	if m.AddConectionFn != nil {
		return m.AddConectionFn(wordSet, cards)
	}
	return nil
}

func (m *MockWordSetRepo) GetDefault(userId int) (*models.WordSet, error) {
	if m.GetDefaultFn != nil {
		return m.GetDefaultFn(userId)
	}
	return &models.WordSet{Id: 1, UserId: userId, IsDefault: true}, nil
}

func (m *MockWordSetRepo) WithTx(tx *gorm.DB) wordset.WordSetRepository {
	if m.WithTxFn != nil {
		return m.WithTxFn(tx)
	}
	return m
}
