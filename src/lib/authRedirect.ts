/** Redirect target for email confirmation and OAuth callbacks. */
export function getAuthRedirectTo(origin = window.location.origin) {
  return `${origin}/auth/complete`;
}
