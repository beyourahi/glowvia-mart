/**
 * @fileoverview Customer Details Query and Fragments
 *
 * @description
 * Provides GraphQL queries for fetching authenticated customer details
 * from the Shopify Customer Account API. This includes profile information,
 * contact details, and shipping addresses.
 *
 * @api Customer Account API (not Storefront API)
 * The Customer Account API requires customer authentication via OAuth.
 * These queries only work when the customer is logged in.
 *
 * @related
 * - account.profile.tsx - Uses CUSTOMER_DETAILS_QUERY for profile page
 * - account._index.tsx - Uses customer data for dashboard
 * - CustomerAddressMutations.ts - Mutations for address management
 *
 * @see https://shopify.dev/docs/api/customer/latest/objects/Customer
 */

// =============================================================================
// FRAGMENTS
// =============================================================================

/**
 * Customer fragment with full profile and address information.
 *
 * Includes:
 * - Basic profile (name, creation date, avatar)
 * - Email with marketing consent status
 * - Phone with marketing consent status
 * - Default address
 * - First 6 addresses for the address book
 */
export const CUSTOMER_FRAGMENT = `#graphql
  fragment Customer on Customer {
    id
    firstName
    lastName
    displayName
    imageUrl
    creationDate
    emailAddress {
      emailAddress
      marketingState
    }
    phoneNumber {
      phoneNumber
      marketingState
    }
    defaultAddress {
      ...Address
    }
    addresses(first: 6) {
      nodes {
        ...Address
      }
    }
  }
  fragment Address on CustomerAddress {
    id
    formatted
    firstName
    lastName
    company
    address1
    address2
    territoryCode
    zoneCode
    city
    zip
    phoneNumber
  }
` as const;

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Fetches complete customer details including addresses.
 *
 * @param $language - Language code for localized content
 *
 * @returns Customer object with profile and addresses
 *
 * @usage
 * ```typescript
 * const {customer} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
 *   variables: {language: 'EN'}
 * });
 * ```
 *
 * @see https://shopify.dev/docs/api/customer/latest/queries/customer
 */
export const CUSTOMER_DETAILS_QUERY = `#graphql
  query CustomerDetails($language: LanguageCode) @inContext(language: $language) {
    customer {
      ...Customer
    }
  }
  ${CUSTOMER_FRAGMENT}
` as const;
