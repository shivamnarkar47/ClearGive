package routes

import (
	"cleargive/server/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupCertificateRoutes(router fiber.Router) {
	certificates := router.Group("/certificates")

	certificates.Post("/", controllers.GenerateCertificate)

	certificates.Get("/:id", controllers.GetCertificate)

	certificates.Get("/token/:tokenId", controllers.GetCertificateByToken)

	certificates.Get("/:tokenId/metadata", controllers.GetCertificateMetadata)

	certificates.Get("/user/:userId", controllers.GetUserCertificates)

	certificates.Get("/verify/:tokenId", controllers.VerifyCertificate)
}
