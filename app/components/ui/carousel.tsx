/**
 * @fileoverview Carousel component for sliding content galleries
 *
 * @description
 * Touch-enabled carousel built on Embla Carousel with keyboard navigation and
 * optional prev/next buttons. Supports horizontal and vertical orientations.
 *
 * @radix-ui
 * - Library: embla-carousel-react (not Radix, but similar pattern)
 * - Touch/swipe: Native gesture support on mobile
 * - Keyboard: Arrow keys for navigation
 * - Plugins: Supports Embla plugins (autoplay, etc.)
 *
 * @accessibility
 * - ARIA: role="region" with aria-roledescription="carousel"
 * - Slides: role="group" with aria-roledescription="slide"
 * - Keyboard: Arrow Left/Right navigation
 * - Screen readers: "Previous/Next slide" labels on buttons
 * - Buttons: Hidden on mobile (touch/swipe preferred), visible on tablet+
 *
 * @related
 * - ~/routes/_index.tsx - Uses Carousel for featured products
 * - ~/components/ui/button.tsx - Navigation button styling
 */

"use client";

import * as React from "react";
import useEmblaCarousel, {type UseEmblaCarouselType} from "embla-carousel-react";
import {ArrowLeft, ArrowRight} from "lucide-react";

import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
    opts?: CarouselOptions;
    plugins?: CarouselPlugin;
    orientation?: "horizontal" | "vertical";
    setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
    carouselRef: ReturnType<typeof useEmblaCarousel>[0];
    api: ReturnType<typeof useEmblaCarousel>[1];
    scrollPrev: () => void;
    scrollNext: () => void;
    canScrollPrev: boolean;
    canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

/**
 * Hook to access carousel context (API, navigation functions, scroll state)
 * Must be used within Carousel component
 */
function useCarousel() {
    const context = React.useContext(CarouselContext);

    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />");
    }

    return context;
}

/**
 * Carousel container with context provider
 * @param orientation - Scroll direction (horizontal | vertical)
 * @param opts - Embla carousel options
 * @param plugins - Embla carousel plugins
 * @param setApi - Callback to access carousel API
 */
function Carousel({
    orientation = "horizontal",
    opts,
    setApi,
    plugins,
    className,
    children,
    ...props
}: React.ComponentProps<"div"> & CarouselProps) {
    const [carouselRef, api] = useEmblaCarousel(
        {
            ...opts,
            axis: orientation === "horizontal" ? "x" : "y"
        },
        plugins
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const scrollPrev = () => {
        api?.scrollPrev();
    };

    const scrollNext = () => {
        api?.scrollNext();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollPrev();
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollNext();
        }
    };

    React.useEffect(() => {
        if (!api || !setApi) return;
        setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
        if (!api) return;

        // onSelect handler (defined inside useEffect to avoid dependency warning)
        const onSelect = (emblaApi: CarouselApi) => {
            if (!emblaApi) return;
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        };

        onSelect(api);
        api.on("reInit", onSelect);
        api.on("select", onSelect);

        return () => {
            api?.off("select", onSelect);
        };
    }, [api]);

    return (
        <CarouselContext.Provider
            value={{
                carouselRef,
                api,
                opts,
                orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
                scrollPrev,
                scrollNext,
                canScrollPrev,
                canScrollNext
            }}
        >
            <div
                onKeyDownCapture={handleKeyDown}
                className={cn("relative", className)}
                role="region"
                aria-roledescription="carousel"
                data-slot="carousel"
                {...props}
            >
                {children}
            </div>
        </CarouselContext.Provider>
    );
}

/**
 * Content wrapper with overflow handling
 * Contains CarouselItem children
 */
function CarouselContent({className, ...props}: React.ComponentProps<"div">) {
    const {carouselRef, orientation} = useCarousel();

    return (
        <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
            <div
                className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
                {...props}
            />
        </div>
    );
}

/**
 * Individual carousel slide
 * Default: Full width (basis-full), customize via className
 */
function CarouselItem({className, ...props}: React.ComponentProps<"div">) {
    const {orientation} = useCarousel();

    return (
        <div
            role="group"
            aria-roledescription="slide"
            data-slot="carousel-item"
            className={cn(
                "min-w-0 shrink-0 grow-0 basis-full",
                orientation === "horizontal" ? "pl-4" : "pt-4",
                className
            )}
            {...props}
        />
    );
}

/**
 * Previous slide button
 * Hidden on mobile (touch/swipe preferred), visible on tablet+
 */
function CarouselPrevious({
    className,
    variant = "outline",
    size = "icon",
    ...props
}: React.ComponentProps<typeof Button>) {
    const {orientation, scrollPrev} = useCarousel();

    return (
        <Button
            data-slot="carousel-previous"
            variant={variant}
            size={size}
            className={cn(
                // Base styles: larger touch target (44px min), positioned inside container
                "absolute size-10 md:size-11 rounded-full",
                // Hidden on mobile by default (touch/swipe), visible on tablet+
                "hidden md:flex",
                // Positioning: inside container edges, centered vertically/horizontally based on orientation
                orientation === "horizontal"
                    ? "top-1/2 left-2 -translate-y-1/2"
                    : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
                className
            )}
            onClick={scrollPrev}
            {...props}
        >
            <ArrowLeft className="size-4 md:size-5" />
            <span className="sr-only">Previous slide</span>
        </Button>
    );
}

/**
 * Next slide button
 * Hidden on mobile (touch/swipe preferred), visible on tablet+
 */
function CarouselNext({className, variant = "outline", size = "icon", ...props}: React.ComponentProps<typeof Button>) {
    const {orientation, scrollNext} = useCarousel();

    return (
        <Button
            data-slot="carousel-next"
            variant={variant}
            size={size}
            className={cn(
                // Base styles: larger touch target (44px min), positioned inside container
                "absolute size-10 md:size-11 rounded-full",
                // Hidden on mobile by default (touch/swipe), visible on tablet+
                "hidden md:flex",
                // Positioning: inside container edges, centered vertically/horizontally based on orientation
                orientation === "horizontal"
                    ? "top-1/2 right-2 -translate-y-1/2"
                    : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
                className
            )}
            onClick={scrollNext}
            {...props}
        >
            <ArrowRight className="size-4 md:size-5" />
            <span className="sr-only">Next slide</span>
        </Button>
    );
}

export {type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext};
