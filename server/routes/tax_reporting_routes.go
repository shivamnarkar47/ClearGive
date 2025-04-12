package routes

import (
	"cleargive/server/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupTaxReportingRoutes(router fiber.Router) {
	// Tax Reports Routes
	reports := router.Group("/tax-reports")

	// Get all tax reports for a user
	reports.Get("/user/:userId", controllers.GetTaxReports)

	// Get a specific tax report
	reports.Get("/:id", controllers.GetTaxReport)

	// Generate a new tax report
	reports.Post("/", controllers.GenerateTaxReport)

	// Get donations by year for a user (used for tax reporting)
	reports.Get("/user/:userId/year/:year", controllers.GetDonationsByYear)

	// Audit Trail Routes
	audit := router.Group("/audit")

	// Get audit trail for a user
	audit.Get("/user/:userId", controllers.GetAuditTrail)

	// Compliance Routes
	compliance := router.Group("/compliance")

	// Get compliance checks for a user
	compliance.Get("/user/:userId", controllers.GetComplianceChecks)

	// Get compliance checks for a charity
	compliance.Get("/charity/:charityId", controllers.GetCharityComplianceChecks)

	// Run a new compliance check
	compliance.Post("/", controllers.RunComplianceCheck)

	// Update a compliance check
	compliance.Put("/:id", controllers.UpdateComplianceCheck)
}
