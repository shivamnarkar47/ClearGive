package models

import (
	"gorm.io/gorm"
)

// Cosigner represents a person who can approve transactions
type Cosigner struct {
	gorm.Model
	CharityID uint   `json:"charityId"`
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	IsPrimary bool   `json:"isPrimary" gorm:"default:false"`
}

// BudgetCategory represents a budget allocation category
type BudgetCategory struct {
	gorm.Model
	CharityID  uint    `json:"charityId"`
	Name       string  `json:"name"`
	Allocation float64 `json:"allocation"` // percentage of total budget
	Spent      float64 `json:"spent"`      // amount spent
}

type Charity struct {
	gorm.Model
	Name               string           `json:"name"`
	Description        string           `json:"description"`
	WalletAddress      string           `json:"walletAddress" gorm:"unique"`
	WalletSecret       string           `json:"-" gorm:"unique"` // Secret key is not exposed in JSON
	OwnerID            uint             `json:"ownerId"`
	TotalDonations     float64          `json:"totalDonations" gorm:"default:0"`
	Category           string           `json:"category"`
	Website            string           `json:"website"`
	ImageURL           string           `json:"imageUrl"`
	IsMultiSig         bool             `json:"isMultiSig" gorm:"default:false"`
	RequiredSignatures int              `json:"requiredSignatures" gorm:"default:1"`
	Owner              User             `json:"owner" gorm:"foreignKey:OwnerID"`
	Cosigners          []Cosigner       `json:"cosigners" gorm:"foreignKey:CharityID"`
	BudgetCategories   []BudgetCategory `json:"budgetCategories" gorm:"foreignKey:CharityID"`
}
