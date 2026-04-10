/**
 * @fileoverview PWA App Icon Component
 *
 * @description
 * Displays the app icon from the PWA manifest with an elegant fallback when unavailable.
 * The fallback shows the first letter of the app name in a rounded square with brand colors.
 * Used in PWA install prompts and instructions for visual consistency with the installed app.
 *
 * @related
 * - ~/components/pwa/IosInstallInstructions - Uses lg variant for prominent display
 * - ~/components/pwa/OpenInAppButton - Provides appIcon prop from manifest
 * - ~/hooks/usePwaInstall - Source of icon and name from manifest
 */

import {cn} from "~/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface PwaAppIconProps {
    /** Icon URL from manifest */
    src: string | null;
    /** App name for fallback and alt text */
    alt: string | null;
    /** Additional CSS classes */
    className?: string;
    /** Icon size variant */
    size?: "sm" | "md" | "lg";
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Size class mappings.
 * sm: 48px, md: 64px, lg: 80px
 */
const sizeClasses = {
    sm: "size-12",
    md: "size-16",
    lg: "size-20"
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PwaAppIcon - Displays app icon with fallback to initial.
 *
 * @param src - Icon URL from manifest (null if unavailable)
 * @param alt - App name for fallback and alt text
 * @param className - Additional Tailwind classes
 * @param size - Size variant: "sm", "md", or "lg" (default: "md")
 */
export function PwaAppIcon({src, alt, className, size = "md"}: PwaAppIconProps) {
    const sizeClass = sizeClasses[size];

    // =============================================================================
    // RENDER
    // =============================================================================

    /**
     * Fallback rendering when no icon available.
     * Shows first letter of app name in branded container.
     */
    if (!src) {
        return (
            <div
                className={cn(
                    sizeClass,
                    "rounded-2xl bg-primary/10 flex items-center justify-center",
                    "shadow-sm border border-border/50",
                    className
                )}
                aria-hidden="true"
            >
                <span className="text-2xl font-bold text-primary">{alt?.[0]?.toUpperCase() || "A"}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || "App icon"}
            className={cn(sizeClass, "rounded-2xl shadow-md object-cover", className)}
        />
    );
}
