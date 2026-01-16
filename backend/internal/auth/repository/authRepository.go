package repository

import (
	models "dimplom_harmonic/domain"
	"dimplom_harmonic/internal/auth"
	"time"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(user *models.User) error {
	result := r.db.Create(&user)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {

	var user models.User

	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByID(id int) (*models.User, error) {
	var user models.User

	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) MockPayment(userId int, expiresAt time.Time) error {
	query := `
		UPDATE 
			users
		SET
			premium_expires_at = ?
		WHERE 
			id = ?
	`
	err := r.db.Exec(query, expiresAt, userId).Error
	if err != nil {
		return err
	}

	return err
}

func (r *UserRepository) SaveRefreshToken(userId int, refreshToken string, expiresAt time.Time) error {
	query := `
		INSERT INTO 
			refresh_tokens (user_id, token, expires_at)
		VALUES
			(?,?,?)
	`
	err := r.db.Exec(query, userId, refreshToken, expiresAt).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) DeleteRefreshToken(oldRefreshToken string) error {
	query := `
		DELETE 
		FROM 
			refresh_tokens r 
		WHERE 
			r.token = ?
	`

	err := r.db.Exec(query, oldRefreshToken).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) GetRefreshToken(token string) (*auth.RefreshToken, error) {
	var refreshToken auth.RefreshToken

	err := r.db.Where("token = ?", token).First(&refreshToken).Error

	if err != nil {
		return nil, err
	}
	return &refreshToken, nil
}

func (r *UserRepository) WithTx(tx *gorm.DB) auth.UserRepository {
	return &UserRepository{
		db: tx,
	}
}
