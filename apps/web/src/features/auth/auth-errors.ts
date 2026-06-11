import { AuthError } from "@supabase/supabase-js";

const MESSAGES: Record<string, string> = {
  access_denied: "Sign-in was cancelled. You can try again when you're ready.",
  invalid_request: "Something went wrong starting Google sign-in. Please try again.",
  server_error: "Google sign-in is temporarily unavailable. Please try again shortly.",
  temporarily_unavailable: "Google sign-in is temporarily unavailable. Please try again shortly.",
  otp_expired: "Your session has expired. Please sign in again.",
  session_expired: "Your session has expired. Please sign in again.",
  user_not_found: "No account found with those details.",
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Please confirm your email before signing in.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return MESSAGES[error] ?? error;
  }

  if (error instanceof AuthError) {
    const code = error.code ?? "";
    if (MESSAGES[code]) return MESSAGES[code];
    if (error.message.toLowerCase().includes("cancel")) {
      return MESSAGES.access_denied;
    }
    if (error.message.toLowerCase().includes("expired")) {
      return MESSAGES.session_expired;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Authentication failed. Please try again.";
}

export function parseOAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error") ?? hashParams.get("error");
  const description = params.get("error_description") ?? hashParams.get("error_description");

  if (!error) return null;

  if (error === "access_denied") return MESSAGES.access_denied;
  if (description) return decodeURIComponent(description.replace(/\+/g, " "));
  return MESSAGES[error] ?? "Google sign-in failed. Please try again.";
}

export function clearOAuthCallbackParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  url.searchParams.delete("error_code");
  url.hash = "";
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}
