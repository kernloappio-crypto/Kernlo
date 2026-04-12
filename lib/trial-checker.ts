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

export function getTrialStatus(trialStartDate: string, isPaid: boolean): TrialStatus {
  const trialStart = new Date(trialStartDate);
  const trialEnd = new Date(trialStart);
  trialEnd.setDate(trialEnd.getDate() + 30);

  const today = new Date();
  const daysRemaining = Math.ceil(
    (trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const trialExpired = today > trialEnd;
  const canAccess = !trialExpired || isPaid;

  return {
    is_trial: !isPaid,
    days_remaining: Math.max(0, daysRemaining),
    trial_expired: trialExpired,
    is_paid: isPaid,
    can_access: canAccess,
  };
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
