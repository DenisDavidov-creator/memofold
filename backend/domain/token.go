package models

import "github.com/golang-jwt/jwt/v5"

type AppClaims struct {
	UserID    int    `json:"userId"`
	Login     string `json:"login"`
	IsPremium bool   `json:"isPremium"`
	jwt.RegisteredClaims
}
