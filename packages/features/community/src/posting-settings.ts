export const POSTING_MODES = [
  'public',
  'registered_only',
  'visitor_moderated',
  'closed',
] as const;

export type PostingMode = (typeof POSTING_MODES)[number];

export function isPostingMode(
  value: string | null | undefined,
): value is PostingMode {
  return POSTING_MODES.includes(value as PostingMode);
}

export function normalizePostingMode(
  value: string | null | undefined,
): PostingMode {
  return isPostingMode(value) ? value : 'public';
}

export function shouldAllowPublicDuaSubmission(input: {
  mode: PostingMode;
  isAuthenticated: boolean;
  isAdmin: boolean;
}): { allowed: true } | { allowed: false; error: string } {
  if (input.mode === 'public' || input.mode === 'visitor_moderated') {
    return { allowed: true };
  }

  if (input.mode === 'registered_only') {
    return input.isAuthenticated
      ? { allowed: true }
      : {
          allowed: false,
          error:
            'Please sign in to submit a dua. Posting is currently limited to registered users.',
        };
  }

  if (input.mode === 'closed') {
    return input.isAdmin
      ? { allowed: true }
      : {
          allowed: false,
          error:
            'Public dua submissions are currently closed. Please check back later.',
        };
  }

  return { allowed: true };
}

export function shouldHoldSubmissionForReview(input: {
  mode: PostingMode;
  isAuthenticated: boolean;
  isAdmin: boolean;
}): boolean {
  return (
    input.mode === 'visitor_moderated' &&
    !input.isAuthenticated &&
    !input.isAdmin
  );
}
