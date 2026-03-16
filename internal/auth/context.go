package auth

import "slices"

// Role matches SHOPS_AND_ROLES_SPEC (Root, SuperAdmin, Admin, Affiliate).
type Role string

const (
	RoleRoot       Role = "Root"
	RoleSuperAdmin Role = "SuperAdmin"
	RoleAdmin      Role = "Admin"
	RoleAffiliate  Role = "Affiliate"
)

var validRoles = []Role{RoleRoot, RoleSuperAdmin, RoleAdmin, RoleAffiliate}

// ValidRole returns the role if it is in the allowlist; otherwise (RoleAffiliate, false).
// Caller should reject token when ok is false to enforce Deny by Default (OWASP A01).
func ValidRole(s string) (Role, bool) {
	r := Role(s)
	return r, slices.Contains(validRoles, r)
}

// Tier matches USER_SPEC (free / paid).
type Tier string

const (
	TierFree Tier = "free"
	TierPaid Tier = "paid"
)

var validTiers = []Tier{TierFree, TierPaid}

// ValidTier returns the tier if in allowlist; otherwise TierFree (safe default).
func ValidTier(s string) Tier {
	t := Tier(s)
	if slices.Contains(validTiers, t) {
		return t
	}
	return TierFree
}

// Context is the user context from token/session for each request.
// Middleware must populate this; handlers must not bypass it.
type Context struct {
	UserID    string
	Role      Role
	Tier      Tier
	CompanyID string // legacy
	ShopID    string // empty for Root
	ShopName  string
	DisplayName string
	Permissions []string
}
