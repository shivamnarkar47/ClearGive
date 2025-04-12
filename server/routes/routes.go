package routes

import (
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes configures all application routes
func SetupRoutes(app *fiber.App) {
	// API routes
	api := app.Group("/api")

	// Setup specific route groups
	SetupUserRoutes(api)
	SetupCharityRoutes(api)
	SetupDonationRoutes(api)
	SetupCertificateRoutes(api)
	SetupTaxReportingRoutes(api)
}
