package service

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/schedule"
	"errors"

	"gorm.io/gorm"
)

type ScheduleService struct {
	repo schedule.ScheduleRepository
	db   *gorm.DB
}

func NewScheduleService(repo schedule.ScheduleRepository, db *gorm.DB) *ScheduleService {
	return &ScheduleService{repo: repo,
		db: db,
	}
}

func (s *ScheduleService) CreateSchedule(scheduleCreate models.DeckSchedule, levels []models.ScheduleStep) (*models.DeckSchedule, error) {
	err := s.db.Transaction(func(tx *gorm.DB) error {

		txWordSetRepo := s.repo.WithTx(tx)

		err := txWordSetRepo.CreateSchedule(&scheduleCreate)
		if err != nil {
			return err
		}

		var scheduleSteps []models.ScheduleStep
		for _, value := range levels {
			level := models.ScheduleStep{
				DeckScheduleId:  scheduleCreate.Id,
				Level:           value.Level,
				IntervalMinutes: value.IntervalMinutes,
			}
			scheduleSteps = append(scheduleSteps, level)
		}

		err = txWordSetRepo.CreateScheduleInterval(scheduleSteps)
		if err != nil {
			return err
		}
		scheduleCreate.ScheduleSteps = scheduleSteps

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &scheduleCreate, nil
}

func (s *ScheduleService) GetAllSchedules(userId int) ([]models.DeckSchedule, error) {

	models, err := s.repo.GetAllSchedules(userId)
	if err != nil {
		return nil, err
	}
	return models, nil
}

func (s *ScheduleService) DeleteSchedule(scheduleId int, newscheduleId int) error {
	return s.db.Transaction(func(tx *gorm.DB) error {

		txWordSetRepo := s.repo.WithTx(tx)

		schedule, err := txWordSetRepo.GetSchedule(scheduleId)
		if err != nil {
			return err
		}

		if schedule.IsDefault == true {
			return errors.New("You can't delete default schedule")
		}

		err = txWordSetRepo.UpdateSchedule(scheduleId, newscheduleId)
		if err != nil {
			return err
		}

		schedule = &models.DeckSchedule{}
		err = txWordSetRepo.DeleteSchedule(schedule, scheduleId)
		if err != nil {
			return err
		}

		return nil
	})

}

func (s *ScheduleService) UpdateSchedule(userId, scheduleId int, name string, levels []models.ScheduleStep) (*models.DeckSchedule, error) {
	var scheduleUpdate *models.DeckSchedule
	var scheduleSteps []models.ScheduleStep

	scheduleUpdateName := map[string]any{"name": name}
	for _, value := range levels {
		level := models.ScheduleStep{
			DeckScheduleId:  scheduleId,
			Level:           value.Level,
			IntervalMinutes: value.IntervalMinutes,
		}
		scheduleSteps = append(scheduleSteps, level)
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		txWordSetRepo := s.repo.WithTx(tx)
		if err := txWordSetRepo.UpdateScheduleName(scheduleId, scheduleUpdateName); err != nil {
			return err
		}

		if err := txWordSetRepo.DeleteScheduleInterval(scheduleId); err != nil {
			return err
		}

		if err := txWordSetRepo.CreateScheduleInterval(scheduleSteps); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	scheduleUpdate = &models.DeckSchedule{
		Id:            scheduleId,
		Name:          name,
		ScheduleSteps: scheduleSteps,
		UserId:        userId,
	}

	return scheduleUpdate, nil
}
