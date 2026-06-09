import type { PostgrestError } from "@supabase/supabase-js"

export function isMissingTableError(error: PostgrestError | null): boolean {
  return error?.code === "PGRST205"
}

export function isMissingColumnError(error: PostgrestError | null): boolean {
  return error?.code === "42703"
}

export function isSchemaDriftError(error: PostgrestError | null): boolean {
  return isMissingTableError(error) || isMissingColumnError(error)
}
