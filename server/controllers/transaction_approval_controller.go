package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type CreateApprovalInput struct {
	Amount      string `json:"amount"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

type AddSignatureInput struct {
	SignerID  string `json:"signerId"`
	Signature string `json:"signature"` // Could be empty in this implementation
	Email     string `json:"email"`     // Added for direct email specification
}

// GetPendingApprovals returns all pending and approved transaction approvals for a charity
func GetPendingApprovals(c *fiber.Ctx) error {
	charityID := c.Params("id")

	// Check if charityID is valid
	charityIDNum, err := strconv.ParseUint(charityID, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid charity ID",
		})
	}

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityIDNum).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
		})
	}

	// Check if user is owner or cosigner of the charity
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		// Check if user is a cosigner
		var cosigner models.Cosigner
		if err := config.DB.Where("charity_id = ? ", charity.ID).First(&cosigner).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{
				"status":  "error",
				"message": "You are not authorized to view transaction approvals for this charity",
			})
		}
	}

	// Get pending approvals
	var approvals []models.TransactionApproval
	if err := config.DB.Where("charity_id = ? AND status = ?", charity.ID, "pending").Find(&approvals).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch transaction approvals",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   approvals,
	})
}

// CreateTransactionApproval creates a new transaction approval request
func CreateTransactionApproval(c *fiber.Ctx) error {
	charityID := c.Params("id")

	// Check if charityID is valid
	charityIDNum, err := strconv.ParseUint(charityID, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid charity ID",
			"error":   err.Error(),
		})
	}

	input := new(CreateApprovalInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Validate required fields
	if input.Amount == "" || input.Description == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Amount and description are required",
			"error":   err.Error(),
		})
	}

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityIDNum).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
			"error":   err.Error(),
		})
	}

	// Check if user is owner or cosigner of the charity
	userID := c.Locals("userID").(uint)
	email := c.Locals("email").(string)
	var isAuthorized bool

	if charity.OwnerID == userID {
		isAuthorized = true
	} else {
		// Check if user is a cosigner
		var cosigner models.Cosigner
		if err := config.DB.Where("charity_id = ? AND email = ?", charity.ID, email).First(&cosigner).Error; err == nil {
			isAuthorized = true
		}
	}

	if !isAuthorized {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "You are not authorized to create transaction approvals for this charity",
		})
	}

	// Convert userID to string for storage
	userIDStr := strconv.FormatUint(uint64(userID), 10)

	// Create transaction approval
	approval := models.TransactionApproval{
		CharityID:          charity.ID,
		Amount:             input.Amount,
		Description:        input.Description,
		Category:           input.Category,
		RequestedByID:      userIDStr,
		RequiredSignatures: charity.RequiredSignatures,
		CurrentSignatures:  0,
		Status:             "pending",
	}

	if err := config.DB.Create(&approval).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create transaction approval",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   approval,
	})
}

// AddApprovalSignature adds a signature to a transaction approval
func AddApprovalSignature(c *fiber.Ctx) error {
	approvalID := c.Params("approvalId")
	input := new(AddSignatureInput)

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
			"error":   err.Error(),
		})
	}

	// Check if approval is still pending
	if approval.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Transaction approval is no longer pending",
		})
	}

	// Check if user is authorized to sign
	userID := c.Locals("userID").(uint)

	// Get charity
	var charity models.Charity
	if err := config.DB.First(&charity, approval.CharityID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not verify charity",
		})
	}

	// Get email from context or from request body
	var email string
	emailInterface := c.Locals("email")
	if emailInterface != nil {
		email = emailInterface.(string)
	}

	// If email is provided in the request body, use that instead
	if input.Email != "" {
		email = input.Email
	}

	// Ensure we have an email
	if email == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Email is required for authorization",
		})
	}

	var isAuthorized bool
	if charity.OwnerID == userID {
		isAuthorized = true
	} else {
		// Check if user is a cosigner
		var cosigner models.Cosigner
		if err := config.DB.Where("charity_id = ? AND email = ?", charity.ID, email).First(&cosigner).Error; err == nil {
			isAuthorized = true
		}
	}

	if !isAuthorized {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "You are not authorized to sign this transaction approval",
		})
	}

	// Convert userID to string for storage
	userIDStr := strconv.FormatUint(uint64(userID), 10)

	// Check if user has already signed
	var existingSignature models.ApprovalSignature
	if err := config.DB.Where("approval_id = ? AND signer_id = ?", approval.ID, userIDStr).First(&existingSignature).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "You have already signed this transaction approval",
		})
	}

	// Create signature
	signature := models.ApprovalSignature{
		ApprovalID: approval.ID,
		SignerID:   userIDStr,
		Signature:  input.Signature,
	}

	if err := config.DB.Create(&signature).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not add signature",
		})
	}

	// Update approval
	approval.CurrentSignatures = approval.CurrentSignatures + 1

	// Check if approval is complete
	if approval.CurrentSignatures >= approval.RequiredSignatures {
		approval.Status = "approved"
	}

	if err := config.DB.Save(&approval).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update transaction approval",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   approval,
	})
}

// ExecuteApproval executes an approved transaction
func ExecuteApproval(c *fiber.Ctx) error {
	approvalID := c.Params("approvalId")

	// Check if approval exists
	var approval models.TransactionApproval
	if err := config.DB.First(&approval, approvalID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Transaction approval not found",
		})
	}

	// Check if approval is approved
	if approval.Status != "approved" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Transaction approval is not yet approved",
		})
	}

	// Get charity
	var charity models.Charity
	if err := config.DB.First(&charity, approval.CharityID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch charity details",
		})
	}

	// Check if user is owner
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can execute transactions",
		})
	}

	// Execute transaction
	// This would involve sending funds on the Stellar network
	// For now, we'll just update the status and add a mock transaction hash

	// In a real implementation, this would use the Stellar service to send the transaction
	approval.Status = "executed"
	approval.TxHash = "mock-transaction-hash-" + approvalID // This would be a real transaction hash

	if err := config.DB.Save(&approval).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update transaction status",
		})
	}

	// Update spent amount in budget category
	if approval.Category != "" {
		var budgetCategory models.BudgetCategory
		if err := config.DB.Where("charity_id = ? AND name = ?", charity.ID, approval.Category).First(&budgetCategory).Error; err == nil {
			// Convert amount string to float64
			amount, err := strconv.ParseFloat(approval.Amount, 64)
			if err == nil {
				budgetCategory.Spent += amount
				config.DB.Save(&budgetCategory)
			}
		}
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   approval,
	})
}

// RefundUnspentFunds returns unspent funds to the donor
func RefundUnspentFunds(c *fiber.Ctx) error {
	approvalID := c.Params("approvalId")

	// Check if approval exists
	var approval models.TransactionApproval
	if err := config.DB.First(&approval, approvalID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Transaction approval not found",
		})
	}

	// Check if approval was executed
	if approval.Status != "executed" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Only executed transactions can be refunded",
		})
	}

	// Get charity
	var charity models.Charity
	if err := config.DB.First(&charity, approval.CharityID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch charity details",
		})
	}

	// Check if user is owner
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can initiate refunds",
		})
	}

	// Get all milestones for this approval
	var milestones []models.Milestone
	if err := config.DB.Where("approval_id = ?", approval.ID).Find(&milestones).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch milestones",
		})
	}

	// Calculate total amount spent on released milestones
	var totalSpent float64 = 0
	for _, milestone := range milestones {
		if milestone.Status == "released" {
			amount, err := strconv.ParseFloat(milestone.Amount, 64)
			if err == nil {
				totalSpent += amount
			}
		}
	}

	// Calculate total approval amount
	totalAmount, err := strconv.ParseFloat(approval.Amount, 64)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not parse approval amount",
		})
	}

	// Calculate refund amount
	refundAmount := totalAmount - totalSpent
	if refundAmount <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "No funds available for refund",
		})
	}

	// Update approval status
	approval.Status = "refunded"
	if err := config.DB.Save(&approval).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update approval status",
		})
	}

	// In a real implementation, this would use the Stellar service to send the funds back
	// to the original donor, but for now we'll just update the status

	return c.Status(200).JSON(fiber.Map{
		"status":       "success",
		"message":      "Unspent funds refunded successfully",
		"refundAmount": refundAmount,
		"data":         approval,
	})
}
