package handlers

import (
	"advice/database"
	"advice/models"
	"advice/utils"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login godoc
// @Summary Admin login
// @Description Authenticate an admin user and return a JWT.
// @Tags admin
// @Accept  json
// @Produce  json
// @Param credentials body LoginInput true "Login Credentials"
// @Success 200 {object} map[string]string
// @Router /admin/login [post]
func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.AdminUser
	if err := database.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !utils.CheckPasswordHash(input.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	var deptID uint
	if user.DepartmentID != nil {
		deptID = *user.DepartmentID
	}

	token, err := utils.GenerateJWT(user.ID, user.Username, user.Role, deptID, user.CanViewAll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

// GetAllSuggestions godoc
// @Summary Get all suggestions (for admins)
// @Description Get a paginated list of all suggestions, with filters.
// @Tags admin-suggestions
// @Security ApiKeyAuth
// @Produce  json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Param status query string false "Filter by status"
// @Param department_id query int false "Filter by department ID"
// @Success 200 {object} map[string]interface{}
// @Router /admin/suggestions [get]
func GetAllSuggestions(c *gin.Context) {
	claims, _ := c.Get("user_claims")
	adminClaims := claims.(*utils.Claims)

	// Pagination
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "10")
	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	// Query
	query := database.DB.Model(&models.Suggestion{}).Preload("Department").Order("created_at DESC")

	// Authorization: Department admins can only see their department's suggestions unless CanViewAll is true
	if adminClaims.Role == "department_admin" && !adminClaims.CanViewAll {
		query = query.Where("department_id = ?", adminClaims.DepartmentID)
	}

	// Filtering
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if departmentID := c.Query("department_id"); departmentID != "" {
		// Super admins or admins with CanViewAll can filter by any department
		if adminClaims.Role == "super_admin" || adminClaims.CanViewAll {
			query = query.Where("department_id = ?", departmentID)
		}
	}

	var suggestions []models.Suggestion
	var total int64
	query.Count(&total)
	if err := query.Limit(pageSize).Offset(offset).Find(&suggestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve suggestions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
		"data":      suggestions,
	})
}

// getSuggestionAndCheckAuth is a helper to get a suggestion and check if the admin is authorized to access it
func getSuggestionAndCheckAuth(c *gin.Context) (*models.Suggestion, error) {
	suggestionID := c.Param("id")
	claims, _ := c.Get("user_claims")
	adminClaims := claims.(*utils.Claims)

	var suggestion models.Suggestion
	if err := database.DB.First(&suggestion, suggestionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Suggestion not found"})
		return nil, err
	}

	// Authorization check
	if adminClaims.Role == "department_admin" && !adminClaims.CanViewAll && suggestion.DepartmentID != adminClaims.DepartmentID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to access this suggestion"})
		return nil, errors.New("unauthorized")
	}

	// Preload details
	if err := database.DB.Preload("Department").Preload("Replies").Preload("Replies.Replier").First(&suggestion).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Suggestion not found after auth check"})
		return nil, err
	}

	return &suggestion, nil
}

// GetSuggestionByID godoc
// @Summary Get suggestion by ID (for admins)
// @Description Get full details of a suggestion by its ID.
// @Tags admin-suggestions
// @Security ApiKeyAuth
// @Produce  json
// @Param id path int true "Suggestion ID"
// @Success 200 {object} models.Suggestion
// @Router /admin/suggestions/{id} [get]
func GetSuggestionByID(c *gin.Context) {
	suggestion, err := getSuggestionAndCheckAuth(c)
	if err != nil {
		return // Error response is already sent by the helper
	}

	// Sanitize replier info
	for i := range suggestion.Replies {
		suggestion.Replies[i].Replier.PasswordHash = ""
	}

	c.JSON(http.StatusOK, suggestion)
}

type UpdateStatusInput struct {
	Status string `json:"status" binding:"required"`
}

// UpdateSuggestionStatus godoc
// @Summary Update suggestion status
// @Description Change the status of a suggestion.
// @Tags admin-suggestions
// @Security ApiKeyAuth
// @Accept  json
// @Produce  json
// @Param id path int true "Suggestion ID"
// @Param status body UpdateStatusInput true "New Status"
// @Success 200 {object} models.Suggestion
// @Router /admin/suggestions/{id}/status [put]
func UpdateSuggestionStatus(c *gin.Context) {
	var input UpdateStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	suggestion, err := getSuggestionAndCheckAuth(c)
	if err != nil {
		return // Error response is already sent by the helper
	}

	suggestion.Status = input.Status
	if err := database.DB.Save(&suggestion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, suggestion)
}

type ReplyInput struct {
	Content string `json:"content" binding:"required"`
}

// AddReply godoc
// @Summary Add a reply to a suggestion
// @Description Post an official reply to a suggestion.
// @Tags admin-suggestions
// @Security ApiKeyAuth
// @Accept  json
// @Produce  json
// @Param id path int true "Suggestion ID"
// @Param reply body ReplyInput true "Reply Content"
// @Success 200 {object} models.Reply
// @Router /admin/suggestions/{id}/replies [post]
func AddReply(c *gin.Context) {
	var input ReplyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	suggestion, err := getSuggestionAndCheckAuth(c)
	if err != nil {
		return // Error response is already sent by the helper
	}

	claims, _ := c.Get("user_claims")
	adminClaims := claims.(*utils.Claims)

	reply := models.Reply{
		SuggestionID: suggestion.ID,
		Content:      input.Content,
		ReplierID:    adminClaims.UserID,
	}

	if err := database.DB.Create(&reply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add reply"})
		return
	}

	c.JSON(http.StatusOK, reply)
}

// --- Super Admin Handlers ---

type CreateAdminInput struct {
	Username     string `json:"username" binding:"required"`
	Password     string `json:"password" binding:"required"`
	Role         string `json:"role" binding:"required"`
	DepartmentID *uint  `json:"department_id"`
	CanViewAll   bool   `json:"can_view_all"`
}

// CreateAdmin godoc
// @Summary Create a new admin user
// @Description Add a new department admin account.
// @Tags admin-users
// @Security ApiKeyAuth
// @Accept  json
// @Produce  json
// @Param admin body CreateAdminInput true "Admin Creation"
// @Success 200 {object} models.AdminUser
// @Router /admin/users [post]
func CreateAdmin(c *gin.Context) {
	var input CreateAdminInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validation
	if input.Role == "department_admin" && input.DepartmentID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Department ID is required for department admins"})
		return
	}
	if input.Role == "super_admin" {
		input.DepartmentID = nil // Super admins are not tied to a department
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Validate DepartmentID exists if provided
	if input.DepartmentID != nil {
		var department models.Department
		if err := database.DB.First(&department, *input.DepartmentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid department ID"})
			return
		}
	}

	admin := models.AdminUser{
		Username:     input.Username,
		PasswordHash: hashedPassword,
		Role:         input.Role,
		DepartmentID: input.DepartmentID,
		CanViewAll:   input.CanViewAll,
	}

	if err := database.DB.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin user"})
		return
	}

	admin.PasswordHash = "" // Don't return hash
	c.JSON(http.StatusOK, admin)
}

// GetAdmins godoc
// @Summary Get all admin users
// @Description Get a list of all admin accounts.
// @Tags admin-users
// @Security ApiKeyAuth
// @Produce  json
// @Success 200 {array} models.AdminUser
// @Router /admin/users [get]
func GetAdmins(c *gin.Context) {
	var admins []models.AdminUser
	if err := database.DB.Preload("Department").Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve admins"})
		return
	}

	// Don't return password hashes
	for i := range admins {
		admins[i].PasswordHash = ""
	}

	c.JSON(http.StatusOK, admins)
}

type UpdateAdminInput struct {
	Role         string `json:"role"`
	DepartmentID *uint  `json:"department_id"`
	CanViewAll   *bool  `json:"can_view_all"`
}

// UpdateAdmin godoc
// @Summary Update an admin user
// @Description Update a department admin's details.
// @Tags admin-users
// @Security ApiKeyAuth
// @Accept  json
// @Produce  json
// @Param id path int true "Admin ID"
// @Param update body UpdateAdminInput true "Admin Update Data"
// @Success 200 {object} models.AdminUser
// @Router /admin/users/{id} [put]
func UpdateAdmin(c *gin.Context) {
	adminID := c.Param("id")

	// Prevent editing the initial superadmin
	if adminID == "1" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot edit the root super admin"})
		return
	}

	var input UpdateAdminInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var admin models.AdminUser
	if err := database.DB.First(&admin, adminID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin user not found"})
		return
	}

	// Update Role if provided
	if input.Role != "" {
		admin.Role = input.Role
	}

	// Update DepartmentID - logic depends on Role
	if admin.Role == "super_admin" {
		admin.DepartmentID = nil // Unset department for super admins
	} else if admin.Role == "department_admin" {
		if input.DepartmentID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Department ID is required for department admins"})
			return
		}
		// Validate DepartmentID if provided
		var department models.Department
		if err := database.DB.First(&department, *input.DepartmentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid department ID"})
			return
		}
		admin.DepartmentID = input.DepartmentID
	}

	// Update CanViewAll if provided
	if input.CanViewAll != nil {
		admin.CanViewAll = *input.CanViewAll
	}

	if err := database.DB.Save(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin user"})
		return
	}

	// Refetch to get department data
	database.DB.Preload("Department").First(&admin, adminID)

	admin.PasswordHash = ""
	c.JSON(http.StatusOK, admin)
}

// DeleteAdmin godoc
// @Summary Delete an admin user
// @Description Remove a department admin account.
// @Tags admin-users
// @Security ApiKeyAuth
// @Param id path int true "Admin ID"
// @Success 204
// @Router /admin/users/{id} [delete]
func DeleteAdmin(c *gin.Context) {
	adminID := c.Param("id")

	// Prevent deleting the initial superadmin
	if adminID == "1" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete the root super admin"})
		return
	}

	if err := database.DB.Delete(&models.AdminUser{}, adminID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete admin user"})
		return
	}

	c.Status(http.StatusNoContent)
}

type DashboardStats struct {
	TotalSuggestions      int64                       `json:"total_suggestions"`
	PendingSuggestions    int64                       `json:"pending_suggestions"`
	ProcessingSuggestions int64                       `json:"processing_suggestions"`
	ResolvedSuggestions   int64                       `json:"resolved_suggestions"`
	ResolutionRate        float64                     `json:"resolution_rate"`
	WeeklyTrend           []DailyTrend                `json:"weekly_trend"`
	SuggestionsByDept     []DepartmentSuggestionCount `json:"suggestions_by_dept"`
}

type DailyTrend struct {
	Date     string `json:"date"`
	New      int    `json:"new"`
	Resolved int    `json:"resolved"`
}

type DepartmentSuggestionCount struct {
	DepartmentName string `json:"department_name"`
	Count          int    `json:"count"`
}

// GetDashboardStats godoc
// @Summary Get dashboard statistics
// @Description Retrieve aggregated statistics for the admin dashboard.
// @Tags admin-dashboard
// @Security ApiKeyAuth
// @Produce  json
// @Success 200 {object} DashboardStats
// @Router /admin/dashboard/stats [get]
func GetDashboardStats(c *gin.Context) {
	var total, pending, processing, resolved int64

	db := database.DB
	db.Model(&models.Suggestion{}).Count(&total)
	db.Model(&models.Suggestion{}).Where("status = ?", "待审核").Count(&pending)
	db.Model(&models.Suggestion{}).Where("status = ?", "处理中").Count(&processing)
	db.Model(&models.Suggestion{}).Where("status = ?", "已解决").Count(&resolved)

	var rate float64
	if total > 0 {
		rate = (float64(resolved) / float64(total)) * 100
	}

	// Weekly Trend
	var weeklyTrend []DailyTrend
	// This is a simplified example. A real-world scenario might need more complex SQL
	// to handle different database dialects for date functions.
	// We'll query for the last 7 days.
	// For simplicity, this example uses raw SQL. Be cautious with this in production.
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)

	// Using a more robust SQL query that works across different DBs (e.g. SQLite, Postgres)
	// by creating a series of dates and left joining our suggestion data.
	// This is still complex, and for a real app a dedicated time-series table might be better.
	// NOTE: This query is a bit complex and might need adjustments based on the exact SQL dialect.
	// This example is a conceptual representation. For sqlite, generating series is tricky.
	// We will simplify and do two queries for now.

	var newSuggestions []struct {
		Date  string `gorm:"column:date"`
		Count int
	}
	db.Model(&models.Suggestion{}).
		Select("date(created_at) as date, count(*) as count").
		Where("created_at >= ?", sevenDaysAgo).
		Group("date(created_at)").
		Order("date ASC").
		Scan(&newSuggestions)

	var resolvedSuggestions []struct {
		Date  string `gorm:"column:date"`
		Count int
	}
	db.Model(&models.Suggestion{}).
		Select("date(updated_at) as date, count(*) as count").
		Where("status = ? AND updated_at >= ?", "已解决", sevenDaysAgo).
		Group("date(updated_at)").
		Order("date ASC").
		Scan(&resolvedSuggestions)

	// Combine results in Go
	trendMap := make(map[string]*DailyTrend)
	for d := 0; d < 7; d++ {
		day := time.Now().AddDate(0, 0, -d)
		dayStr := day.Format("2006-01-02")
		trendMap[dayStr] = &DailyTrend{Date: dayStr, New: 0, Resolved: 0}
	}

	for _, s := range newSuggestions {
		if trend, ok := trendMap[s.Date]; ok {
			trend.New = s.Count
		}
	}
	for _, s := range resolvedSuggestions {
		if trend, ok := trendMap[s.Date]; ok {
			trend.Resolved = s.Count
		}
	}

	for _, trend := range trendMap {
		weeklyTrend = append(weeklyTrend, *trend)
	}

	// Suggestions by Department
	type DeptCountResult struct {
		Name  string
		Count int
	}
	var deptCounts []DeptCountResult
	db.Table("suggestions").
		Select("departments.name, count(suggestions.id) as count").
		Joins("join departments on departments.id = suggestions.department_id").
		Group("departments.name").
		Order("count DESC").
		Scan(&deptCounts)

	var suggestionsByDept []DepartmentSuggestionCount
	for _, row := range deptCounts {
		suggestionsByDept = append(suggestionsByDept, DepartmentSuggestionCount{
			DepartmentName: row.Name,
			Count:          row.Count,
		})
	}

	stats := DashboardStats{
		TotalSuggestions:      total,
		PendingSuggestions:    pending,
		ProcessingSuggestions: processing,
		ResolvedSuggestions:   resolved,
		ResolutionRate:        rate,
		WeeklyTrend:           weeklyTrend,
		SuggestionsByDept:     suggestionsByDept,
	}

	c.JSON(http.StatusOK, stats)
}
