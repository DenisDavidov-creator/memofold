package repository

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/schedule"

	"gorm.io/gorm"
)

type ScheduleRepository struct {
	db *gorm.DB
}

func NewScheduleRepository(db *gorm.DB) *ScheduleRepository {
	return &ScheduleRepository{db: db}
}

func (r *ScheduleRepository) WithTx(tx *gorm.DB) schedule.ScheduleRepository {
	return &ScheduleRepository{
		db: tx,
	}
}

func (r *ScheduleRepository) GetInterval(scheduleId int, level int) (*int, error) {
	var interval models.ScheduleStep

	result := r.db.Where("deck_schedule_id = ? AND level = ?", scheduleId, level).First(&interval)

	if result.Error != nil {
		return nil, result.Error
	}
	return &interval.IntervalMinutes, nil
}

func (r *ScheduleRepository) CreateSchedule(schedule *models.DeckSchedule) error {
	result := r.db.Create(&schedule)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (r *ScheduleRepository) GetAllSchedules(userId int) ([]models.DeckSchedule, error) {
	var schedules []models.DeckSchedule
	result := r.db.Preload("ScheduleSteps").Where("user_id = ?", userId).Find(&schedules)
	if result.Error != nil {
		return nil, result.Error
	}
	return schedules, nil
}

func (r *ScheduleRepository) CreateScheduleInterval(scheduleSteps []models.ScheduleStep) error {
	result := r.db.Create(scheduleSteps)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *ScheduleRepository) UpdateScheduleName(scheduleId int, schedule map[string]any) error {
	result := r.db.Model(models.DeckSchedule{}).Where("id = ?", scheduleId).Updates(schedule)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *ScheduleRepository) DeleteScheduleInterval(scheduleId int) error {
	return r.db.Where("deck_schedule_id = ?", scheduleId).Delete(models.ScheduleStep{}).Error
}

func (r *ScheduleRepository) GetSchedule(id int) (*models.DeckSchedule, error) {
	var schedule models.DeckSchedule
	err := r.db.Preload("ScheduleSteps").First(&schedule, id).Error
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

func (r *ScheduleRepository) DeleteSchedule(schedule *models.DeckSchedule, scheduleId int) error {
	result := r.db.Delete(schedule, scheduleId)

	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *ScheduleRepository) UpdateSchedule(scheduleId, newScheduleId int) error {

	query := `
		UPDATE decks
		SET schedule_id = ? 
		WHERE decks.schedule_id = ?
	`
	err := r.db.Exec(query, newScheduleId, scheduleId).Error

	if err != nil {
		return err
	}

	return nil
}
