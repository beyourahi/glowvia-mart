/**
 * @fileoverview Centralized GraphQL queries for Shopify store policies
 *
 * @description
 * Provides GraphQL fragments and queries for fetching store policy content
 * from Shopify's ShopPolicy objects. Supports all four policy types with
 * conditional fetching using @include directives.
 *
 * @supported-policies
 * - privacyPolicy → Privacy & Data Protection
 * - shippingPolicy → Shipping & Delivery Information
 * - termsOfService → Terms & Conditions
 * - refundPolicy → Returns & Refunds
 *
 * @usage
 * Import and use with Hydrogen's storefront client:
 * ```typescript
 * import {POLICY_CONTENT_QUERY} from "~/lib/queries/policy";
 *
 * const data = await dataAdapter.query(POLICY_CONTENT_QUERY, {
 *     variables: {
 *         privacyPolicy: true,
 *         shippingPolicy: false,
 *         termsOfService: false,
 *         refundPolicy: false
 *     }
 * });
 * ```
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/ShopPolicy
 */

/**
 * Policy Fragment
 *
 * Defines the standard fields returned for all policy types.
 * Used across all policy queries to ensure consistent data structure.
 */
export const POLICY_FRAGMENT = `#graphql
    fragment Policy on ShopPolicy {
        body       # HTML content of the policy
        handle     # URL-safe identifier (e.g., "privacy-policy")
        id         # Shopify global ID
        title      # Display title (e.g., "Privacy Policy")
        url        # Canonical URL for the policy
    }
` as const;

/**
 * Policy Content Query
 *
 * Fetches policy content using conditional @include directives.
 * This allows fetching only the requested policy type, avoiding
 * unnecessary data transfer and improving performance.
 *
 * @param {boolean} privacyPolicy - Include privacy policy in response
 * @param {boolean} shippingPolicy - Include shipping policy in response
 * @param {boolean} termsOfService - Include terms of service in response
 * @param {boolean} refundPolicy - Include refund policy in response
 * @param {LanguageCode} language - Language for internationalization
 *
 * @returns Shop object with requested policy/policies populated
 */
export const POLICY_CONTENT_QUERY = `#graphql
    ${POLICY_FRAGMENT}

    query PolicyContent(
        $privacyPolicy: Boolean!
        $shippingPolicy: Boolean!
        $termsOfService: Boolean!
        $refundPolicy: Boolean!
        $country: CountryCode
        $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
        shop {
            privacyPolicy @include(if: $privacyPolicy) {
                ...Policy
            }
            shippingPolicy @include(if: $shippingPolicy) {
                ...Policy
            }
            termsOfService @include(if: $termsOfService) {
                ...Policy
            }
            refundPolicy @include(if: $refundPolicy) {
                ...Policy
            }
        }
    }
` as const;
