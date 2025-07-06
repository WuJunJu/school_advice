package main

import (
	"advice/database"
	_ "advice/docs" // This is required for swag to find your docs
	"advice/router"
)

// @title Student Suggestion API
// @version 1.0
// @description This is an API for a student suggestion system.
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
func main() {
	// Initialize Database
	database.ConnectDatabase()
	database.AutoMigrate()

	// Initialize Router
	r := router.SetupRouter()

	// Start Server
	r.Run() // listens and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
