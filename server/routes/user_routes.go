package routes

import (
	"cleargive/server/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupUserRoutes(router fiber.Router) {
	users := router.Group("/users")

	// Create a new user
	users.Post("/", controllers.CreateUser)
	
	// Get user by Firebase ID
	users.Get("/:firebase_id", controllers.GetUser)
	
	// Update user's Stellar wallet
	users.Put("/:id", controllers.UpdateUser)
} 