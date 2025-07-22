import { z } from 'zod';

// Common schemas
export const userIdSchema = z.string().uuid('Invalid user ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Battle logs schemas
export const battleLogSchema = z.object({
  log: z.string().min(1, 'Battle log cannot be empty'),
  archetype: z.string().optional(),
  opp_archetype: z.string().optional(),
  turn_order: z.enum(['1', '2']).optional(),
  result: z.enum(['W', 'L', 'T']).optional(),
  live_screen_name: z.string().optional(),
  opp_name: z.string().optional(),
});

export const updateBattleLogSchema = z.object({
  id: z.string().uuid('Invalid battle log ID'),
  ...battleLogSchema.shape,
});

// Tournament schemas
export const tournamentSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.string().datetime(),
  format: z.enum(['Standard', 'Expanded', 'Limited', 'Other']),
  rounds: z.number().int().positive().max(20),
  deck_archetype: z.string().optional(),
  placement: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

// User data schemas
export const updateUserDataSchema = z.object({
  live_screen_name: z.string().min(1).max(50).optional(),
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

// Stats query schemas
export const statsQuerySchema = z.object({
  user_id: userIdSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  format: z.enum(['Standard', 'Expanded', 'Limited', 'Other', 'all']).optional(),
});

// Deck schemas
export const deckSchema = z.object({
  name: z.string().min(1).max(100),
  archetype: z.string().min(1).max(50),
  format: z.enum(['Standard', 'Expanded']),
  list: z.string().optional(),
  notes: z.string().optional(),
  is_public: z.boolean().default(false),
});

// Admin schemas
export const adminActionSchema = z.object({
  action: z.enum(['ban_user', 'unban_user', 'delete_content', 'update_role']),
  target_user_id: userIdSchema,
  reason: z.string().min(1).max(500),
  metadata: z.record(z.any()).optional(),
});

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.number(),
  details: z.any().optional(),
});

// Success response schema
export const successResponseSchema = z.object({
  data: z.any(),
  code: z.number().default(200),
  message: z.string().optional(),
});