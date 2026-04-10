/**
 * @fileoverview Product image display component with responsive sizing
 *
 * @description
 * Renders product variant images using Shopify's Hydrogen Image component with
 * optimized loading and aspect ratio handling. Provides fallback for missing images.
 *
 * @features
 * - Shopify CDN image optimization via Hydrogen Image component
 * - Responsive image sizing with srcset generation
 * - Fixed 1:1 aspect ratio for consistent layout
 * - Graceful fallback for missing images
 * - Automatic alt text from Shopify or default fallback
 *
 * @props
 * - image: ProductVariantFragment["image"] - Image object from Shopify Storefront API
 *
 * @usage
 * ```tsx
 * <ProductImage image={selectedVariant.image} />
 * ```
 *
 * @related
 * - ProductItem.tsx - Uses this component for product cards
 * - ProductHeroMobile.tsx - Mobile product hero section
 * - QuickAddDialog.tsx - Variant selection modal
 * - QuickAddSheet.tsx - Mobile variant selection
 *
 * @see {@link https://shopify.dev/docs/api/hydrogen/2024-01/components/image}
 */

import type {ProductVariantFragment} from "storefrontapi.generated";
import {Image} from "@shopify/hydrogen";

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Displays a product variant image with responsive sizing
 *
 * @param image - Image object from product variant fragment (can be null/undefined)
 * @returns Optimized image component with fallback for missing images
 *
 * Image optimization:
 * - Hydrogen Image generates srcset for multiple screen densities
 * - Lazy loading by default for performance
 * - 1:1 aspect ratio ensures consistent card layouts
 * - Responsive sizes: 50vw on desktop (min-width: 45em), 100vw on mobile
 */
export function ProductImage({image}: {image: ProductVariantFragment["image"]}) {
    // Return empty container if no image provided (maintains layout)
    if (!image) {
        return <div className="[&_img]:h-auto [&_img]:w-full" />;
    }

    return (
        <div className="[&_img]:h-auto [&_img]:w-full">
            <Image
                alt={image.altText || "Product Image"}
                aspectRatio="1/1"
                data={image}
                key={image.id}
                sizes="(min-width: 45em) 50vw, 100vw"
            />
        </div>
    );
}
