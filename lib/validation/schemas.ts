import { z } from 'zod';

// Re-export the API validation schemas for client-side use
export * from '../api/validation/schemas';

// Additional client-side specific schemas
export const clientBattleLogSchema = z.object({
  user: z.string().uuid('Invalid user ID'),
  archetype: z.string().min(1, 'Archetype is required').max(50),
  opp_archetype: z.string().min(1, 'Opponent archetype is required').max(50),
  log: z.string().min(1, 'Battle log cannot be empty'),
  turn_order: z.enum(['1', '2']).describe('Turn order must be 1 or 2'),
  result: z.enum(['W', 'L', 'T']).describe('Result must be Win, Loss, or Tie'),
  format: z.enum(['Standard', 'Expanded', 'Other']).optional(),
});

export const clientTournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required').max(255),
  date_from: z.string().datetime('Invalid date format'),
  date_to: z.string().datetime('Invalid date format').optional(),
  category: z.string().min(1, 'Category is required'),
  placement: z.number().int().positive('Placement must be a positive number').optional(),
  format: z.enum(['Standard', 'Expanded', 'Limited', 'Other']),
  rounds: z.number().int().positive().max(20).optional(),
  deck_archetype: z.string().optional(),
});

export const clientScreenNameSchema = z.object({
  live_screen_name: z.string()
    .min(1, 'Screen name is required')
    .max(50, 'Screen name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Screen name can only contain letters, numbers, underscores, and hyphens'),
});

export const clientFeedbackSchema = z.object({
  feature_name: z.string().min(1, 'Feature name is required').max(100),
  bug_type: z.enum(['bug', 'feature_request', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
});

export const clientPocketMatchSchema = z.object({
  user: z.string().uuid('Invalid user ID'),
  deck: z.string().min(1, 'Deck is required').max(100),
  opp_deck: z.string().min(1, 'Opponent deck is required').max(100),
  result: z.enum(['W', 'L', 'T']).describe('Result must be Win, Loss, or Tie'),
});