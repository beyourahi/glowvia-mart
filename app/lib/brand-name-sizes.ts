/**
 * Canonical brand name font sizes — single source of truth.
 *
 * All three consumers (Header nav, BrandAnimation end state, FullScreenMenu header)
 * must reference these values. Edit here to change all three simultaneously.
 *
 * Tailwind equivalents: text-sm (14px) | text-lg (18px) | text-xl (20px)
 */
export const BRAND_NAME_SIZES_PX = {
    mobile: 14, // text-sm = 0.875rem  — viewport < 640px
    sm: 18,     // text-lg = 1.125rem  — 640px ≤ viewport < 768px
    md: 20,     // text-xl = 1.25rem   — viewport ≥ 768px
} as const;

/** Breakpoint boundaries matching the Tailwind sm/md defaults. */
export const BRAND_NAME_SM_BREAKPOINT = 640;
export const BRAND_NAME_MD_BREAKPOINT = 768;

/**
 * Tailwind responsive class that encodes the same three sizes.
 * Use in JSX wherever the brand name is rendered as a static element.
 */
export const BRAND_NAME_FONT_CLASS = "text-sm sm:text-lg md:text-xl" as const;
