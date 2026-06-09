/** Map Supabase Auth errors to user-facing messages. */
export function mapAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("signups not allowed for otp") ||
    normalized.includes("signup is disabled")
  ) {
    return "New sign-ups are disabled. Ask an admin to enable “Allow new users to sign up” in Supabase (Authentication → Providers → Email), then try again."
  }

  if (
    normalized.includes("user not found") ||
    normalized.includes("invalid login credentials")
  ) {
    return "No account found for this email. Use Google sign-in, or ask an admin to invite you."
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a few minutes and try again."
  }

  if (normalized.includes("invalid email")) {
    return "Please enter a valid email address."
  }

  return message
}
