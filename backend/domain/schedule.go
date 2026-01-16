package models

type DeckSchedule struct {
	Id        int `gorm:"primaryKey"`
	Name      string
	UserId    int
	IsDefault bool

	// Это поле связывает с дочерней моделью
	ScheduleSteps []ScheduleStep `gorm:"foreignKey:deck_schedule_id"`
}

func (DeckSchedule) TableName() string {
	return "deck_schedules"
}
