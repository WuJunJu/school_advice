package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-very-secret-key") // WARNING: Use a secure key from config/env in production

type Claims struct {
	UserID       uint   `json:"user_id"`
	Username     string `json:"username"`
	Role         string `json:"role"`
	DepartmentID uint   `json:"department_id"`
	CanViewAll   bool   `json:"can_view_all"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID uint, username, role string, departmentID uint, canViewAll bool) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:       userID,
		Username:     username,
		Role:         role,
		DepartmentID: departmentID,
		CanViewAll:   canViewAll,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, err
	}

	return claims, nil
}
