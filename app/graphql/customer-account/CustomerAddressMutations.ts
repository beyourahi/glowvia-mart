/**
 * @fileoverview Customer Address Management Mutations
 *
 * @description
 * Provides GraphQL mutations for managing customer shipping addresses
 * via the Customer Account API. Supports creating, updating, and deleting
 * addresses from the customer's address book.
 *
 * @api Customer Account API (requires authentication)
 *
 * @mutations
 * - UPDATE_ADDRESS_MUTATION: Update existing address
 * - DELETE_ADDRESS_MUTATION: Remove an address
 * - CREATE_ADDRESS_MUTATION: Add new address
 *
 * @error-handling
 * All mutations return userErrors array with:
 * - code: Error type code
 * - field: Which field caused the error
 * - message: Human-readable error message
 *
 * @related
 * - account.addresses.tsx - Address management UI
 * - CustomerDetailsQuery.ts - Fetches address list
 *
 * @see https://shopify.dev/docs/api/customer/latest/mutations/customerAddressUpdate
 */

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Update an existing customer address.
 *
 * @param $address - Updated address fields (CustomerAddressInput)
 * @param $addressId - ID of address to update
 * @param $defaultAddress - Set as default if true
 * @param $language - Language code for error messages
 *
 * @returns Updated address ID and any validation errors
 */
export const UPDATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressUpdate(
    $address: CustomerAddressInput!
    $addressId: ID!
    $defaultAddress: Boolean
    $language: LanguageCode
 ) @inContext(language: $language) {
    customerAddressUpdate(
      address: $address
      addressId: $addressId
      defaultAddress: $defaultAddress
    ) {
      customerAddress {
        id
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
 * Delete a customer address.
 *
 * @param $addressId - ID of address to delete
 * @param $language - Language code for error messages
 *
 * @returns Deleted address ID and any errors
 *
 * @note Cannot delete the default address if it's the only address
 */
export const DELETE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressDelete(
    $addressId: ID!
    $language: LanguageCode
  ) @inContext(language: $language) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

/**
 * Create a new customer address.
 *
 * @param $address - New address data (CustomerAddressInput)
 * @param $defaultAddress - Set as default address if true
 * @param $language - Language code for error messages
 *
 * @returns Created address ID and any validation errors
 */
export const CREATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressCreate(
    $address: CustomerAddressInput!
    $defaultAddress: Boolean
    $language: LanguageCode
  ) @inContext(language: $language) {
    customerAddressCreate(
      address: $address
      defaultAddress: $defaultAddress
    ) {
      customerAddress {
        id
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;
