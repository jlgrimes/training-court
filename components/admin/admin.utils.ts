import { User } from "@supabase/supabase-js";

/**
 * Get admin user IDs from environment variable
 * Falls back to empty array if not configured
 */
function getAdminUserIds(): string[] {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  } else {
    // Client-side - these IDs should be fetched from an API endpoint instead
    // For now, return empty array on client side for security
    return [];
  }
}

export function isUserAnAdmin(userId: string | null | undefined) {
  if (!userId) return false;
  
  const admins = getAdminUserIds();
  return admins.includes(userId);
}

/**
 * Check if user is admin (server-side only)
 * This should be used in server components and API routes
 */
export function isUserAnAdminServer(userId: string | null | undefined) {
  if (!userId) return false;
  
  const admins = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  return admins.includes(userId);
}