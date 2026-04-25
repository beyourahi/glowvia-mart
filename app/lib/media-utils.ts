/**
 * @fileoverview Media Utility Functions
 *
 * @description
 * Extracts flat image data from Shopify product media nodes.
 * Used to eliminate the redundant `images` field from product fragments
 * since every image in `images` is already present in `media` as a MediaImage node.
 *
 * @architecture
 * - Input: Product media nodes (union of MediaImage | Video | ExternalVideo | Model3d)
 * - Output: Flat array of image objects with consistent shape
 * - Filters: Only MediaImage nodes with a valid image are returned
 *
 * @related
 * - app/routes/products.$handle.tsx - PRODUCT_FRAGMENT and RECOMMENDED_PRODUCT_FRAGMENT
 * - app/components/ProductShareButton.tsx - Product preview image
 * - app/components/QuickAddDialog.tsx - Product image carousel
 * - app/components/ProductItem.tsx - Product card image carousel
 * - app/lib/seo.ts - JSON-LD structured data image URLs
 */

// Minimal shape required from a media node — compatible with both ProductFragment
// and RecommendedProductFragment media union types
type MediaNode = {
    __typename: string;
    image?: {
        id?: string | null;
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
};

export type FlatImage = {
    id: string | null;
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
};

/**
 * Extract flat image objects from product media nodes.
 * Filters to only MediaImage nodes that have a valid image URL.
 *
 * Drop-in replacement for `product.images.nodes` access patterns.
 *
 * @example
 * // Before: product.images?.nodes?.[0]
 * // After:  extractImagesFromMedia(product.media?.nodes)?.[0]
 */
export function extractImagesFromMedia(mediaNodes: MediaNode[] | undefined): FlatImage[] {
    if (!mediaNodes?.length) return [];
    return mediaNodes
        .filter(
            (node): node is MediaNode & {__typename: "MediaImage"; image: NonNullable<MediaNode["image"]>} =>
                node.__typename === "MediaImage" && node.image != null && !!node.image.url
        )
        .map(node => ({
            id: node.image.id ?? null,
            url: node.image.url,
            altText: node.image.altText ?? null,
            width: node.image.width ?? null,
            height: node.image.height ?? null,
        }));
}
