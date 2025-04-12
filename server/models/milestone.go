package models

import (
	"time"

	"gorm.io/gorm"
)

// Milestone represents a project milestone that triggers fund release
type Milestone struct {
	gorm.Model
	Name                string              `json:"name"`
	Description         string              `json:"description"`
	ApprovalID          uint                `json:"approvalId"`
	Amount              string              `json:"amount"`
	DueDate             time.Time           `json:"dueDate"`
	CompletionDate      time.Time           `json:"completionDate,omitempty"`
	Status              string              `json:"status"` // pending, completed, verified, released, cancelled
	VerificationProof   string              `json:"verificationProof,omitempty"`
	TransactionApproval TransactionApproval `json:"transactionApproval" gorm:"foreignKey:ApprovalID"`
}

// MilestoneVerification represents a verification of a milestone
type MilestoneVerification struct {
	gorm.Model
	MilestoneID uint      `json:"milestoneId"`
	VerifierID  string    `json:"verifierId"`
	Comments    string    `json:"comments"`
	Status      string    `json:"status"` // approved, rejected
	Milestone   Milestone `json:"milestone" gorm:"foreignKey:MilestoneID"`
}
