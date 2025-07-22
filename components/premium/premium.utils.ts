/**
 * Get premium user IDs from environment variable
 * Falls back to empty array if not configured
 */
function getPremiumUserIds(): string[] {
  if (typeof window === 'undefined') {
    // Server-side
    const premiumIds = process.env.PREMIUM_USER_IDS?.split(',').map(id => id.trim()) || [];
    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    // Admins are automatically premium users
    return Array.from(new Set([...premiumIds, ...adminIds]));
  } else {
    // Client-side - these IDs should be fetched from an API endpoint instead
    // For now, return empty array on client side for security
    return [];
  }
}

export function isPremiumUser(userId: string | null | undefined) {
  if (!userId) return false;
  
  const premiumUsers = getPremiumUserIds();
  return premiumUsers.includes(userId);
}

/**
 * Check if user is premium (server-side only)
 * This should be used in server components and API routes
 */
export function isPremiumUserServer(userId: string | null | undefined) {
  if (!userId) return false;
  
  const premiumIds = process.env.PREMIUM_USER_IDS?.split(',').map(id => id.trim()) || [];
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  const allPremiumUsers = Array.from(new Set([...premiumIds, ...adminIds]));
  
  return allPremiumUsers.includes(userId);
}