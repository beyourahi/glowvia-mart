/**
 * @fileoverview PWA manifest app icon with initial-letter fallback.
 * Used in install prompt sheets for visual consistency with the installed app.
 */

import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";

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

/** sm: 48px, md: 64px, lg: 80px */
const sizeClasses = {
    sm: "size-12",
    md: "size-16",
    lg: "size-20"
};

export function PwaAppIcon({src, alt, className, size = "md"}: PwaAppIconProps) {
    const sizeClass = sizeClasses[size];

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
        <Image
            src={src}
            alt={alt || "App icon"}
            className={cn(sizeClass, "rounded-2xl shadow-md object-cover", className)}
        />
    );
}
