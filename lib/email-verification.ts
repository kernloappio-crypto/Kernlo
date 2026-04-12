/**
 * Email Verification Utilities
 * For MVP: Mock email verification (stores flag in localStorage)
 * Phase 2: Integrate SendGrid/Mailgun for real emails
 */

export function sendVerificationEmail(email: string): boolean {
  // MVP: Mock email send
  // Phase 2: Integrate with SendGrid/Mailgun
  console.log(`[MOCK] Verification email sent to ${email}`);
  
  // Store verification token in localStorage
  const tokens = JSON.parse(localStorage.getItem("email_tokens") || "{}");
  const token = Math.random().toString(36).substr(2, 9);
  tokens[email] = {
    token,
    created_at: new Date().toISOString(),
    verified: false,
  };
  localStorage.setItem("email_tokens", JSON.stringify(tokens));
  
  return true;
}

export function verifyEmail(email: string): boolean {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[email]) return false;

  users[email].email_verified = true;
  localStorage.setItem("users", JSON.stringify(users));
  
  return true;
}

export function isEmailVerified(email: string): boolean {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  return users[email]?.email_verified === true;
}

export function sendPasswordResetEmail(email: string): boolean {
  // MVP: Mock reset email
  // Phase 2: Send actual reset link via email
  console.log(`[MOCK] Password reset email sent to ${email}`);
  
  const tokens = JSON.parse(localStorage.getItem("reset_tokens") || "{}");
  const token = Math.random().toString(36).substr(2, 9);
  tokens[email] = {
    token,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
  };
  localStorage.setItem("reset_tokens", JSON.stringify(tokens));
  
  // In MVP, we'll display the reset link in the UI
  // Phase 2: Send via email
  return true;
}

export function resetPassword(email: string, newPassword: string): boolean {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[email]) return false;

  users[email].password = newPassword;
  localStorage.setItem("users", JSON.stringify(users));
  
  // Clear reset token
  const tokens = JSON.parse(localStorage.getItem("reset_tokens") || "{}");
  delete tokens[email];
  localStorage.setItem("reset_tokens", JSON.stringify(tokens));
  
  return true;
}
