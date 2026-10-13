package mocks

import (
	"dimplom_harmonic/internal/schedule"
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type MockScheduleRepo struct {
	CreateScheduleFn        func(s *models.DeckSchedule) error
	GetAllSchedulesFn       func(userId int) ([]models.DeckSchedule, error)
	DeleteScheduleFn        func(s *models.DeckSchedule, scheduleId int) error
	UpdateScheduleNameFn    func(scheduleId int, scheduleName map[string]any) error
	CreateScheduleIntervalFn func(scheduleSteps []models.ScheduleStep) error
	GetIntervalFn           func(scheduleId int, level int) (*int, error)
	DeleteScheduleIntervalFn func(scheduleId int) error
	GetScheduleFn           func(scheduleId int) (*models.DeckSchedule, error)
	UpdateScheduleFn        func(scheduleId, newScheduleId int) error
	WithTxFn                func(tx *gorm.DB) schedule.ScheduleRepository
}

func (m *MockScheduleRepo) CreateSchedule(s *models.DeckSchedule) error {
	if m.CreateScheduleFn != nil {
		return m.CreateScheduleFn(s)
	}
	return nil
}

func (m *MockScheduleRepo) GetAllSchedules(userId int) ([]models.DeckSchedule, error) {
	if m.GetAllSchedulesFn != nil {
		return m.GetAllSchedulesFn(userId)
	}
	return nil, nil
}

func (m *MockScheduleRepo) DeleteSchedule(s *models.DeckSchedule, scheduleId int) error {
	if m.DeleteScheduleFn != nil {
		return m.DeleteScheduleFn(s, scheduleId)
	}
	return nil
}

func (m *MockScheduleRepo) UpdateScheduleName(scheduleId int, scheduleName map[string]any) error {
	if m.UpdateScheduleNameFn != nil {
		return m.UpdateScheduleNameFn(scheduleId, scheduleName)
	}
	return nil
}

func (m *MockScheduleRepo) CreateScheduleInterval(scheduleSteps []models.ScheduleStep) error {
	if m.CreateScheduleIntervalFn != nil {
		return m.CreateScheduleIntervalFn(scheduleSteps)
	}
	return nil
}

func (m *MockScheduleRepo) GetInterval(scheduleId int, level int) (*int, error) {
	if m.GetIntervalFn != nil {
		return m.GetIntervalFn(scheduleId, level)
	}
	zero := 0
	return &zero, nil
}

func (m *MockScheduleRepo) DeleteScheduleInterval(scheduleId int) error {
	if m.DeleteScheduleIntervalFn != nil {
		return m.DeleteScheduleIntervalFn(scheduleId)
	}
	return nil
}

func (m *MockScheduleRepo) GetSchedule(scheduleId int) (*models.DeckSchedule, error) {
	if m.GetScheduleFn != nil {
		return m.GetScheduleFn(scheduleId)
	}
	return &models.DeckSchedule{Id: scheduleId}, nil
}

func (m *MockScheduleRepo) UpdateSchedule(scheduleId, newScheduleId int) error {
	if m.UpdateScheduleFn != nil {
		return m.UpdateScheduleFn(scheduleId, newScheduleId)
	}
	return nil
}

func (m *MockScheduleRepo) WithTx(tx *gorm.DB) schedule.ScheduleRepository {
	if m.WithTxFn != nil {
		return m.WithTxFn(tx)
	}
	return m
}
