package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"

	"github.com/gofiber/fiber/v2"
)

func GetDonations(c *fiber.Ctx) error {
	var donations []models.Donation
	config.DB.Preload("Charity").Preload("Donor").Find(&donations)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   donations,
	})
}

func GetDonation(c *fiber.Ctx) error {
	id := c.Params("id")
	var donation models.Donation

	if err := config.DB.Preload("Charity").Preload("Donor").First(&donation, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Donation not found",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   donation,
	})
}

func CreateDonation(c *fiber.Ctx) error {
	donation := new(models.Donation)

	if err := c.BodyParser(donation); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Verify charity exists
	var charity models.Charity
	if err := config.DB.First(&charity, donation.CharityID).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Charity not found",
			"error":   err.Error(),
		})
	}

	// Verify donor exists
	var donor models.User
	if err := config.DB.Where("firebase_id = ?", donation.DonorID).First(&donor).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Donor not found",
			"error":   err.Error(),
		})
	}

	// Create donation with proper associations
	if err := config.DB.Create(&donation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to create donation",
			"error":   err.Error(),
		})
	}

	// Load related entities for response
	config.DB.Preload("Charity").Preload("Donor").First(&donation, donation.ID)

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   donation,
	})
}

func UpdateDonation(c *fiber.Ctx) error {
	id := c.Params("id")
	var donation models.Donation

	if err := config.DB.First(&donation, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Donation not found",
		})
	}

	// Store the current values
	oldDonation := donation

	if err := c.BodyParser(&donation); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Ensure donation ID doesn't change
	donation.ID = oldDonation.ID

	// Verify charity exists if charityId changed
	if oldDonation.CharityID != donation.CharityID {
		var charity models.Charity
		if err := config.DB.First(&charity, donation.CharityID).Error; err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Charity not found",
				"error":   err.Error(),
			})
		}
	}

	// Verify donor exists if donorId changed
	if oldDonation.DonorID != donation.DonorID {
		var donor models.User
		if err := config.DB.Where("firebase_id = ?", donation.DonorID).First(&donor).Error; err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Donor not found",
				"error":   err.Error(),
			})
		}
	}

	if err := config.DB.Save(&donation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to update donation",
			"error":   err.Error(),
		})
	}

	// Load related entities for response
	config.DB.Preload("Charity").Preload("Donor").First(&donation, donation.ID)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   donation,
	})
}

func DeleteDonation(c *fiber.Ctx) error {
	id := c.Params("id")
	var donation models.Donation

	if err := config.DB.First(&donation, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Donation not found",
		})
	}

	config.DB.Delete(&donation)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Donation deleted successfully",
	})
}
