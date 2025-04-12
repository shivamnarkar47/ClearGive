package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

type CertificateInput struct {
	DonationID uint `json:"donationId"`
}

// GenerateCertificate creates a new NFT certificate for a donation
func GenerateCertificate(c *fiber.Ctx) error {
	fmt.Println("Starting certificate generation")

	input := new(CertificateInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Check if donation exists
	var donation models.Donation
	if err := config.DB.Preload("Charity").Preload("Donor").First(&donation, input.DonationID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Donation not found",
		})
	}

	// Check if certificate already exists
	var existingCert models.Certificate
	if err := config.DB.Where("donation_id = ?", input.DonationID).First(&existingCert).Error; err == nil {
		// Certificate exists, return it
		return c.JSON(fiber.Map{
			"status":  "success",
			"message": "Certificate already exists for this donation",
			"data":    existingCert,
		})
	}

	// Generate unique token ID (in a real implementation, this would be a blockchain token ID)
	tokenBytes := make([]byte, 16)
	rand.Read(tokenBytes)
	tokenID := hex.EncodeToString(tokenBytes)

	// Create metadata
	metadata := models.CertificateMetadata{
		Name:         fmt.Sprintf("Donation Certificate #%d", donation.ID),
		Description:  fmt.Sprintf("Certificate of donation to %s", donation.Charity.Name),
		Image:        fmt.Sprintf("https://cleargive.org/certificates/%s.png", tokenID),
		Amount:       donation.Amount,
		Currency:     "XLM",
		DonatedTo:    donation.Charity.Name,
		DonatedBy:    donation.Donor.Email,
		DonationDate: donation.CreatedAt,
		IssueDate:    time.Now(),
		TxHash:       donation.TxHash,
		Category:     donation.Category,
		ImpactArea:   donation.Charity.Category,
	}

	// Log metadata for demonstration purposes
	fmt.Printf("Certificate metadata created: %+v\n", metadata)

	// In a real implementation, you would:
	// 1. Upload metadata to IPFS
	// 2. Mint an NFT on a blockchain
	// 3. Return the token ID and transaction hash

	// For demonstration, simulate those steps
	metadataHash := fmt.Sprintf("ipfs://Qm%s", tokenID)
	tokenURI := fmt.Sprintf("https://cleargive.org/api/certificates/%s/metadata", tokenID)

	// Create certificate
	certificate := models.Certificate{
		DonationID:   input.DonationID,
		TokenID:      tokenID,
		TokenURI:     tokenURI,
		IssueDate:    time.Now(),
		MetadataHash: metadataHash,
		TxHash:       fmt.Sprintf("0x%s", tokenID), // In a real implementation, this would be the actual blockchain tx hash
		ImageURL:     fmt.Sprintf("https://cleargive.org/certificates/%s.png", tokenID),
		Status:       "minted",
	}

	if err := config.DB.Create(&certificate).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create certificate",
			"error":   err.Error(),
		})
	}

	// Create audit trail entry
	auditRecord := models.AuditRecord{
		UserID:    donation.DonorID,
		Event:     "Certificate Generated",
		Details:   fmt.Sprintf("NFT Certificate generated for donation #%d", donation.ID),
		Timestamp: time.Now(),
	}
	config.DB.Create(&auditRecord)

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   certificate,
	})
}

// GetCertificate retrieves a certificate by ID
func GetCertificate(c *fiber.Ctx) error {
	id := c.Params("id")
	var certificate models.Certificate

	if err := config.DB.Preload("Donation").Preload("Donation.Charity").Preload("Donation.Donor").First(&certificate, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Certificate not found",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   certificate,
	})
}

// GetCertificateByToken retrieves a certificate by its token ID
func GetCertificateByToken(c *fiber.Ctx) error {
	tokenID := c.Params("tokenId")
	var certificate models.Certificate

	if err := config.DB.Where("token_id = ?", tokenID).Preload("Donation").Preload("Donation.Charity").Preload("Donation.Donor").First(&certificate).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Certificate not found",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   certificate,
	})
}

// GetCertificateMetadata returns the NFT metadata for a certificate
func GetCertificateMetadata(c *fiber.Ctx) error {
	tokenID := c.Params("tokenId")
	var certificate models.Certificate

	if err := config.DB.Where("token_id = ?", tokenID).Preload("Donation").Preload("Donation.Charity").Preload("Donation.Donor").First(&certificate).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Certificate not found",
		})
	}

	// Create metadata
	metadata := models.CertificateMetadata{
		Name:         fmt.Sprintf("Donation Certificate #%d", certificate.Donation.ID),
		Description:  fmt.Sprintf("Certificate of donation to %s", certificate.Donation.Charity.Name),
		Image:        certificate.ImageURL,
		Amount:       certificate.Donation.Amount,
		Currency:     "XLM",
		DonatedTo:    certificate.Donation.Charity.Name,
		DonatedBy:    certificate.Donation.Donor.Email,
		DonationDate: certificate.Donation.CreatedAt,
		IssueDate:    certificate.IssueDate,
		TxHash:       certificate.Donation.TxHash,
		Category:     certificate.Donation.Category,
		ImpactArea:   certificate.Donation.Charity.Category,
	}

	return c.JSON(metadata)
}

// GetUserCertificates retrieves all certificates for a user
func GetUserCertificates(c *fiber.Ctx) error {
	userID := c.Params("userId")
	if userID == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "User ID is required",
		})
	}

	var certificates []models.Certificate
	if err := config.DB.Joins("JOIN donations ON certificates.donation_id = donations.id").
		Where("donations.donor_id = ?", userID).
		Preload("Donation").
		Preload("Donation.Charity").
		Find(&certificates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch certificates",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   certificates,
	})
}

// VerifyCertificate checks if a certificate is valid and returns its verification status
func VerifyCertificate(c *fiber.Ctx) error {
	tokenID := c.Params("tokenId")
	var certificate models.Certificate

	if err := config.DB.Where("token_id = ?", tokenID).First(&certificate).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Certificate not found or invalid",
			"valid":   false,
		})
	}

	// In a real implementation, you would verify the certificate on the blockchain
	// For demonstration, we'll just check if it exists and is in "minted" status
	isValid := certificate.Status == "minted"

	return c.JSON(fiber.Map{
		"status":    "success",
		"valid":     isValid,
		"tokenId":   certificate.TokenID,
		"issueDate": certificate.IssueDate,
	})
}
