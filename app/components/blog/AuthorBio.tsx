/**
 * @fileoverview Author bio display — `inline` (name only) and `card` (avatar + bio) variants.
 *
 * Name resolution: prefers `name`, falls back to `firstName + lastName`, then "Author".
 * Avatar initials: first letter of each word, uppercased, capped at 2 characters.
 */

import {cn} from "~/lib/utils";

/** Author data from Shopify Blog API. All fields are optional — Shopify does not enforce author metadata. */
export interface ArticleAuthor {
    name?: string | null;
    bio?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

interface AuthorBioProps {
    /** Author data */
    author: ArticleAuthor;
    /** Visual variant */
    variant?: "inline" | "card";
    /** Additional CSS classes */
    className?: string;
}

export function AuthorBio({author, variant = "inline", className}: AuthorBioProps) {
    const {name, bio, firstName, lastName} = author;

    const displayName = name || [firstName, lastName].filter(Boolean).join(" ") || "Author";

    const initials = displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    if (variant === "inline") {
        return (
            <div className={cn("flex items-center gap-2 min-h-10 sm:min-h-11", className)}>
                <span className="text-sm sm:text-sm md:text-base text-muted-foreground">{displayName}</span>
            </div>
        );
    }

    return (
        <div className={cn("bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8", className)}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
                <div className="shrink-0">
                    <div className="size-12 sm:size-14 md:size-16 lg:size-[72px] rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl text-primary font-medium">
                            {initials}
                        </span>
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2 md:space-y-3">
                    <div className="space-y-0.5">
                        <p className="text-sm sm:text-sm uppercase tracking-wider text-muted-foreground">Written by</p>
                        <h4 className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl font-normal text-primary truncate">
                            {displayName}
                        </h4>
                    </div>

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
