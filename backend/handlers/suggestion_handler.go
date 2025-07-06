package handlers

import (
	"advice/database"
	"advice/models"
	"advice/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SuggestionInput struct {
	Title          string `json:"title" binding:"required"`
	Content        string `json:"content" binding:"required"`
	Category       string `json:"category"`
	DepartmentID   uint   `json:"department_id"`
	SubmitterName  string `json:"submitter_name"`
	SubmitterClass string `json:"submitter_class"`
	IsPublic       bool   `json:"is_public"`
}

// SubmitSuggestion godoc
// @Summary Submit a new suggestion
// @Description Add a new suggestion to the system.
// @Tags suggestions
// @Accept  json
// @Produce  json
// @Param suggestion body SuggestionInput true "Suggestion Submission"
// @Success 200 {object} map[string]string
// @Router /suggestions [post]
func SubmitSuggestion(c *gin.Context) {
	var input SuggestionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(input.Content) > 3000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "建议内容不能超过3000个字符"})
		return
	}
	if len(input.Title) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "建议标题不能超过100个字符"})
		return
	}

	var suggestion models.Suggestion
	if input.DepartmentID == 0 {
		// 0 represents all departments
		suggestion.DepartmentID = nil
	} else {
		// Validate DepartmentID exists
		var department models.Department
		if err := database.DB.First(&department, input.DepartmentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid department ID"})
			return
		}
		suggestion.DepartmentID = &input.DepartmentID
	}

	suggestion.Title = input.Title
	suggestion.Content = input.Content
	suggestion.Category = input.Category
	suggestion.SubmitterName = input.SubmitterName
	suggestion.SubmitterClass = input.SubmitterClass
	suggestion.Status = "待审核"
	suggestion.TrackingCode = utils.GenerateTrackingCode(6)
	suggestion.IsPublic = input.IsPublic

	if err := database.DB.Create(&suggestion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create suggestion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tracking_code": suggestion.TrackingCode})
}

// GetSuggestionByTrackingCode godoc
// @Summary Get suggestion by tracking code
// @Description Get details of a suggestion using its tracking code.
// @Tags suggestions
// @Produce  json
// @Param   tracking_code     path    string     true        "Suggestion Tracking Code"
// @Success 200 {object} models.Suggestion
// @Router /suggestions/{tracking_code} [get]
func GetSuggestionByTrackingCode(c *gin.Context) {
	trackingCode := c.Param("tracking_code")

	var suggestion models.Suggestion
	if err := database.DB.Preload("Department").Preload("Replies").Preload("Replies.Replier").Where("tracking_code = ?", trackingCode).First(&suggestion).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Suggestion not found"})
		return
	}

	// Do not show replier's password hash
	for i := range suggestion.Replies {
		suggestion.Replies[i].Replier.PasswordHash = ""
	}

	c.JSON(http.StatusOK, suggestion)
}

// GetPublicSuggestions godoc
// @Summary Get public suggestions
// @Description Get a paginated list of public suggestions.
// @Tags suggestions
// @Produce  json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Param department_id query int false "Department ID"
// @Success 200 {object} map[string]interface{}
// @Router /suggestions [get]
func GetPublicSuggestions(c *gin.Context) {
	// Pagination
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize <= 0 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	// Query
	query := database.DB.Model(&models.Suggestion{}).
		Preload("Department").
		Preload("Replies").
		Preload("Replies.Replier").
		Where("is_public = ?", true).
		Where("status NOT IN (?)", []string{"待审核", "审核不通过"}).
		Order("created_at DESC")

	// Filtering
	if departmentID := c.Query("department_id"); departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}

	var suggestions []models.Suggestion
	var total int64

	query.Count(&total)
	if err := query.Limit(pageSize).Offset(offset).Find(&suggestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve suggestions"})
		return
	}

	// Do not show replier's password hash
	for i := range suggestions {
		for j := range suggestions[i].Replies {
			suggestions[i].Replies[j].Replier.PasswordHash = ""
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
		"data":      suggestions,
	})
}

// UpvoteSuggestion godoc
// @Summary Upvote a suggestion
// @Description Increment the upvote count for a suggestion.
// @Tags suggestions
// @Produce  json
// @Param   id     path    int     true        "Suggestion ID"
// @Success 200 {object} map[string]int
// @Router /suggestions/{id}/upvote [post]
func UpvoteSuggestion(c *gin.Context) {
	suggestionID := c.Param("id")

	var suggestion models.Suggestion
	if err := database.DB.First(&suggestion, suggestionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Suggestion not found"})
		return
	}

	suggestion.Upvotes++
	if err := database.DB.Save(&suggestion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upvote suggestion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"upvotes": suggestion.Upvotes})
}

// DeleteSuggestions godoc
// @Summary Delete suggestions by ID
// @Description Delete one or more suggestions by their IDs
// @Tags admin
// @Accept  json
// @Produce  json
// @Param   body body object{ids=[]int} true "Array of suggestion IDs to delete"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/suggestions [delete]
func DeleteSuggestions(c *gin.Context) {
	var requestBody struct {
		IDs []uint `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(requestBody.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Suggestion IDs cannot be empty"})
		return
	}

	// Also delete associated replies
	if err := database.DB.Where("suggestion_id IN ?", requestBody.IDs).Delete(&models.Reply{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete associated replies"})
		return
	}

	if err := database.DB.Where("id IN ?", requestBody.IDs).Delete(&models.Suggestion{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete suggestions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Suggestions and associated replies deleted successfully"})
}
