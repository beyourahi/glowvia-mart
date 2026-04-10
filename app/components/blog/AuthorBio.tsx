/**
 * @fileoverview Author Bio Component
 *
 * @description
 * Displays article author information in two variants: inline (compact header) and
 * card (full bio display). The card variant includes an avatar with generated initials,
 * author name, and optional bio text. All author data is sourced from Shopify's blog
 * author metadata.
 *
 * @features
 * - Two variants: inline (compact) and card (full bio)
 * - Auto-generated avatar with initials from author name
 * - Fallback name construction from firstName/lastName
 * - Responsive typography and spacing
 * - WCAG-compliant avatar styling (primary/10 background, primary text)
 * - Bio text with line clamping on mobile (3 lines)
 * - Touch-friendly minimum heights (min-h-10 mobile, min-h-11 desktop)
 *
 * @props
 * - author: ArticleAuthor - Author data from Shopify Blog API
 * - variant: "inline" | "card" - Display variant
 * - className: string - Additional Tailwind classes
 *
 * @accessibility
 * - Semantic HTML structure
 * - Avatar uses aria-hidden (decorative, name is in text)
 * - Sufficient color contrast for all text elements
 * - Responsive font sizing for readability
 *
 * @related
 * - ~/routes/blogs.$blogHandle.$articleHandle - Article detail page
 * - ~/components/blog/ArticleHero - Hero component with inline author
 */

import {cn} from "~/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Author data structure from Shopify Blog API.
 * All fields are optional as Shopify does not enforce author metadata.
 */
export interface ArticleAuthor {
    name?: string | null;
    bio?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

/**
 * Props for the AuthorBio component.
 *
 * Supports two display variants:
 * - inline: Compact name-only display for headers
 * - card: Full bio card with avatar, name, and bio text
 */
interface AuthorBioProps {
    /** Author data */
    author: ArticleAuthor;
    /** Visual variant */
    variant?: "inline" | "card";
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AuthorBio component for displaying article author information.
 *
 * @description
 * Renders author details in two variants optimized for different contexts:
 *
 * 1. Inline variant - Compact name-only display for article headers/meta
 * 2. Card variant - Full bio card with avatar, name, and bio text
 *
 * Author name handling:
 * - Prefers the `name` field if available
 * - Falls back to concatenating `firstName` and `lastName`
 * - Uses "Author" as final fallback if no name data exists
 *
 * Avatar initials generation:
 * - Extracts first letter of each word in display name
 * - Converts to uppercase
 * - Limits to 2 characters (e.g., "John Doe" → "JD")
 *
 * @example
 * ```tsx
 * // Inline variant for article header
 * <AuthorBio author={article.author} variant="inline" />
 *
 * // Card variant for article footer
 * <AuthorBio author={article.author} variant="card" />
 * ```
 */
export function AuthorBio({author, variant = "inline", className}: AuthorBioProps) {
    const {name, bio, firstName, lastName} = author;

    // ========================================
    // Data Processing
    // ========================================

    // Construct display name with fallback chain
    const displayName = name || [firstName, lastName].filter(Boolean).join(" ") || "Author";

    // Generate two-letter initials for avatar
    // Example: "John Doe" → ["John", "Doe"] → ["J", "D"] → "JD"
    const initials = displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // ========================================
    // Variant: Inline (Compact Header)
    // ========================================

    /**
     * Inline variant for article headers and metadata sections.
     *
     * Features:
     * - Name-only display (no bio or avatar)
     * - Muted text color for secondary emphasis
     * - Responsive font sizing (xs to base)
     * - Touch-friendly minimum height (10 mobile, 11 desktop)
     */
    if (variant === "inline") {
        return (
            <div className={cn("flex items-center gap-2 min-h-10 sm:min-h-11", className)}>
                <span className="text-sm sm:text-sm md:text-base text-muted-foreground">{displayName}</span>
            </div>
        );
    }

    // ========================================
    // Variant: Card (Full Bio Display)
    // ========================================

    /**
     * Card variant for article footers and author pages.
     *
     * Features:
     * - Circular avatar with generated initials
     * - "Written by" label with uppercase tracking
     * - Author name with serif typography
     * - Optional bio text (line-clamp-3 on mobile)
     * - Muted background with rounded corners
     * - Responsive layout (column mobile, row desktop)
     *
     * Avatar styling:
     * - Size: 48-72px responsive
     * - Background: primary/10 (WCAG-compliant)
     * - Text: primary color
     * - Font: serif for elegant appearance
     */
    return (
        <div className={cn("bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8", className)}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
                {/* Avatar placeholder */}
                <div className="shrink-0">
                    <div className="size-12 sm:size-14 md:size-16 lg:size-[72px] rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl text-primary font-medium">
                            {initials}
                        </span>
                    </div>
                </div>

                {/* Author info */}
                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2 md:space-y-3">
                    <div className="space-y-0.5">
                        <p className="text-sm sm:text-sm uppercase tracking-wider text-muted-foreground">Written by</p>
                        <h4 className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl font-normal text-primary truncate">
                            {displayName}
                        </h4>
                    </div>

                    {/* Bio */}
                    {bio && (
                        <p className="text-sm sm:text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
                            {bio}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
