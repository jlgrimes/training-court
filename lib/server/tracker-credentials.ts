import { isLogFormat } from '@/components/tournaments/Format/tournament-format.types';
import { hashTrackerToken, mintTrackerToken } from '@/lib/tracker-sync/token';
import {
  MAX_TRACKER_CREDENTIALS,
  TRACKER_REQUESTS_PER_HOUR,
} from '@/lib/tracker-sync/limits';
import { createAdminClient } from '@/utils/supabase/admin';

const MAX_LABEL_LENGTH = 64;

export type TrackerCredentialClaim =
  | {
      status: 'ok';
      credential: { id: string; userId: string; label: string; defaultFormat: string };
    }
  | { status: 'invalid_token' }
  | { status: 'rate_limited' }
  | { status: 'error' };

export type TrackerCredentialFailureCode =
  | 'invalid_label'
  | 'invalid_format'
  | 'limit_reached'
  | 'not_found'
  | 'unavailable';

export type TrackerCredentialFailure = {
  ok: false;
  code: TrackerCredentialFailureCode;
  /** Server-side detail; user-facing copy is chosen by the client per code. */
  message: string;
};

type MintResult =
  | { ok: true; token: string }
  | TrackerCredentialFailure;

const validLabel = (label: string) => {
  const trimmed = label.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LABEL_LENGTH) return null;
  return trimmed;
};

export async function mintTrackerCredential(input: {
  userId: string;
  label: string;
  defaultFormat: string;
}): Promise<MintResult> {
  const label = validLabel(input.label);
  if (!label) {
    return { ok: false, code: 'invalid_label', message: 'Give the token a name of 1–64 characters.' };
  }
  if (!isLogFormat(input.defaultFormat)) {
    return { ok: false, code: 'invalid_format', message: 'Choose a format for this token.' };
  }

  const minted = mintTrackerToken();
  const supabase = createAdminClient();
  const { error } = await supabase.from('tracker_credentials').insert({
    user_id: input.userId,
    label,
    default_format: input.defaultFormat,
    token_hash: minted.hash,
    token_hint: minted.hint,
  });

  if (error) {
    console.error('Could not create tracker credential:', error.message);
    return `${error.message}`.includes('tracker_credential_limit')
      ? {
          ok: false,
          code: 'limit_reached',
          message: `You can have up to ${MAX_TRACKER_CREDENTIALS} tokens. Revoke one first.`,
        }
      : { ok: false, code: 'unavailable', message: 'Could not create the token. Try again.' };
  }

  return { ok: true, token: minted.token };
}

/** Stamped only after a delivery is accepted, so "last sync" means a sync. */
export async function touchTrackerCredential(credentialId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('tracker_credentials')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', credentialId);

  if (error) console.error('Could not stamp tracker credential:', error.message);
}

/**
 * Authenticates a delivery. The RPC does lookup, revocation and the fixed rate
 * window in one locked statement.
 */
export async function claimTrackerCredential(token: string): Promise<TrackerCredentialClaim> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('claim_tracker_credential_request', {
    p_token_hash: hashTrackerToken(token),
    p_limit: TRACKER_REQUESTS_PER_HOUR,
  });

  if (error) {
    console.error('Could not claim tracker credential request:', error.message);
    return { status: 'error' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { status: 'invalid_token' };
  if (!row.allowed) return { status: 'rate_limited' };

  return {
    status: 'ok',
    credential: {
      id: row.credential_id,
      userId: row.user_id,
      label: row.label,
      defaultFormat: row.default_format,
    },
  };
}
