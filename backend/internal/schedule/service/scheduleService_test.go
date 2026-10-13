package service

import (
	"errors"
	"testing"

	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/mocks"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newSchedSvc(t *testing.T, repo *mocks.MockScheduleRepo) *ScheduleService {
	t.Helper()
	db, _ := mocks.NewMockDB(t)
	return NewScheduleService(repo, db)
}

func TestCreateSchedule_Success(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	repo := &mocks.MockScheduleRepo{}
	svc := NewScheduleService(repo, db)

	schedule := models.DeckSchedule{Name: "My Schedule", UserId: 1}
	levels := []models.ScheduleStep{
		{Level: 0, IntervalMinutes: 480},
		{Level: 1, IntervalMinutes: 1440},
	}

	result, err := svc.CreateSchedule(schedule, levels)
	require.NoError(t, err)
	assert.Equal(t, "My Schedule", result.Name)
	assert.Len(t, result.ScheduleSteps, 2)
}

func TestCreateSchedule_RepoError(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectRollback()

	repo := &mocks.MockScheduleRepo{
		CreateScheduleFn: func(s *models.DeckSchedule) error {
			return errors.New("db error")
		},
	}
	svc := NewScheduleService(repo, db)

	_, err := svc.CreateSchedule(models.DeckSchedule{Name: "Fail"}, nil)
	assert.Error(t, err)
}

func TestGetAllSchedules_Success(t *testing.T) {
	repo := &mocks.MockScheduleRepo{
		GetAllSchedulesFn: func(userId int) ([]models.DeckSchedule, error) {
			return []models.DeckSchedule{
				{Id: 1, Name: "Standard"},
				{Id: 2, Name: "Intensive"},
			}, nil
		},
	}
	svc := newSchedSvc(t, repo)

	result, err := svc.GetAllSchedules(1)
	require.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "Standard", result[0].Name)
}

func TestGetAllSchedules_Error(t *testing.T) {
	repo := &mocks.MockScheduleRepo{
		GetAllSchedulesFn: func(userId int) ([]models.DeckSchedule, error) {
			return nil, errors.New("db error")
		},
	}
	svc := newSchedSvc(t, repo)

	_, err := svc.GetAllSchedules(1)
	assert.Error(t, err)
}

func TestDeleteSchedule_DefaultSchedule_Error(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectRollback()

	repo := &mocks.MockScheduleRepo{
		GetScheduleFn: func(scheduleId int) (*models.DeckSchedule, error) {
			return &models.DeckSchedule{Id: scheduleId, IsDefault: true}, nil
		},
	}
	svc := NewScheduleService(repo, db)

	err := svc.DeleteSchedule(1, 2)
	require.Error(t, err)
	assert.Equal(t, "You can't delete default schedule", err.Error())
}

func TestDeleteSchedule_Success(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	repo := &mocks.MockScheduleRepo{
		GetScheduleFn: func(scheduleId int) (*models.DeckSchedule, error) {
			return &models.DeckSchedule{Id: scheduleId, IsDefault: false}, nil
		},
	}
	svc := NewScheduleService(repo, db)

	err := svc.DeleteSchedule(5, 1)
	assert.NoError(t, err)
}

func TestUpdateSchedule_Success(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectCommit()

	repo := &mocks.MockScheduleRepo{}
	svc := NewScheduleService(repo, db)

	levels := []models.ScheduleStep{
		{Level: 0, IntervalMinutes: 60},
		{Level: 1, IntervalMinutes: 120},
	}

	result, err := svc.UpdateSchedule(1, 5, "Updated", levels)
	require.NoError(t, err)
	assert.Equal(t, "Updated", result.Name)
	assert.Equal(t, 5, result.Id)
	assert.Len(t, result.ScheduleSteps, 2)
}

func TestUpdateSchedule_UpdateNameError(t *testing.T) {
	db, mock := mocks.NewMockDB(t)
	mock.ExpectBegin()
	mock.ExpectRollback()

	repo := &mocks.MockScheduleRepo{
		UpdateScheduleNameFn: func(scheduleId int, scheduleName map[string]any) error {
			return errors.New("update failed")
		},
	}
	svc := NewScheduleService(repo, db)

	_, err := svc.UpdateSchedule(1, 5, "Bad", nil)
	assert.Error(t, err)
}
