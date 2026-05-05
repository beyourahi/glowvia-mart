/**
 * @fileoverview Lucide Share icon wrapper styled to resemble the iOS Safari share button.
 * Used in IosInstallInstructions to provide a familiar visual cue for step 1.
 */

import {Share} from "lucide-react";
import {cn} from "~/lib/utils";

interface SafariShareIconProps {
    className?: string;
}

export function SafariShareIcon({className}: SafariShareIconProps) {
    return <Share className={cn("size-6", className)} aria-hidden="true" />;
}
