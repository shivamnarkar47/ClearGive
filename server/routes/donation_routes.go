package routes

import (
	"cleargive/server/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupDonationRoutes(router fiber.Router) {
	donations := router.Group("/donations")

	// Get all donations
	donations.Get("/", controllers.GetDonations)

	// Get single donation
	donations.Get("/:id", controllers.GetDonation)

	// Create new donation
	donations.Post("/", controllers.CreateDonation)

	// Update donation
	donations.Put("/:id", controllers.UpdateDonation)

	// Delete donation
	donations.Delete("/:id", controllers.DeleteDonation)
}
