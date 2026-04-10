/**
 * @fileoverview Safari Share Icon Component
 *
 * @description
 * Simple wrapper around Lucide's Share icon representing the iOS Safari share button.
 * Used exclusively in iOS PWA installation instructions to provide a familiar visual
 * cue for users. The Share icon closely matches the platform-native share button design.
 *
 * @related
 * - ~/components/pwa/IosInstallInstructions - Uses this icon in step 1
 */

import {Share} from "lucide-react";
import {cn} from "~/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface SafariShareIconProps {
    className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SafariShareIcon - iOS Safari share button icon.
 *
 * @param className - Additional Tailwind classes (default: size-6)
 */
export function SafariShareIcon({className}: SafariShareIconProps) {
    return <Share className={cn("size-6", className)} aria-hidden="true" />;
}
