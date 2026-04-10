/**
 * @fileoverview Marketing Preference Mutations
 *
 * @description
 * GraphQL mutations for managing customer email marketing subscription preferences.
 * Allows customers to opt-in or opt-out of marketing emails with proper consent
 * tracking and validation.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @mutations
 * - CUSTOMER_EMAIL_MARKETING_SUBSCRIBE - Opts customer into email marketing
 * - CUSTOMER_EMAIL_MARKETING_UNSUBSCRIBE - Opts customer out of email marketing
 *
 * @related
 * - app/routes/account.profile.tsx - Uses these mutations for marketing preference toggles
 * - app/components/NewsletterForm.tsx - Public newsletter signup (unauthenticated)
 *
 * @notes
 * Both mutations return the updated marketingState (SUBSCRIBED, UNSUBSCRIBED, etc.)
 * and userErrors for validation. These mutations require authentication via Customer
 * Account API session.
 */

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerEmailMarketingSubscribe
export const CUSTOMER_EMAIL_MARKETING_SUBSCRIBE = `#graphql
  mutation customerEmailMarketingSubscribe($language: LanguageCode) @inContext(language: $language) {
    customerEmailMarketingSubscribe {
      emailAddress {
        emailAddress
        marketingState
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerEmailMarketingUnsubscribe
export const CUSTOMER_EMAIL_MARKETING_UNSUBSCRIBE = `#graphql
  mutation customerEmailMarketingUnsubscribe($language: LanguageCode) @inContext(language: $language) {
    customerEmailMarketingUnsubscribe {
      emailAddress {
        emailAddress
        marketingState
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;
