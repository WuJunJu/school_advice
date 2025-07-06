package router

import (
	"advice/handlers"
	"advice/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS Middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"} // Adjust for your frontend URL
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API v1 group
	api := r.Group("/api/v1")
	{
		// Student facing routes
		api.GET("/departments", handlers.GetDepartments)                             // Public endpoint for departments
		api.POST("/suggestions", handlers.SubmitSuggestion)                          // Submit a new suggestion
		api.GET("/suggestions/:tracking_code", handlers.GetSuggestionByTrackingCode) // Get suggestion status by tracking code
		api.GET("/suggestions", handlers.GetPublicSuggestions)                       // Get all public suggestions
		api.POST("/suggestions/:id/upvote", handlers.UpvoteSuggestion)               // Upvote a suggestion

		// Admin routes
		admin := api.Group("/admin")
		{
			admin.POST("/login", handlers.Login)

			authed := admin.Group("/")
			authed.Use(middleware.AuthMiddleware())
			{
				authed.GET("/dashboard/stats", handlers.GetDashboardStats)
				authed.GET("/suggestions", handlers.GetAllSuggestions)
				authed.GET("/suggestions/:id", handlers.GetSuggestionByID)
				authed.PUT("/suggestions/:id/status", handlers.UpdateSuggestionStatus)
				authed.POST("/suggestions/:id/replies", handlers.AddReply)

				super := authed.Group("/")
				super.Use(middleware.SuperAdminMiddleware())
				{
					// Admin User Management
					super.GET("/users", handlers.GetAdmins)
					super.POST("/users", handlers.CreateAdmin)
					super.PUT("/users/:id", handlers.UpdateAdmin)
					super.DELETE("/users/:id", handlers.DeleteAdmin)

					// Department Management
					super.GET("/departments", handlers.GetDepartments)
					super.POST("/departments", handlers.CreateDepartment)
					super.PUT("/departments/:id", handlers.UpdateDepartment)
					super.DELETE("/departments/:id", handlers.DeleteDepartment)
				}
			}
		}
	}

	return r
}
