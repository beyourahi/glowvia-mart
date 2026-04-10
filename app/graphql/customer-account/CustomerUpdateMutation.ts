/**
 * @fileoverview Customer Update Mutation
 *
 * @description
 * GraphQL mutation for updating customer profile information including first name,
 * last name, email address, and phone number. Returns updated customer data and
 * validation errors for form handling.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @mutations
 * - CUSTOMER_UPDATE_MUTATION - Updates customer profile fields (name, email, phone)
 *
 * @related
 * - app/routes/account.profile.tsx - Uses this mutation to save profile changes
 *
 * @notes
 * The mutation returns userErrors for validation feedback (e.g., invalid email format,
 * duplicate email). These errors include field-level information for inline form validation.
 */

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerUpdate
export const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation customerUpdate(
    $customer: CustomerUpdateInput!
    $language: LanguageCode
  ) @inContext(language: $language) {
    customerUpdate(input: $customer) {
      customer {
        firstName
        lastName
        emailAddress {
          emailAddress
        }
        phoneNumber {
          phoneNumber
        }
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;
