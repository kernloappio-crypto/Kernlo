/**
 * Trial System Utilities
 * Manages trial period checking, expiration, and upgrade gating
 */

export interface TrialStatus {
  is_trial: boolean;
  days_remaining: number;
  trial_expired: boolean;
  is_paid: boolean;
  can_access: boolean; // true if trial active OR paid
}

export function getTrialStatus(email: string): TrialStatus {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const user = users[email];

  if (!user || !user.trial_start_date) {
    return {
      is_trial: false,
      days_remaining: 0,
      trial_expired: true,
      is_paid: false,
      can_access: false,
    };
  }

  const trialStartDate = new Date(user.trial_start_date);
  const trialEndDate = new Date(trialStartDate);
  trialEndDate.setDate(trialEndDate.getDate() + 30);

  const today = new Date();
  const daysRemaining = Math.ceil(
    (trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const trialExpired = today > trialEndDate;
  const isPaid = user.is_paid === true;
  const canAccess = !trialExpired || isPaid;

  return {
    is_trial: !isPaid,
    days_remaining: Math.max(0, daysRemaining),
    trial_expired: trialExpired,
    is_paid: isPaid,
    can_access: canAccess,
  };
}

export function markUserAsPaid(email: string): boolean {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[email]) return false;

  users[email].is_paid = true;
  users[email].trial_ended = true;
  localStorage.setItem("users", JSON.stringify(users));
  return true;
}

export function formatTrialMessage(status: TrialStatus): string {
  if (status.is_paid) {
    return "Pro member • Unlimited access";
  }

  if (status.trial_expired) {
    return "Trial expired • Upgrade to continue";
  }

  if (status.days_remaining === 1) {
    return `1 day left in your free trial`;
  }

  return `${status.days_remaining} days left in your free trial`;
}
