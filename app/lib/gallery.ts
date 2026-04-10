/**
 * @fileoverview Gallery Image Data Transformation and Types
 *
 * @description
 * Transforms Shopify product GraphQL responses into flat gallery image data for the lookbook
 * gallery page. Handles optional Shopify API types with sensible defaults and extracts all
 * product images with metadata for display.
 *
 * @architecture
 * Transformation Strategy:
 * - Input: Shopify product nodes with images, collections
 * - Output: Flat array of gallery images with product/collection metadata
 * - Handles missing/optional fields (altText, width, height, collections)
 * - Calculates aspect ratios for masonry layout
 *
 * Gallery Image Data:
 * - Image: id, url, altText, width, height, aspectRatio
 * - Product: handle, title
 * - Collection: handle, title (first collection only)
 *
 * Integration with Gallery Route:
 * - /gallery route fetches products with images
 * - transformToGalleryImages() flattens product images
 * - GalleryGrid component displays images in masonry layout
 *
 * @dependencies
 * - None (pure TypeScript transformation)
 *
 * @related
 * - app/routes/gallery.tsx - Gallery page using transformed images
 * - app/components/gallery/GalleryGrid.tsx - Displays gallery images
 * - app/components/gallery/GalleryImageCard.tsx - Individual image card
 */

export interface GalleryImageData {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
    aspectRatio: number;
    productHandle: string;
    productTitle: string;
    collectionHandle: string | null;
    collectionTitle: string | null;
}

export interface GalleryPageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

/**
 * Transform Shopify product nodes into flat gallery image data.
 * Handles optional Shopify API types with sensible defaults.
 */
export function transformToGalleryImages(
    products: Array<{
        handle: string;
        title: string;
        collections: {
            nodes: Array<{
                handle: string;
                title: string;
            }>;
        };
        images: {
            nodes: Array<{
                id?: string | null;
                url: string;
                altText?: string | null;
                width?: number | null;
                height?: number | null;
            }>;
        };
    }>
): GalleryImageData[] {
    const images: GalleryImageData[] = [];

    for (const product of products) {
        const collection = product.collections.nodes[0] ?? null;

        for (let i = 0; i < product.images.nodes.length; i++) {
            const image = product.images.nodes[i];
            // Skip images without required data
            if (!image.url) continue;

            const width = image.width ?? 800;
            const height = image.height ?? 1000;

            images.push({
                id: `${product.handle}-${image.id ?? i}`,
                url: image.url,
                altText: image.altText ?? null,
                width,
                height,
                aspectRatio: width / height,
                productHandle: product.handle,
                productTitle: product.title,
                collectionHandle: collection?.handle ?? null,
                collectionTitle: collection?.title ?? null
            });
        }
    }

    return images;
}
