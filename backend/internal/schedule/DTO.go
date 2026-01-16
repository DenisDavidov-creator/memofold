package schedule

import models "dimplom_harmonic/domain"

type ScheduleDTO struct {
	Id              int                  `json:"id"`
	Name            string               `json:"name"`
	SchedueleLevels []SchedueleLevelsDTO `json:"levels"`
}

type SchedueleLevelsDTO struct {
	Level           int `json:"level"`
	IntervalMinutes int `json:"intervalMinutes"`
}

func CreateScheduleToModels(cs *ScheduleDTO, userId int) (models.DeckSchedule, []models.ScheduleStep) {
	scheduleModel := models.DeckSchedule{
		Name:      cs.Name,
		UserId:    userId,
		IsDefault: false,
	}

	var scheduleStepModel []models.ScheduleStep

	for _, value := range cs.SchedueleLevels {
		sS := models.ScheduleStep{
			Level:           value.Level,
			IntervalMinutes: value.IntervalMinutes,
		}
		scheduleStepModel = append(scheduleStepModel, sS)
	}

	return scheduleModel, scheduleStepModel
}

func ScheduleModelTo(m *models.DeckSchedule) ScheduleDTO {
	var schedleReturn ScheduleDTO

	schedleReturn.Id = m.Id
	schedleReturn.Name = m.Name
	scheduleSteps := []SchedueleLevelsDTO{}

	for _, value := range m.ScheduleSteps {
		scheduleStep := SchedueleLevelsDTO{
			Level:           value.Level,
			IntervalMinutes: value.IntervalMinutes,
		}
		scheduleSteps = append(scheduleSteps, scheduleStep)

	}

	schedleReturn.SchedueleLevels = scheduleSteps
	return schedleReturn
}

func ScheduleListModelTo(m []models.DeckSchedule) []ScheduleDTO {
	dtos := make([]ScheduleDTO, 0, len(m))

	for _, value := range m {
		dtos = append(dtos, ScheduleModelTo(&value))
	}
	return dtos
}

type UpdateScheduleDTO struct {
	Name   string                `json:"name"`
	Levels []models.ScheduleStep `json:"levels"`
}
