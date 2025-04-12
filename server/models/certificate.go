package models

import (
	"time"

	"gorm.io/gorm"
)

// Certificate represents an NFT certificate for a donation
type Certificate struct {
	gorm.Model
	DonationID   uint      `json:"donationId" gorm:"index"`
	TokenID      string    `json:"tokenId"`
	TokenURI     string    `json:"tokenUri"`
	IssueDate    time.Time `json:"issueDate"`
	MetadataHash string    `json:"metadataHash"` // IPFS hash of certificate metadata
	TxHash       string    `json:"txHash"`       // Blockchain transaction hash for NFT minting
	ImageURL     string    `json:"imageUrl"`     // URL to certificate image
	Status       string    `json:"status"`       // "minted", "pending", "failed"
	Donation     Donation  `json:"donation" gorm:"foreignKey:DonationID"`
}

// CertificateMetadata represents the metadata structure for an NFT certificate
type CertificateMetadata struct {
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Image        string    `json:"image"`
	Amount       string    `json:"amount"`
	Currency     string    `json:"currency"`
	DonatedTo    string    `json:"donatedTo"`
	DonatedBy    string    `json:"donatedBy"`
	DonationDate time.Time `json:"donationDate"`
	IssueDate    time.Time `json:"issueDate"`
	TxHash       string    `json:"txHash"`
	Category     string    `json:"category,omitempty"`
	ImpactArea   string    `json:"impactArea,omitempty"`
}
