/**
 * Stripe Integration Utilities
 * Handles checkout, payment processing, and subscription management
 * 
 * Phase 1 (MVP): Mock Stripe integration (shows flow, ready for real keys)
 * Phase 2: Integrate real Stripe API keys and webhooks
 */

export const STRIPE_CONFIG = {
  // Phase 2: Replace with real Stripe publishable key
  PUBLISHABLE_KEY: "pk_live_YOUR_PUBLISHABLE_KEY_HERE",
  // Phase 2: Backend will use secret key for webhooks
  PRODUCT_IDS: {
    PRO: "price_YOUR_PRO_PRODUCT_ID",
  },
};

export interface StripeCustomer {
  email: string;
  stripe_customer_id?: string;
  subscription_id?: string;
  status: "trial" | "active" | "canceled" | "past_due";
}

export function createCheckoutSession(email: string, priceId: string): string {
  /**
   * Phase 1: Mock checkout URL
   * Phase 2: Call Stripe API to create checkout session
   * 
   * Real flow:
   * 1. POST /api/stripe/create-checkout-session with { email, priceId }
   * 2. Stripe returns checkout URL
   * 3. Redirect user to URL
   * 4. User completes payment
   * 5. Stripe webhook confirms payment → updates user record
   */

  // Mock: Show alert with upgrade instructions
  const mockCheckoutUrl = `/upgrade?email=${encodeURIComponent(email)}&price=pro`;
  
  console.log("[MOCK] Stripe checkout session created:", {
    email,
    priceId,
    checkoutUrl: mockCheckoutUrl,
  });

  return mockCheckoutUrl;
}

export function handleStripeWebhook(event: any): boolean {
  /**
   * Phase 2: Real webhook handler
   * 
   * Listen for:
   * - customer.subscription.created → User upgraded
   * - customer.subscription.updated → Subscription changed
   * - customer.subscription.deleted → User canceled
   * - invoice.payment_succeeded → Payment processed
   * - invoice.payment_failed → Payment failed
   */

  console.log("[MOCK] Stripe webhook received:", event.type);

  switch (event.type) {
    case "checkout.session.completed":
      // User completed payment
      const email = event.data.object.customer_email;
      markUserAsPaid(email);
      return true;

    case "customer.subscription.deleted":
      // User canceled subscription
      return true;

    default:
      return false;
  }
}

export function markUserAsPaid(email: string): boolean {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[email]) return false;

  users[email].is_paid = true;
  users[email].trial_ended = true;
  users[email].subscription_status = "active";
  users[email].subscription_date = new Date().toISOString();
  
  localStorage.setItem("users", JSON.stringify(users));
  return true;
}

export function cancelSubscription(email: string): boolean {
  /**
   * Phase 2: Call Stripe API to cancel subscription
   */
  
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[email]) return false;

  users[email].is_paid = false;
  users[email].subscription_status = "canceled";
  localStorage.setItem("users", JSON.stringify(users));
  
  return true;
}

export function getCustomerPortalUrl(email: string): string {
  /**
   * Phase 2: Generate Stripe Customer Portal URL for:
   * - View invoice history
   * - Update payment method
   * - Cancel subscription
   * - View current plan
   */

  return `/billing?email=${encodeURIComponent(email)}`;
}
