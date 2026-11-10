export const normalizePtcglUsername = (name: string | null | undefined) =>
  name?.trim().toLowerCase() ?? '';

export const samePtcglUsername = (a: string | null | undefined, b: string | null | undefined) =>
  !!normalizePtcglUsername(a) && normalizePtcglUsername(a) === normalizePtcglUsername(b);
