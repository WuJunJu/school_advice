package database

import (
	"advice/models"
	"advice/utils"
	"log"

	"github.com/glebarez/sqlite" // Pure go
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	var err error
	DB, err = gorm.Open(sqlite.Open("advice.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
}

func AutoMigrate() {
	err := DB.AutoMigrate(&models.AdminUser{}, &models.Suggestion{}, &models.Department{}, &models.Reply{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Seed initial data
	seedDepartments()
	seedAdmin()
}

func seedDepartments() {
	var count int64
	DB.Model(&models.Department{}).Count(&count)
	if count == 0 {
		departments := []models.Department{
			{Name: "教务处"},
			{Name: "后勤保障部"},
			{Name: "学生工作处"},
		}
		if err := DB.Create(&departments).Error; err != nil {
			log.Fatal("Failed to seed departments:", err)
		}
	}
}

func seedAdmin() {
	var count int64
	DB.Model(&models.AdminUser{}).Where("role = ?", "super_admin").Count(&count)
	if count == 0 {
		hashedPassword, err := utils.HashPassword("password123")
		if err != nil {
			log.Fatal("Failed to hash admin password:", err)
		}
		admin := models.AdminUser{
			Username:     "superadmin",
			PasswordHash: hashedPassword,
			Role:         "super_admin",
			CanViewAll:   true,
		}
		if err := DB.Create(&admin).Error; err != nil {
			log.Fatal("Failed to seed super admin:", err)
		}
	}
}
