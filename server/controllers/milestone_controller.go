package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type MilestoneInput struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Amount      string    `json:"amount"`
	DueDate     time.Time `json:"dueDate"`
}

type MilestoneVerificationInput struct {
	VerifierID string `json:"verifierId"`
	Comments   string `json:"comments"`
	Status     string `json:"status"`
	Proof      string `json:"proof,omitempty"`
}

// GetMilestones gets all milestones for a transaction approval
func GetMilestones(c *fiber.Ctx) error {
	approvalID := c.Params("approvalId")

	var milestones []models.Milestone
	if err := config.DB.Where("approval_id = ?", approvalID).Find(&milestones).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch milestones",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   milestones,
	})
}

// CreateMilestone creates a new milestone for a transaction approval
func CreateMilestone(c *fiber.Ctx) error {
	approvalID := c.Params("approvalId")
	input := new(MilestoneInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Check if approval exists
	var approval models.TransactionApproval
	if err := config.DB.First(&approval, approvalID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Transaction approval not found",
		})
	}

	// Verify user is authorized (only charity owner or cosigner can create milestones)
	userID := c.Locals("userID").(uint)

	// Get charity
	var charity models.Charity
	if err := config.DB.First(&charity, approval.CharityID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not verify charity",
		})
	}

	var isAuthorized bool
	if charity.OwnerID == userID {
		isAuthorized = true
	} else {
		// Check if user is a cosigner
		var cosigner models.Cosigner
		if err := config.DB.Where("charity_id = ? AND user_id = ?", charity.ID, userID).First(&cosigner).Error; err == nil {
			isAuthorized = true
		}
	}

	if !isAuthorized {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "You are not authorized to create milestones for this transaction",
		})
	}

	// Validate milestone data
	if input.Name == "" || input.Description == "" || input.Amount == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Name, description, and amount are required",
		})
	}

	// Create milestone
	approvalIDUint, _ := strconv.ParseUint(approvalID, 10, 64)
	milestone := models.Milestone{
		Name:        input.Name,
		Description: input.Description,
		ApprovalID:  uint(approvalIDUint),
		Amount:      input.Amount,
		DueDate:     input.DueDate,
		Status:      "pending",
	}

	if err := config.DB.Create(&milestone).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create milestone",
			"error":   err.Error(),
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   milestone,
	})
}

// CompleteMilestone marks a milestone as completed by the charity
func CompleteMilestone(c *fiber.Ctx) error {
	milestoneID := c.Params("milestoneId")
	input := new(MilestoneVerificationInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Find milestone
	var milestone models.Milestone
	if err := config.DB.First(&milestone, milestoneID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Milestone not found",
		})
	}

	// Get associated approval and charity
	var approval models.TransactionApproval
	if err := config.DB.First(&approval, milestone.ApprovalID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch approval details",
		})
	}

	var charity models.Charity
	if err := config.DB.First(&charity, approval.CharityID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch charity details",
		})
	}

	// Verify user is authorized (only charity owner can mark milestone as completed)
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can mark milestones as completed",
		})
	}

	// Update milestone
	milestone.Status = "completed"
	milestone.CompletionDate = time.Now()
	milestone.VerificationProof = input.Proof

	if err := config.DB.Save(&milestone).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update milestone",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   milestone,
	})
}

// VerifyMilestone verifies a completed milestone
func VerifyMilestone(c *fiber.Ctx) error {
	milestoneID := c.Params("milestoneId")
	input := new(MilestoneVerificationInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Find milestone
	var milestone models.Milestone
	if err := config.DB.First(&milestone, milestoneID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Milestone not found",
		})
	}

	// Check milestone status
	if milestone.Status != "completed" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Milestone must be completed before verification",
		})
	}

	// Get associated approval and charity
	var approval models.TransactionApproval
	if err := config.DB.First(&approval, milestone.ApprovalID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch approval details",
		})
	}

	// Verify user is authorized (must be a cosigner to verify milestones)
	userID := c.Locals("userID").(uint)
	userIDStr := strconv.FormatUint(uint64(userID), 10)

	var cosigner models.Cosigner
	if err := config.DB.Where("charity_id = ? AND user_id = ?", approval.CharityID, userID).First(&cosigner).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only cosigners can verify milestones",
		})
	}

	// Create verification
	verification := models.MilestoneVerification{
		MilestoneID: milestone.ID,
		VerifierID:  userIDStr,
		Comments:    input.Comments,
		Status:      input.Status,
	}

	if err := config.DB.Create(&verification).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create verification",
			"error":   err.Error(),
		})
	}

	// Update milestone status based on verification
	if input.Status == "approved" {
		milestone.Status = "verified"
	} else {
		milestone.Status = "pending" // Reset to pending if rejected
	}

	if err := config.DB.Save(&milestone).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update milestone status",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"milestone":    milestone,
			"verification": verification,
		},
	})
}

// ReleaseMilestoneFunds releases funds for a verified milestone
func ReleaseMilestoneFunds(c *fiber.Ctx) error {
	milestoneID := c.Params("milestoneId")

	// Find milestone
	var milestone models.Milestone
	if err := config.DB.First(&milestone, milestoneID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Milestone not found",
		})
	}

	// Check milestone status
	if milestone.Status != "verified" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Milestone must be verified before releasing funds",
		})
	}

	// Get associated approval and charity
	var approval models.TransactionApproval
	if err := config.DB.First(&approval, milestone.ApprovalID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch approval details",
		})
	}

	var charity models.Charity
	if err := config.DB.First(&charity, approval.CharityID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch charity details",
		})
	}

	// Verify user is authorized (only charity owner can release funds)
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can release milestone funds",
		})
	}

	// In a real implementation, this would use the Stellar service to send the transaction
	// For now, we'll just update the status
	milestone.Status = "released"

	// Generate a mock transaction hash
	txHash := "milestone-tx-" + milestoneID

	if err := config.DB.Save(&milestone).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update milestone status",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"milestone": milestone,
			"txHash":    txHash,
		},
	})
}
