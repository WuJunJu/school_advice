package handlers

import (
	"advice/database"
	"advice/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DepartmentInput struct {
	Name string `json:"name" binding:"required"`
}

// GetDepartments godoc
// @Summary Get all departments
// @Description Get a list of all available departments.
// @Tags departments
// @Produce  json
// @Success 200 {array} models.Department
// @Router /departments [get]
// @Router /admin/departments [get]
func GetDepartments(c *gin.Context) {
	var departments []models.Department
	if err := database.DB.Find(&departments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve departments"})
		return
	}
	c.JSON(http.StatusOK, departments)
}

// CreateDepartment godoc
// @Summary Create a new department
// @Description Add a new department.
// @Tags admin-departments
// @Security ApiKeyAuth
// @Accept  json
// @Produce  json
// @Param department body DepartmentInput true "Department Name"
// @Success 200 {object} models.Department
// @Router /admin/departments [post]
func CreateDepartment(c *gin.Context) {
	var input DepartmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	department := models.Department{Name: input.Name}
	if err := database.DB.Create(&department).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create department"})
		return
	}
	c.JSON(http.StatusOK, department)
}

// UpdateDepartment godoc
// @Summary Update a department
// @Description Update an existing department's name.
// @Tags admin-departments
// @Security ApiKeyAuth
// @Accept  json
// @Produce  json
// @Param id path int true "Department ID"
// @Param department body DepartmentInput true "New Department Name"
// @Success 200 {object} models.Department
// @Router /admin/departments/{id} [put]
func UpdateDepartment(c *gin.Context) {
	departmentID := c.Param("id")
	var input DepartmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var department models.Department
	if err := database.DB.First(&department, departmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Department not found"})
		return
	}

	department.Name = input.Name
	if err := database.DB.Save(&department).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update department"})
		return
	}
	c.JSON(http.StatusOK, department)
}

// DeleteDepartment godoc
// @Summary Delete a department
// @Description Remove a department.
// @Tags admin-departments
// @Security ApiKeyAuth
// @Param id path int true "Department ID"
// @Success 204
// @Router /admin/departments/{id} [delete]
func DeleteDepartment(c *gin.Context) {
	departmentID := c.Param("id")

	// Check if any admin user is assigned to this department before deleting
	var count int64
	database.DB.Model(&models.AdminUser{}).Where("department_id = ?", departmentID).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete department with assigned admin users"})
		return
	}

	if err := database.DB.Delete(&models.Department{}, departmentID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete department"})
		return
	}
	c.Status(http.StatusNoContent)
}
