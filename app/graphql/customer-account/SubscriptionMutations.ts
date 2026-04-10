/**
 * @fileoverview Subscription Management Mutations
 *
 * @description
 * GraphQL mutations for managing subscription contracts and billing cycles. Provides
 * operations for pausing, cancelling, activating subscriptions, and skipping/unskipping
 * billing cycles. Includes action type constants for consistent subscription management.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @mutations
 * - SUBSCRIPTION_CONTRACT_PAUSE_MUTATION - Pauses an active subscription
 * - SUBSCRIPTION_CONTRACT_CANCEL_MUTATION - Permanently cancels a subscription (irreversible)
 * - SUBSCRIPTION_CONTRACT_ACTIVATE_MUTATION - Activates a paused or failed subscription
 * - SUBSCRIPTION_BILLING_CYCLE_SKIP_MUTATION - Skips the next billing cycle
 * - SUBSCRIPTION_BILLING_CYCLE_UNSKIP_MUTATION - Restores a previously skipped cycle
 *
 * @constants
 * - SUBSCRIPTION_ACTIONS - Action type constants (pause, cancel, activate, skipCycle, unskipCycle)
 * - SubscriptionAction type - Union type of valid subscription actions
 *
 * @related
 * - app/routes/account.subscriptions.$id.tsx - Uses these mutations for subscription management
 * - app/routes/account.subscriptions._index.tsx - Displays subscription list
 * - app/graphql/customer-account/SubscriptionQueries.ts - Fetches subscription data
 *
 * @notes
 * - PAUSE: Contract must be ACTIVE. Can be reactivated later.
 * - CANCEL: Permanent and irreversible. Contract cannot be reactivated.
 * - ACTIVATE: Works on PAUSED or FAILED contracts. Returns next billing date.
 * - SKIP/UNSKIP: Manages individual billing cycles without affecting contract status.
 *
 * All mutations return userErrors for validation and error handling.
 */

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/subscriptionContractPause
// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/subscriptionContractCancel
// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/subscriptionContractActivate
// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/subscriptionBillingCycleSkip
// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/subscriptionBillingCycleUnskip

/**
 * Pause a subscription contract
 * Contract must be ACTIVE to pause
 */
export const SUBSCRIPTION_CONTRACT_PAUSE_MUTATION = `#graphql
  mutation subscriptionContractPause(
    $subscriptionContractId: ID!
    $language: LanguageCode
  ) @inContext(language: $language) {
    subscriptionContractPause(subscriptionContractId: $subscriptionContractId) {
      contract {
        id
        status
        updatedAt
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

/**
 * Cancel a subscription contract
 * Once cancelled, the contract cannot be reactivated
 */
export const SUBSCRIPTION_CONTRACT_CANCEL_MUTATION = `#graphql
  mutation subscriptionContractCancel(
    $subscriptionContractId: ID!
    $language: LanguageCode
  ) @inContext(language: $language) {
    subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {
      contract {
        id
        status
        updatedAt
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

/**
 * Activate a subscription contract
 * Contract must be ACTIVE, PAUSED, or FAILED to activate
 */
export const SUBSCRIPTION_CONTRACT_ACTIVATE_MUTATION = `#graphql
  mutation subscriptionContractActivate(
    $subscriptionContractId: ID!
    $language: LanguageCode
  ) @inContext(language: $language) {
    subscriptionContractActivate(subscriptionContractId: $subscriptionContractId) {
      contract {
        id
        status
        updatedAt
        nextBillingDate
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

/**
 * Skip a billing cycle
 * Prevents the next scheduled billing from occurring
 */
export const SUBSCRIPTION_BILLING_CYCLE_SKIP_MUTATION = `#graphql
  mutation subscriptionBillingCycleSkip(
    $billingCycleInput: SubscriptionBillingCycleInput!
    $language: LanguageCode
  ) @inContext(language: $language) {
    subscriptionBillingCycleSkip(billingCycleInput: $billingCycleInput) {
      billingCycle {
        cycleIndex
        skipped
        billingAttemptExpectedDate
        status
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

/**
 * Unskip a billing cycle
 * Restores a previously skipped billing cycle
 */
export const SUBSCRIPTION_BILLING_CYCLE_UNSKIP_MUTATION = `#graphql
  mutation subscriptionBillingCycleUnskip(
    $billingCycleInput: SubscriptionBillingCycleInput!
    $language: LanguageCode
  ) @inContext(language: $language) {
    subscriptionBillingCycleUnskip(billingCycleInput: $billingCycleInput) {
      billingCycle {
        cycleIndex
        skipped
        billingAttemptExpectedDate
        status
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

// Action types for subscription management
export const SUBSCRIPTION_ACTIONS = {
    PAUSE: "pause",
    CANCEL: "cancel",
    ACTIVATE: "activate",
    SKIP_CYCLE: "skipCycle",
    UNSKIP_CYCLE: "unskipCycle"
} as const;

export type SubscriptionAction = (typeof SUBSCRIPTION_ACTIONS)[keyof typeof SUBSCRIPTION_ACTIONS];
