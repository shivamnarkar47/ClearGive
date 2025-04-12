package controllers

import (
	"cleargive/server/config"
	"cleargive/server/models"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetTaxReports retrieves all tax reports for a user
func GetTaxReports(c *fiber.Ctx) error {
	userID := c.Params("userId")
	if userID == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "User ID is required",
		})
	}

	var reports []models.TaxReport
	if err := config.DB.Where("user_id = ?", userID).Order("year desc").Find(&reports).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch tax reports",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   reports,
	})
}

// GetTaxReport retrieves a specific tax report
func GetTaxReport(c *fiber.Ctx) error {
	reportID := c.Params("id")
	var report models.TaxReport

	if err := config.DB.First(&report, reportID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Tax report not found",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   report,
	})
}

// GenerateTaxReport creates a new tax report for a user based on their donations
func GenerateTaxReport(c *fiber.Ctx) error {
	type TaxReportInput struct {
		UserID string `json:"userId"`
		Year   int    `json:"year"`
	}

	input := new(TaxReportInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	// Check if the user exists
	var user models.User
	if err := config.DB.Where("firebase_id = ?", input.UserID).First(&user).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "User not found",
		})
	}

	// Check for existing reports for this year
	var existingReport models.TaxReport
	if err := config.DB.Where("user_id = ? AND year = ?", input.UserID, input.Year).First(&existingReport).Error; err == nil {
		// Report exists, return it
		return c.JSON(fiber.Map{
			"status":  "success",
			"message": "Tax report already exists for this year",
			"data":    existingReport,
		})
	}

	// Calculate total donations for the year
	var donations []models.Donation
	startDate := time.Date(input.Year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(input.Year+1, 1, 1, 0, 0, 0, 0, time.UTC)

	if err := config.DB.Where("donor_id = ? AND created_at BETWEEN ? AND ?", input.UserID, startDate, endDate).Find(&donations).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch donations",
			"error":   err.Error(),
		})
	}

	var totalDonations float64
	for _, donation := range donations {
		amount, err := strconv.ParseFloat(donation.Amount, 64)
		if err == nil {
			totalDonations += amount
		}
	}

	// Create the tax report
	report := models.TaxReport{
		UserID:         input.UserID,
		Year:           input.Year,
		TotalDonations: totalDonations,
		Status:         "ready",
		GeneratedAt:    time.Now(),
		FileURL:        fmt.Sprintf("/api/tax-reports/%d/%d/download", input.Year, time.Now().Unix()),
	}

	if err := config.DB.Create(&report).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create tax report",
			"error":   err.Error(),
		})
	}

	// Log the action in audit trail
	auditRecord := models.AuditRecord{
		UserID:    input.UserID,
		Event:     "Tax Report Generated",
		Details:   fmt.Sprintf("Tax report for year %d was generated", input.Year),
		Timestamp: time.Now(),
	}
	config.DB.Create(&auditRecord)

	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   report,
	})
}

// GetAuditTrail retrieves audit records for a user
func GetAuditTrail(c *fiber.Ctx) error {
	userID := c.Params("userId")
	if userID == "" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "User ID is required",
		})
	}

	var records []models.AuditRecord
	if err := config.DB.Where("user_id = ?", userID).Order("timestamp desc").Find(&records).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch audit records",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   records,
	})
}

// GetDonationsByYear retrieves donations for a user filtered by year
func GetDonationsByYear(c *fiber.Ctx) error {
	userID := c.Params("userId")
	yearStr := c.Params("year")
	year, err := strconv.Atoi(yearStr)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid year format",
		})
	}

	startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)

	var donations []models.Donation
	if err := config.DB.Preload("Charity").Where("donor_id = ? AND created_at BETWEEN ? AND ?", userID, startDate, endDate).Find(&donations).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not fetch donations",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   donations,
	})
}
