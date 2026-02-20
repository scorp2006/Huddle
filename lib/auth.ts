// Role-based access control - 3-Tier Architecture
// Super Admin → Event Organizers → Users

export type UserRole = 'super_admin' | 'event_organizer' | 'user';

/**
 * Check if user is Super Admin (Huddle company admin)
 * Can onboard organizations, see all analytics, full access
 */
export function isSuperAdmin(role: UserRole | null): boolean {
  return role === 'super_admin';
}

/**
 * Check if user is Event Organizer (college/company running an event)
 * Can create rooms, manage their event, see their analytics
 */
export function isEventOrganizer(role: UserRole | null): boolean {
  return role === 'event_organizer';
}

/**
 * Check if user can manage organizations (onboard new events)
 * Only Super Admins
 */
export function canManageOrganizations(role: UserRole | null): boolean {
  return role === 'super_admin';
}

/**
 * Check if user can create rooms
 * Super Admins and Event Organizers
 */
export function canCreateRooms(role: UserRole | null): boolean {
  return role === 'super_admin' || role === 'event_organizer';
}

/**
 * Check if user can approve/reject room members
 * Super Admins and Event Organizers
 */
export function canApproveMembers(role: UserRole | null): boolean {
  return role === 'super_admin' || role === 'event_organizer';
}

/**
 * Check if user can view analytics
 * Super Admins (all events) and Event Organizers (their events)
 */
export function canViewAnalytics(role: UserRole | null): boolean {
  return role === 'super_admin' || role === 'event_organizer';
}

/**
 * Check if user can manage room classifications (custom roles)
 * Super Admins and Event Organizers
 */
export function canManageClassifications(role: UserRole | null): boolean {
  return role === 'super_admin' || role === 'event_organizer';
}
