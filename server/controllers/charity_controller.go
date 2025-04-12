package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"
	"cleargive/server/services"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type CreateCharityInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Website     string `json:"website"`
	ImageURL    string `json:"imageUrl"`
}

type CosignerInput struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	IsPrimary bool   `json:"isPrimary"`
}

type BudgetCategoryInput struct {
	Name       string  `json:"name"`
	Allocation float64 `json:"allocation"`
}

type MultiSigSettingsInput struct {
	IsMultiSig         bool `json:"isMultiSig"`
	RequiredSignatures int  `json:"requiredSignatures"`
}

type OwnershipTransferInput struct {
	NewOwnerID uint   `json:"newOwnerId"`
	Email      string `json:"email"`
}

// GetCharities returns all charities
func GetCharities(c *fiber.Ctx) error {
	var charities []models.Charity

	if err := config.DB.Preload("Owner").Find(&charities).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch charities",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   charities,
	})
}

// CreateCharity creates a new charity with a Stellar wallet
func CreateCharity(c *fiber.Ctx) error {
	input := new(CreateCharityInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	// Get user role from context (set by auth middleware)
	userRole := c.Locals("userRole")
	if userRole != "CHARITY_OWNER" {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only charity owners can create charities",
		})
	}

	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(401).JSON(fiber.Map{
			"status":  "error",
			"message": "Unauthorized",
		})
	}

	// Validate required fields
	if input.Name == "" || input.Description == "" || input.Category == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Name, description, and category are required",
		})
	}

	// Generate Stellar wallet
	stellarAccount, err := services.CreateStellarAccount()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create Stellar wallet",
		})
	}

	// Fund the account on testnet (remove in production)
	if err := services.FundTestnetAccount(stellarAccount.PublicKey); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fund Stellar wallet",
		})
	}

	// Create charity
	charity := models.Charity{
		Name:          input.Name,
		Description:   input.Description,
		Category:      input.Category,
		Website:       input.Website,
		ImageURL:      input.ImageURL,
		WalletAddress: stellarAccount.PublicKey,
		WalletSecret:  stellarAccount.SecretKey, // In production, encrypt this
		OwnerID:       userID.(uint),
	}

	if err := config.DB.Create(&charity).Error; err != nil {
		if strings.Contains(err.Error(), "wallet_address") {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Wallet address is already in use",
			})
		}
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create charity",
		})
	}

	// Load the owner relationship
	config.DB.Preload("Owner").First(&charity, charity.ID)

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   charity,
	})
}

// GetCharity returns a single charity by ID
func GetCharity(c *fiber.Ctx) error {
	id := c.Params("id")
	var charity models.Charity

	if err := config.DB.Preload("Owner").Preload("Cosigners").Preload("BudgetCategories").First(&charity, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   charity,
	})
}

// AddCosigner adds a cosigner to a charity
func AddCosigner(c *fiber.Ctx) error {
	charityID := c.Params("id")
	input := new(CosignerInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	// Validate required fields
	if input.Email == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Email is required",
		})
	}

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
		})
	}

	// Only charity owner can add cosigners
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can add cosigners",
		})
	}

	// Create cosigner
	cosigner := models.Cosigner{
		CharityID: charity.ID,
		UserID:    input.UserID,
		Email:     input.Email,
		IsPrimary: input.IsPrimary,
	}

	if err := config.DB.Create(&cosigner).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not add cosigner",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   cosigner,
	})
}

// RemoveCosigner removes a cosigner from a charity
func RemoveCosigner(c *fiber.Ctx) error {
	charityID := c.Params("id")
	cosignerID := c.Params("cosignerId")

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
		})
	}

	// Only charity owner can remove cosigners
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can remove cosigners",
		})
	}

	// Remove cosigner
	if err := config.DB.Delete(&models.Cosigner{}, cosignerID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not remove cosigner",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status":  "success",
		"message": "Cosigner removed successfully",
	})
}

// UpdateMultiSigSettings updates the multi-signature settings for a charity
func UpdateMultiSigSettings(c *fiber.Ctx) error {
	charityID := c.Params("id")
	input := new(MultiSigSettingsInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
		})
	}

	// Only charity owner can update settings
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can update multi-signature settings",
		})
	}

	// Validate settings
	if input.IsMultiSig && input.RequiredSignatures < 2 {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "At least 2 signatures are required for multi-signature wallets",
		})
	}

	// Update settings
	charity.IsMultiSig = input.IsMultiSig
	charity.RequiredSignatures = input.RequiredSignatures

	if err := config.DB.Save(&charity).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update multi-signature settings",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   charity,
	})
}

// AddBudgetCategory adds a budget category to a charity
func AddBudgetCategory(c *fiber.Ctx) error {
	charityID := c.Params("id")
	input := new(BudgetCategoryInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Validate required fields
	if input.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Name is required",
		})
	}

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
			"error":   err.Error(),
		})
	}

	// Only charity owner can add budget categories
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can add budget categories",
		})
	}

	// Create budget category
	budgetCategory := models.BudgetCategory{
		CharityID:  charity.ID,
		Name:       input.Name,
		Allocation: input.Allocation,
		Spent:      0, // Initially, nothing is spent
	}

	if err := config.DB.Create(&budgetCategory).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not add budget category",
			"error":   err.Error(),
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   budgetCategory,
	})
}

// UpdateBudgetCategory updates a budget category
func UpdateBudgetCategory(c *fiber.Ctx) error {
	charityID := c.Params("id")
	categoryID := c.Params("categoryId")
	input := new(BudgetCategoryInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
			"error":   err.Error(),
		})
	}

	// Only charity owner can update budget categories
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can update budget categories",
		})
	}

	// Find budget category
	var budgetCategory models.BudgetCategory
	if err := config.DB.Where("id = ? AND charity_id = ?", categoryID, charityID).First(&budgetCategory).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Budget category not found",
		})
	}

	// Update budget category
	budgetCategory.Name = input.Name
	budgetCategory.Allocation = input.Allocation

	if err := config.DB.Save(&budgetCategory).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update budget category",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   budgetCategory,
	})
}

// DeleteBudgetCategory deletes a budget category
func DeleteBudgetCategory(c *fiber.Ctx) error {
	charityID := c.Params("id")
	categoryID := c.Params("categoryId")

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
		})
	}

	// Only charity owner can delete budget categories
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can delete budget categories",
		})
	}

	// Delete budget category
	if err := config.DB.Where("id = ? AND charity_id = ?", categoryID, charityID).Delete(&models.BudgetCategory{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not delete budget category",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status":  "success",
		"message": "Budget category deleted successfully",
	})
}

// TransferCharityOwnership transfers charity ownership to another user
func TransferCharityOwnership(c *fiber.Ctx) error {
	charityID := c.Params("id")
	input := new(OwnershipTransferInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	// Validate required fields
	if input.NewOwnerID == 0 || input.Email == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "New owner ID and email are required",
		})
	}

	// Check if charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, charityID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
		})
	}

	// Only charity owner can transfer ownership
	userID := c.Locals("userID").(uint)
	if charity.OwnerID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Only the charity owner can transfer ownership",
		})
	}

	// Verify new owner exists
	var newOwner models.User
	if err := config.DB.First(&newOwner, input.NewOwnerID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "New owner not found",
		})
	}

	// Verify email matches
	if newOwner.Email != input.Email {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Email does not match the user",
		})
	}

	// Update charity owner
	charity.OwnerID = input.NewOwnerID

	// Save changes
	if err := config.DB.Save(&charity).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not transfer ownership",
		})
	}

	// Update user role if not already a charity owner
	if newOwner.Role != string(models.RoleCharityOwner) {
		newOwner.Role = string(models.RoleCharityOwner)
		if err := config.DB.Save(&newOwner).Error; err != nil {
			// Log error but continue since the ownership has been transferred
			// We could consider rolling back the ownership transfer here,
			// but for simplicity, we'll just log the error
			fmt.Printf("Error updating new owner role: %v\n", err)
		}
	}

	// Reload charity with owner data
	config.DB.Preload("Owner").First(&charity, charity.ID)

	return c.Status(200).JSON(fiber.Map{
		"status":  "success",
		"data":    charity,
		"message": "Charity ownership transferred successfully",
	})
}
