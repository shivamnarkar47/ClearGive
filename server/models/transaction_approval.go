package models

import (
	"gorm.io/gorm"
)

// TransactionApproval represents a transaction that requires multi-signature approval
type TransactionApproval struct {
	gorm.Model
	CharityID          uint    `json:"charityId"`
	Amount             string  `json:"amount"`
	Description        string  `json:"description"`
	Category           string  `json:"category"`
	RequestedByID      string  `json:"requestedById"`
	RequiredSignatures int     `json:"requiredSignatures"`
	CurrentSignatures  int     `json:"currentSignatures" gorm:"default:0"`
	Status             string  `json:"status"` // pending, approved, rejected, executed
	TxHash             string  `json:"txHash"` // Set when executed
	Charity            Charity `json:"charity" gorm:"foreignKey:CharityID"`
}

// ApprovalSignature represents a signature on a transaction approval
type ApprovalSignature struct {
	gorm.Model
	ApprovalID uint   `json:"approvalId"`
	SignerID   string `json:"signerId"`
	Signature  string `json:"signature"` // Could be actual signature data in production
}
