export const POSTING_MODES = ["public", "registered_only", "visitor_moderated", "closed"] as const

export type PostingMode = (typeof POSTING_MODES)[number]

export type PostingModeOption = {
  mode: PostingMode
  label: string
  helper: string
}

export const POSTING_MODE_OPTIONS: PostingModeOption[] = [
  {
    mode: "public",
    label: "Anyone can post",
    helper: "Visitors and signed-in members can submit public duas after bot verification.",
  },
  {
    mode: "registered_only",
    label: "Only registered users can post",
    helper: "Signed-in members can submit duas. Visitors are asked to sign in first.",
  },
  {
    mode: "visitor_moderated",
    label: "Registered post instantly, visitors reviewed",
    helper: "Signed-in members' duas publish immediately. Visitor submissions are held for a moderator to approve before they appear.",
  },
  {
    mode: "closed",
    label: "Posting closed",
    helper: "Public submissions are paused. Admins can still manage existing duas from the admin area.",
  },
]

export type PublicDuaSubmissionAccess =
  | { allowed: true }
  | { allowed: false; error: string }

export function isPostingMode(value: string | null | undefined): value is PostingMode {
  return POSTING_MODES.includes(value as PostingMode)
}

export function normalizePostingMode(value: string | null | undefined): PostingMode {
  return isPostingMode(value) ? value : "public"
}

export function getPostingModeOption(mode: PostingMode): PostingModeOption | undefined {
  return POSTING_MODE_OPTIONS.find((option) => option.mode === mode)
}

export function shouldAllowPublicDuaSubmission(input: {
  mode: PostingMode
  isAuthenticated: boolean
  isAdmin: boolean
}): PublicDuaSubmissionAccess {
  if (input.mode === "public") return { allowed: true }
  // Both visitors and members may submit; visitor posts are held for review
  // (see shouldHoldSubmissionForReview), so submission itself is allowed.
  if (input.mode === "visitor_moderated") return { allowed: true }
  if (input.mode === "registered_only") {
    return input.isAuthenticated
      ? { allowed: true }
      : { allowed: false, error: "Please sign in to submit a dua. Posting is currently limited to registered users." }
  }
  if (input.mode === "closed") {
    return input.isAdmin
      ? { allowed: true }
      : { allowed: false, error: "Public dua submissions are currently closed. Please check back later." }
  }

  const _exhaustive: never = input.mode
  return _exhaustive
}

// Whether a submission must be held (unpublished) for moderator approval before
// it appears — used by the "visitor_moderated" mode for non-member submissions.
export function shouldHoldSubmissionForReview(input: {
  mode: PostingMode
  isAuthenticated: boolean
  isAdmin: boolean
}): boolean {
  return input.mode === "visitor_moderated" && !input.isAuthenticated && !input.isAdmin
}
