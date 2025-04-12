package models

import (
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleUser         UserRole = "USER"
	RoleCharityOwner UserRole = "CHARITY_OWNER"
)

type StellarAccount struct {
	PublicKey string `json:"publicKey"`
	SecretKey string `json:"secretKey"`
}

type User struct {
	gorm.Model
	FirebaseID string `json:"firebase_id" gorm:"unique"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	StellarWallet StellarAccount `json:"stellarWallet" gorm:"embedded"`
} 