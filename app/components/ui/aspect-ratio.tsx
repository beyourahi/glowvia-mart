/**
 * @fileoverview AspectRatio component for maintaining consistent width-to-height ratios
 *
 * @description
 * Ensures content (typically images or videos) maintains a specific aspect ratio across
 * different viewport sizes. Prevents layout shift during media loading.
 *
 * @radix-ui
 * - Primitive: @radix-ui/react-aspect-ratio
 * - CSS technique: Uses padding-top percentage trick for reliable aspect ratio
 *
 * @accessibility
 * - Responsive: Automatically scales while maintaining ratio
 * - Layout stability: Prevents cumulative layout shift (CLS)
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={16/9}>
 *   <img src="image.jpg" alt="Description" />
 * </AspectRatio>
 * ```
 *
 * @related
 * - ~/components/ProductImage.tsx - Uses AspectRatio for product images
 */

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/**
 * Container that maintains a specific aspect ratio
 * @param ratio - Width/height ratio (e.g., 16/9, 4/3, 1/1)
 */
function AspectRatio({...props}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
    return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export {AspectRatio};
