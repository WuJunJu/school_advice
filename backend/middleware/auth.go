package middleware

import (
	"advice/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Set user claims in context for later use in handlers
		c.Set("user_claims", claims)
		c.Next()
	}
}

func SuperAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get("user_claims")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
			c.Abort()
			return
		}

		adminClaims := claims.(*utils.Claims)
		if adminClaims.Role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "This action requires super admin privileges"})
			c.Abort()
			return
		}

		c.Next()
	}
}
