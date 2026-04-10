/**
 * @fileoverview Avatar component for displaying user profile images with fallback
 *
 * @description
 * Displays circular user avatars with automatic fallback to initials or icon if image
 * fails to load. Handles loading states gracefully.
 *
 * @radix-ui
 * - Primitive: @radix-ui/react-avatar
 * - Image loading: Automatic fallback on error or slow networks
 * - Lazy loading: Supports native lazy loading attributes
 *
 * @accessibility
 * - Images: Require alt text for screen readers
 * - Fallback: Text fallback accessible when image unavailable
 * - Sizing: Consistent 32px (size-8) default for touch targets
 *
 * @related
 * - ~/components/AccountMenu.tsx - Uses Avatar for user profile display
 */

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import {cn} from "~/lib/utils";

/**
 * Avatar container with circular shape
 * Default size: 32px (size-8)
 */
function Avatar({className, ...props}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
            {...props}
        />
    );
}

/**
 * Avatar image element with automatic fallback on error
 */
function AvatarImage({className, ...props}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn("aspect-square size-full", className)}
            {...props}
        />
    );
}

/**
 * Fallback content shown when image fails to load
 * Typically contains user initials or icon
 */
function AvatarFallback({className, ...props}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
            {...props}
        />
    );
}

export {Avatar, AvatarImage, AvatarFallback};
