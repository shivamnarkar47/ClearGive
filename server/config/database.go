package config

import (
	"cleargive/server/models"
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var err error

	// Create database directory if it doesn't exist
	dbDir := "database"
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatal("Failed to create database directory: ", err)
	}

	// Connect to SQLite database
	dbPath := filepath.Join(dbDir, "cleargive.db")
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Printf("Connected Successfully to SQLite Database at %s", dbPath)

	// Auto Migrate Models
	err = DB.AutoMigrate(&models.Donation{}, &models.Charity{}, &models.BudgetCategory{}, &models.TransactionApproval{}, &models.ApprovalSignature{}, &models.Cosigner{}, &models.Milestone{}, &models.MilestoneVerification{})
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}
}
