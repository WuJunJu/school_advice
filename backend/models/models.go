package models

import "time"

// AdminUser represents an administrator account
type AdminUser struct {
	ID           uint   `gorm:"primaryKey"`
	Username     string `gorm:"unique;not null"`
	PasswordHash string `gorm:"not null"`
	Role         string `gorm:"not null"` // "super_admin", "department_admin"
	DepartmentID *uint
	Department   Department `gorm:"foreignKey:DepartmentID"`
	CanViewAll   bool       `gorm:"default:false"`
	CreatedAt    time.Time
}

// Suggestion represents a student's suggestion
type Suggestion struct {
	ID             uint   `gorm:"primaryKey"`
	TrackingCode   string `gorm:"unique;not null"`
	Title          string `gorm:"not null"`
	Content        string `gorm:"not null"`
	Category       string
	DepartmentID   uint       `gorm:"not null"`
	Department     Department `gorm:"foreignKey:DepartmentID"`
	SubmitterName  string
	SubmitterClass string
	Status         string `gorm:"not null;default:'待审核'"` // "待审核", "待处理", "处理中", "已解决", "已关闭", "审核不通过"
	IsPublic       bool   `gorm:"default:false"`
	Upvotes        int    `gorm:"default:0"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	Replies        []Reply
}

// Department represents a school department
type Department struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"unique;not null"`
}

// Reply represents an admin's reply to a suggestion
type Reply struct {
	ID           uint      `gorm:"primaryKey"`
	SuggestionID uint      `gorm:"not null"`
	Content      string    `gorm:"not null"`
	ReplierID    uint      `gorm:"not null"` // AdminUser ID
	Replier      AdminUser `gorm:"foreignKey:ReplierID"`
	CreatedAt    time.Time
}
