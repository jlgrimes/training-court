import { claimTrackerCredential, touchTrackerCredential } from '@/lib/server/tracker-credentials';
import { MAX_ENVELOPE_BYTES, parseTrackerEnvelope } from '@/lib/tracker-sync/envelope';
import { planTrackerLogIngest } from '@/lib/tracker-sync/ingest';
import { readBearerTrackerToken } from '@/lib/tracker-sync/token';
import { createAdminClient } from '@/utils/supabase/admin';

// node-postgres/crypto are not available on the edge runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (body: unknown, status: number) => Response.json(body, { status });

const IMPORT_HASH_CONSTRAINT = 'logs_user_import_hash_idx';

/**
 * Only a collision on the dedupe index means "delivered twice". Any other
 * unique violation is a real failure and must not be reported as a duplicate.
 */
const isDuplicateImportHash = (error: { code?: string; message?: string; details?: string } | null) =>
  error?.code === '23505' &&
  `${error.message ?? ''} ${error.details ?? ''}`.includes(IMPORT_HASH_CONSTRAINT);

const invalidToken = () =>
  json(
    {
      error: 'invalid_token',
      message:
        'That token is missing, unknown or revoked. Re-copy it from Preferences, or create a new one if it was revoked.',
    },
    401
  );

/**
 * Battle Log ingest for the PTCGL Tracker. See docs/tracker-sync.md.
 *
 * The token identifies the player and is write-only: this route only ever
 * creates `logs` rows. Every write is scoped by the token's `user_id`; the body
 * is never trusted for identity.
 */
export async function POST(request: Request) {
  const token = readBearerTrackerToken(request.headers.get('authorization'));
  if (!token) return invalidToken();

  const claim = await claimTrackerCredential(token);
  if (claim.status === 'invalid_token') return invalidToken();
  if (claim.status === 'rate_limited') {
    return json(
      {
        error: 'rate_limited',
        message: 'Too many deliveries from this token. Try again later.',
      },
      429
    );
  }
  if (claim.status === 'error') {
    return json({ error: 'server_error' }, 500);
  }

  // Reject obviously oversized bodies before buffering them. The post-read
  // check below still catches chunked requests with no Content-Length.
  const declaredLength = Number(request.headers.get('content-length') ?? Number.NaN);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_ENVELOPE_BYTES) {
    return json({ error: 'invalid_request', message: 'That battle log is too large.' }, 400);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json({ error: 'invalid_request', message: 'The request body could not be read.' }, 400);
  }

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_ENVELOPE_BYTES) {
    return json({ error: 'invalid_request', message: 'That battle log is too large.' }, 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: 'invalid_request', message: 'The request body is not valid JSON.' }, 400);
  }

  const parsedEnvelope = parseTrackerEnvelope(body);
  if (!parsedEnvelope.ok) {
    return json({ error: parsedEnvelope.error, message: parsedEnvelope.message }, 400);
  }

  const supabase = createAdminClient();
  const { data: userData, error: userError } = await supabase
    .from('user data')
    .select('live_screen_name')
    .eq('id', claim.credential.userId)
    .maybeSingle();

  if (userError) {
    console.error('Tracker sync could not read the player:', userError.message);
    return json({ error: 'server_error' }, 500);
  }

  const plan = planTrackerLogIngest({
    envelope: parsedEnvelope.envelope,
    liveScreenName: userData?.live_screen_name ?? null,
    credentialDefaultFormat: claim.credential.defaultFormat,
  });

  if (!plan.ok) {
    return json({ error: plan.error, message: plan.message }, plan.status);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('logs')
    .insert({
      user: claim.credential.userId,
      log: plan.log,
      format: plan.format,
      archetype: plan.archetype,
      opp_archetype: plan.oppArchetype,
      result: plan.result,
      turn_order: plan.turnOrder,
      created_at: plan.createdAt,
      decklist_text: plan.decklistText,
      source_credential_id: claim.credential.id,
      import_hash: plan.importHash,
    })
    .select('id')
    .single();

  // A retry can slip past the check above; the partial unique index catches it.
  if (isDuplicateImportHash(insertError)) {
    await touchTrackerCredential(claim.credential.id);
    return json({ status: 'duplicate' }, 200);
  }

  if (insertError || !inserted) {
    console.error('Tracker sync could not save the log:', insertError?.message);
    return json({ error: 'server_error' }, 500);
  }

  await touchTrackerCredential(claim.credential.id);
  return json({ status: 'accepted', id: inserted.id }, 201);
}
