/**
 * @fileoverview ProductLightbox component barrel export
 *
 * @exports
 * - ProductLightbox: Full-screen media viewer component
 * - ProductLightboxProps: Type for component props (re-exported from types.d.ts)
 *
 * @usage
 * ```tsx
 * import { ProductLightbox } from "~/components/ProductLightbox";
 *
 * <ProductLightbox
 *   media={product.media.nodes}
 *   initialIndex={0}
 *   isOpen={lightboxOpen}
 *   onClose={() => setLightboxOpen(false)}
 * />
 * ```
 */

export {ProductLightbox} from "./ProductLightbox";
export type {ProductLightboxProps} from "types";
