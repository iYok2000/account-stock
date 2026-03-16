package model

import (
	"time"

	"gorm.io/gorm"
)

// Shop is the tenant per SHOPS_AND_ROLES_SPEC. Users belong to one shop (shop_id); Root has shop_id null.
type Shop struct {
	ID        string         `gorm:"type:varchar(36);primaryKey" json:"id"`
	CompanyID string         `gorm:"type:varchar(36);not null;index" json:"company_id"`
	Name      string         `gorm:"type:varchar(256);not null" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Shop) TableName() string {
	return "shops"
}
