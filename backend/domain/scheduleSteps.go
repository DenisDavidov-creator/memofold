package models

type ScheduleStep struct {
	Id int `gorm:"primaryKey"`

	DeckScheduleId int `gorm:"column:deck_schedule_id"`

	Level           int
	IntervalMinutes int `gorm:"column:interval_minutes"`
}

func (ScheduleStep) TableName() string {
	return "schedule_steps"
}
