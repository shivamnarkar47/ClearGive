package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"

	"github.com/gofiber/fiber/v2"
)

type CreateUserInput struct {
	FirebaseID string `json:"firebase_id"`
	Email      string `json:"email"`
	Role       string `json:"role"`
}

func CreateUser(c *fiber.Ctx) error {
	input := new(CreateUserInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	// Validate required fields
	if input.FirebaseID == "" || input.Email == "" || input.Role == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "FirebaseID, email, and role are required",
		})
	}

	// Check if user already exists
	var existingUser models.User
	if result := config.DB.Where("firebase_id = ?", input.FirebaseID).First(&existingUser); result.Error == nil {
		return c.Status(409).JSON(fiber.Map{
			"status":  "error",
			"message": "User already exists",
			"data":    existingUser,
		})
	}

	// Create new user
	user := models.User{
		FirebaseID: input.FirebaseID,
		Email:      input.Email,
		Role:       input.Role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create user",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   user,
	})
}

// GetUser gets a user by their Firebase ID
func GetUser(c *fiber.Ctx) error {
	firebaseID := c.Params("firebase_id")

	if firebaseID == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Firebase ID is required",
		})
	}

	var user models.User
	if result := config.DB.Where("firebase_id = ?", firebaseID).First(&user); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "User not found",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   user,
	})
}

type UpdateUserInput struct {
	StellarWallet models.StellarAccount `json:"stellarWallet"`
}

func UpdateUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	input := new(UpdateUserInput)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	var user models.User
	if result := config.DB.First(&user, userID); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "User not found",
		})
	}

	// Update user's Stellar wallet
	user.StellarWallet = input.StellarWallet

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update user",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"status": "success",
		"data":   user,
	})
} 