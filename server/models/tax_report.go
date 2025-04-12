package models

import (
	"time"

	"gorm.io/gorm"
)

// TaxReport represents a tax reporting document for a user's donations
type TaxReport struct {
	gorm.Model
	UserID         string    `json:"userId" gorm:"index"`
	Year           int       `json:"year"`
	TotalDonations float64   `json:"totalDonations"`
	Status         string    `json:"status"` // "ready", "processing", "error"
	FileURL        string    `json:"fileUrl,omitempty"`
	GeneratedAt    time.Time `json:"generatedAt"`
	User           User      `json:"user" gorm:"foreignKey:UserID;references:FirebaseID"`
}

// AuditRecord represents an audit trail entry for compliance and transparency
type AuditRecord struct {
	gorm.Model
	UserID    string    `json:"userId" gorm:"index"`
	Event     string    `json:"event"`
	Details   string    `json:"details"`
	Timestamp time.Time `json:"timestamp"`
	User      User      `json:"user" gorm:"foreignKey:UserID;references:FirebaseID"`
}

// ComplianceCheck represents a compliance verification for a user or charity
type ComplianceCheck struct {
	gorm.Model
	UserID    string    `json:"userId,omitempty"`
	CharityID uint      `json:"charityId,omitempty"`
	Type      string    `json:"type"`
	Status    string    `json:"status"` // "passed", "failed", "pending"
	Details   string    `json:"details,omitempty"`
	Date      time.Time `json:"date"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID;references:FirebaseID"`
	Charity   Charity   `json:"charity,omitempty" gorm:"foreignKey:CharityID"`
}
