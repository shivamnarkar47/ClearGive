package middleware

import (
	"cleargive/server/config"
	"cleargive/server/models"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get the Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{
				"status":  "error",
				"message": "Authorization header is required",
			})
		}

		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid authorization format",
			})
		}

		// The Firebase ID is the token (in a real app, you'd verify the JWT token)
		firebaseID := parts[1]

		// Get user from database
		var user models.User
		if result := config.DB.Where("firebase_id = ?", firebaseID).First(&user); result.Error != nil {
			return c.Status(401).JSON(fiber.Map{
				"status":  "error",
				"message": "Unauthorized",
			})
		}

		// Store user data in context
		c.Locals("userID", user.ID)
		c.Locals("userRole", user.Role)
		c.Locals("firebaseID", user.FirebaseID)
		c.Locals("email", user.Email)

		return c.Next()
	}
}
