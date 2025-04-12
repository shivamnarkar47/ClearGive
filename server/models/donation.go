package models

import (
	"gorm.io/gorm"
)

type Donation struct {
	gorm.Model
	Amount    string  `json:"amount"`
	CharityID uint    `json:"charityId"`
	DonorID   string  `json:"donorId"`
	Message   string  `json:"message"`
	TxHash    string  `json:"txHash" gorm:"unique"`
	Status    string  `json:"status"`
	Category  string  `json:"category"`
	Charity   Charity `json:"charity" gorm:"foreignKey:CharityID"`
	Donor     User    `json:"donor" gorm:"foreignKey:FirebaseID"`
}
