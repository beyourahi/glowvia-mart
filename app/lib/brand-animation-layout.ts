/**
 * @fileoverview Layout math for the homepage brand-name scroll animation.
 *
 * This helper keeps the end-position calculation isolated so it can be regression-tested
 * against different header layouts (for example, announcement banner visible vs hidden).
 */

export interface BrandAnimationTargetLayout {
    announcementHeight: number;
    announcementGap: number;
    headerHeight: number;
    headerPaddingTop: number;
    scaledHeight: number;
}

/**
 * Calculate the animated brand text's final top offset in the viewport.
 *
 * Uses the live header/announcement stack metrics from CSS custom properties so the
 * final target stays aligned when the announcement banner is conditionally hidden.
 */
export function calculateBrandAnimationEndY(layout: BrandAnimationTargetLayout): number {
    return (
        layout.announcementHeight +
        layout.announcementGap +
        layout.headerPaddingTop +
        (layout.headerHeight - layout.scaledHeight) / 2
    );
}
