package routes

import (
	"cleargive/server/controllers"
	"cleargive/server/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupCharityRoutes(router fiber.Router) {
	charities := router.Group("/charities")

	// Public routes
	charities.Get("/", controllers.GetCharities)
	charities.Get("/:id", controllers.GetCharity)

	// Protected routes
	charities.Use(middleware.AuthMiddleware())
	charities.Post("/", controllers.CreateCharity)

	// Multi-signature wallet management
	charities.Patch("/:id/multisig", controllers.UpdateMultiSigSettings)
	charities.Post("/:id/cosigners", controllers.AddCosigner)
	charities.Delete("/:id/cosigners/:cosignerId", controllers.RemoveCosigner)

	// Budget category management
	charities.Post("/:id/budget", controllers.AddBudgetCategory)
	charities.Patch("/:id/budget/:categoryId", controllers.UpdateBudgetCategory)
	charities.Delete("/:id/budget/:categoryId", controllers.DeleteBudgetCategory)

	// Ownership transfer route
	charities.Patch("/:id/transfer-ownership", controllers.TransferCharityOwnership)

	// Transaction approval routes
	charities.Get("/:id/approvals", controllers.GetPendingApprovals)
	charities.Post("/:id/approvals", controllers.CreateTransactionApproval)
	charities.Post("/approvals/:approvalId/sign", controllers.AddApprovalSignature)
	charities.Post("/approvals/:approvalId/execute", controllers.ExecuteApproval)
	charities.Post("/approvals/:approvalId/refund", controllers.RefundUnspentFunds)

	// Milestone management routes
	charities.Get("/approvals/:approvalId/milestones", controllers.GetMilestones)
	charities.Post("/approvals/:approvalId/milestones", controllers.CreateMilestone)
	charities.Patch("/milestones/:milestoneId/complete", controllers.CompleteMilestone)
	charities.Patch("/milestones/:milestoneId/verify", controllers.VerifyMilestone)
	charities.Post("/milestones/:milestoneId/release", controllers.ReleaseMilestoneFunds)
}
