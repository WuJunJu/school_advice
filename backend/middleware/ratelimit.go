package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	requests = make(map[string][]int64)
	mu       sync.Mutex
)

const (
	limit  = 3
	period = time.Minute
)

func RateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		mu.Lock()
		defer mu.Unlock()

		ip := c.ClientIP()
		now := time.Now().Unix()

		// Clean up old timestamps
		if timestamps, exists := requests[ip]; exists {
			var recentTimestamps []int64
			for _, ts := range timestamps {
				if now-ts < int64(period.Seconds()) {
					recentTimestamps = append(recentTimestamps, ts)
				}
			}
			requests[ip] = recentTimestamps
		}

		// Check limit
		if len(requests[ip]) >= limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "Too many requests. Please try again later."})
			return
		}

		// Add new timestamp
		requests[ip] = append(requests[ip], now)

		c.Next()
	}
}
