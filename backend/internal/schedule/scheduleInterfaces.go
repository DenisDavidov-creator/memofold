package schedule

import (
	models "dimplom_harmonic/domain"

	"gorm.io/gorm"
)

type ScheduleService interface {
	CreateSchedule(scheduleCreate models.DeckSchedule, levels []models.ScheduleStep) (*models.DeckSchedule, error)
	GetAllSchedules(userId int) ([]models.DeckSchedule, error)
	DeleteSchedule(scheduleId, newscheduleId int) error
	UpdateSchedule(userId, scheduleId int, name string, levels []models.ScheduleStep) (*models.DeckSchedule, error)
}

type ScheduleRepository interface {
	CreateSchedule(schedule *models.DeckSchedule) error
	GetAllSchedules(userId int) ([]models.DeckSchedule, error)
	DeleteSchedule(schedule *models.DeckSchedule, scheduleId int) error
	UpdateScheduleName(scheduleId int, scheduleName map[string]any) error

	CreateScheduleInterval(scheduleSteps []models.ScheduleStep) error
	GetInterval(scheduleId int, level int) (*int, error)
	DeleteScheduleInterval(scheduleId int) error

	GetSchedule(scheduleId int) (*models.DeckSchedule, error)
	UpdateSchedule(scheduleId, newScheduleId int) error

	WithTx(tx *gorm.DB) ScheduleRepository
}

type SchedueleLevels struct {
	Level           int `json:"level"`
	IntervalMinutes int `json:"intervalMinutes"`
}

type DeleteScheduleRequest struct {
	NewScheduleId int `json:"newScheduleId"`
}
