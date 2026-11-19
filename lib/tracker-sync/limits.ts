/**
 * Shared limits for tracker sync. Kept free of server imports so the client can
 * show the same number the server enforces.
 */

/** Matches the tracker's own ceiling of ten destinations per install. */
export const MAX_TRACKER_CREDENTIALS = 10;

/** Per credential, per fixed one-hour window (`window_started_at`). */
export const TRACKER_REQUESTS_PER_HOUR = 120;
