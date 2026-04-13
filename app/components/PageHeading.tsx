import { cn } from "~/lib/utils";

interface PageHeadingProps {
    title: React.ReactNode;
    description?: string | null;
    variant?: "light" | "dark";
    className?: string;
    descriptionClassName?: string;
}

export function PageHeading({
    title,
    description,
    variant = "light",
    className,
    descriptionClassName,
}: PageHeadingProps) {
    const isDark = variant === "dark";

    return (
        <>
            <h1
                className={cn(
                    "font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tight m-0 wrap-break-word hyphens-auto",
                    isDark ? "text-primary-foreground" : "text-primary",
                    className
                )}
            >
                {title}
            </h1>
            {description && (
                <p
                    className={cn(
                        "mt-3 sm:mt-4 md:mt-6 font-sans text-sm sm:text-base md:text-lg lg:text-xl max-w-prose leading-relaxed",
                        isDark ? "text-primary-foreground/70" : "text-primary/70",
                        descriptionClassName
                    )}
                >
                    {description}
                </p>
            )}
        </>
    );
}
