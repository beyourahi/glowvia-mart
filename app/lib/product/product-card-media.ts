/**
 * @fileoverview Product card media utilities — video-first detection
 *
 * @description
 * Extracts and narrows the first Video media asset from a product for
 * rendering on product cards. When a product's first media asset is a
 * Video, cards prioritize that over the default featured image.
 *
 * @behavior
 * - Returns normalized video metadata when product.media[0] is a Video
 * - Returns null for products without media, or whose first asset is an
 *   image (callers should fall back to the image carousel)
 * - Validates that at least one usable source URL exists — Shopify
 *   occasionally returns Video nodes with empty source arrays
 *
 * @rationale
 * Product card fragments share a minimal shape; a dedicated helper keeps
 * ProductItem free of type narrowing and makes video-first rendering a
 * single composable decision point.
 *
 * @related
 * - ProductCardVideo.tsx — renderer for the returned data
 * - ProductItem.tsx — caller that switches between video and image carousel
 */

import type {ProductCardVideoPoster, ProductCardVideoSource} from "~/components/ProductCardVideo";

type MaybeVideoNode = {
    __typename?: string | null;
    id?: string | null;
    alt?: string | null;
    sources?: Array<{
        url?: string | null;
        mimeType?: string | null;
        width?: number | null;
        height?: number | null;
    }> | null;
    previewImage?: {
        id?: string | null;
        url?: string | null;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
};

type MaybeProductWithMedia = {
    media?: {
        nodes?: Array<MaybeVideoNode | {__typename?: string | null}> | null;
    } | null;
};

export interface CardVideoMedia {
    id: string | null;
    alt: string | null;
    sources: ProductCardVideoSource[];
    previewImage: ProductCardVideoPoster | null;
}

/**
 * Extract the first video from a product's media list for card rendering.
 * Returns null when the first asset isn't a video (or has no usable sources).
 */
export function getCardVideoMedia(product: unknown): CardVideoMedia | null {
    if (!product || typeof product !== "object") return null;
    const maybe = product as MaybeProductWithMedia;
    const nodes = maybe.media?.nodes;
    if (!Array.isArray(nodes) || nodes.length === 0) return null;

    const first = nodes[0];
    if (!first || first.__typename !== "Video") return null;

    const video = first as MaybeVideoNode;
    const sources: ProductCardVideoSource[] = (video.sources ?? [])
        .filter((s): s is {url: string; mimeType: string; width?: number | null; height?: number | null} =>
            Boolean(s?.url) && Boolean(s?.mimeType)
        )
        .map(s => ({
            url: s.url,
            mimeType: s.mimeType,
            width: s.width ?? null,
            height: s.height ?? null
        }));

    // Guard: Video node with no playable sources — skip and let caller
    // fall through to the image path.
    if (sources.length === 0) return null;

    const previewImage: ProductCardVideoPoster | null = video.previewImage?.url
        ? {
              id: video.previewImage.id ?? null,
              url: video.previewImage.url,
              altText: video.previewImage.altText ?? null,
              width: video.previewImage.width ?? null,
              height: video.previewImage.height ?? null
          }
        : null;

    return {
        id: video.id ?? null,
        alt: video.alt ?? null,
        sources,
        previewImage
    };
}
