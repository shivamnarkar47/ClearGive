package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetComplianceChecks retrieves compliance checks for a user
func GetComplianceChecks(c *fiber.Ctx) error {
	userID := c.Params("userId")
	if userID == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "User ID is required",
		})
	}

	var checks []models.ComplianceCheck
	if err := config.DB.Where("user_id = ?", userID).Order("date desc").Find(&checks).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch compliance checks",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   checks,
	})
}

// GetCharityComplianceChecks retrieves compliance checks for a charity
func GetCharityComplianceChecks(c *fiber.Ctx) error {
	charityID := c.Params("charityId")
	if charityID == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity ID is required",
		})
	}

	var checks []models.ComplianceCheck
	if err := config.DB.Where("charity_id = ?", charityID).Order("date desc").Find(&checks).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch compliance checks",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   checks,
	})
}

// RunComplianceCheck initiates a new compliance check for a user or charity
func RunComplianceCheck(c *fiber.Ctx) error {
	type ComplianceInput struct {
		UserID    string `json:"userId"`
		CharityID uint   `json:"charityId"`
		Type      string `json:"type"`
	}

	input := new(ComplianceInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	if input.UserID == "" && input.CharityID == 0 {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Either userId or charityId must be provided",
		})
	}

	if input.Type == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Compliance check type is required",
		})
	}

	// Supported check types
	validTypes := map[string]bool{
		"donor_verification":    true,
		"charity_eligibility":   true,
		"transaction_limits":    true,
		"anti_money_laundering": true,
		"identity_verification": true,
	}

	if !validTypes[input.Type] {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid compliance check type",
		})
	}

	// In a real implementation, you would call external compliance services
	// and wait for their response. For demonstration, we'll simulate the check.

	// Create a pending compliance check
	check := models.ComplianceCheck{
		UserID:    input.UserID,
		CharityID: input.CharityID,
		Type:      input.Type,
		Status:    "pending",
		Date:      time.Now(),
		Details:   "Compliance check initiated",
	}

	if err := config.DB.Create(&check).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create compliance check",
			"error":   err.Error(),
		})
	}

	// Log the action in audit trail
	var auditRecord models.AuditRecord
	if input.UserID != "" {
		auditRecord = models.AuditRecord{
			UserID:    input.UserID,
			Event:     "Compliance Check Initiated",
			Details:   "Compliance check of type " + input.Type + " was initiated",
			Timestamp: time.Now(),
		}
	} else {
		// Use system as the user for charity checks
		auditRecord = models.AuditRecord{
			UserID:    "system",
			Event:     "Charity Compliance Check Initiated",
			Details:   "Compliance check of type " + input.Type + " was initiated for charity ID " + string(input.CharityID),
			Timestamp: time.Now(),
		}
	}
	config.DB.Create(&auditRecord)

	// In a real implementation, you would now:
	// 1. Send the check to a background job queue
	// 2. Process it asynchronously
	// 3. Update the status when done

	// For demonstration, we'll simulate a quick check completion
	simulateComplianceCheck(&check)

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   check,
	})
}

// UpdateComplianceCheck updates an existing compliance check
func UpdateComplianceCheck(c *fiber.Ctx) error {
	id := c.Params("id")

	type UpdateInput struct {
		Status  string `json:"status"`
		Details string `json:"details"`
	}

	input := new(UpdateInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	var check models.ComplianceCheck
	if err := config.DB.First(&check, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Compliance check not found",
		})
	}

	// Update fields
	check.Status = input.Status
	check.Details = input.Details

	if err := config.DB.Save(&check).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update compliance check",
			"error":   err.Error(),
		})
	}

	// Log the update in audit trail
	auditRecord := models.AuditRecord{
		UserID:    "system", // Use system as the user for compliance updates
		Event:     "Compliance Check Updated",
		Details:   "Compliance check #" + id + " status updated to " + input.Status,
		Timestamp: time.Now(),
	}
	config.DB.Create(&auditRecord)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   check,
	})
}

// Helper function to simulate a compliance check
func simulateComplianceCheck(check *models.ComplianceCheck) {
	// This would normally be done asynchronously
	// For demonstration, we'll just update the status

	// Simulate different results based on check type
	switch check.Type {
	case "anti_money_laundering":
		// Simulate a pending check that needs manual review
		check.Status = "pending"
		check.Details = "Awaiting manual review by compliance team"
	default:
		// Most checks pass automatically
		check.Status = "passed"
		check.Details = "Automated verification completed successfully"
	}

	config.DB.Save(check)
}
