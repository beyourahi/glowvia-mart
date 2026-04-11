/**
 * @fileoverview VideoHero - Full-viewport hero section with animated brand text
 *
 * @description
 * Homepage hero section with full-bleed video/image background, content overlay, and
 * animated brand text that transforms from hero to header on scroll. Integrates with
 * BrandAnimationProvider for synchronized scroll-driven animations.
 *
 * @features
 * - **Responsive Background Media**: Separate mobile/large screen media from CMS, with cross-fallback and local fallback
 * - **Content Layers**: Gradient overlay, text content (left-aligned), shop CTA, promo card
 * - **Scroll Animation Integration**: AnimatedBrandText transforms from hero to header
 * - **Responsive Layout**: Mobile-first with collapsing promo card, adjusted text sizing
 * - **Accessibility**: WCAG-compliant text contrast (4.5:1 on gradient overlay), 44px touch targets
 *
 * @props
 * None - VideoHero is self-contained and pulls data from site settings context
 *
 * @related
 * - BrandAnimation.tsx - Provides scroll animation context and AnimatedBrandText component
 * - lib/site-content-context.ts - Provides hero content from site_settings metaobject
 * - types/index.ts - HeroMedia type definition
 */

import {useEffect, useRef} from "react";
import {Link} from "react-router";
import {CircleArrowOutUpRight, Search} from "lucide-react";
import {useBrandAnimation, AnimatedBrandText} from "~/components/BrandAnimation";
import {useAside} from "~/components/Aside";
import {ParallaxLayer} from "~/components/motion/ParallaxLayer";
import {useSiteSettings} from "~/lib/site-content-context";
import {useScreenSize, BREAKPOINTS} from "~/hooks/useScreenSize";
import {truncateText} from "~/lib/utils";
import type {HeroMedia} from "types";

const FALLBACK_HERO_MEDIA_CONFIG: {type: "video" | "image"; videoSrc?: string; imageSrc?: string} = {
    type: "video",
    videoSrc: "/hero-video.mp4"
};
import type {HeroCollection} from "~/routes/_index";

// ============================================================================
// Hero Background Media Component
// ============================================================================

/**
 * Renders responsive hero background media with viewport-aware source selection
 *
 * @param mobile - HeroMedia for mobile viewports (< 768px)
 * @param largeScreen - HeroMedia for large screens (>= 768px)
 *
 * Rendering strategy (hybrid for optimal LCP):
 * - Both images: <picture> element with <source media="..."> (browser-native, no JS)
 * - Any video involved: JS conditional via useScreenSize (SSR defaults to large screen)
 *
 * Fallback chain: mobile → largeScreen → FALLBACK_HERO_MEDIA_CONFIG.videoSrc (and vice versa)
 */
function HeroBackgroundMedia({
    mobile,
    largeScreen,
    fallbackVideoSrc
}: {
    mobile?: HeroMedia;
    largeScreen?: HeroMedia;
    fallbackVideoSrc?: string;
}) {
    const {width, isHydrated} = useScreenSize();

    // Cross-fallback: if only one variant is set, use it for both viewports
    const effectiveMobile = mobile || largeScreen;
    const effectiveLargeScreen = largeScreen || mobile;

    // Mixed or video: JS-based viewport detection
    // SSR defaults to large screen (isHydrated=false → use large screen variant)
    const isMobileViewport = isHydrated && width !== null && width < BREAKPOINTS.md;
    const activeMedia = isMobileViewport ? effectiveMobile : effectiveLargeScreen;

    // Re-trigger load+play when the active source URL changes after hydration
    // (browser won't reload <video> automatically when only <source src> changes)
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const video = videoRef.current;
        if (!video || activeMedia?.mediaType !== "video") return;
        video.load();
        video.play().catch(() => {});
    }, [activeMedia?.url, activeMedia?.mediaType]);

    // Optimal path: both are images → use <picture> (SSR-safe, no double download)
    if (effectiveMobile?.mediaType === "image" && effectiveLargeScreen?.mediaType === "image") {
        return (
            <picture>
                <source
                    media={`(min-width: ${BREAKPOINTS.md}px)`}
                    srcSet={effectiveLargeScreen.url}
                    width={effectiveLargeScreen.width}
                    height={effectiveLargeScreen.height}
                />
                <img
                    src={effectiveMobile.url}
                    alt={effectiveMobile.altText || "Hero background"}
                    width={effectiveMobile.width}
                    height={effectiveMobile.height}
                    className="size-full object-cover"
                />
            </picture>
        );
    }

    if (activeMedia?.mediaType === "video") {
        return (
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
                className="size-full object-cover"
                poster={activeMedia.previewImage?.url}
            >
                <source src={activeMedia.url} type="video/mp4" />
            </video>
        );
    }

    if (activeMedia?.mediaType === "image") {
        return (
            <img
                src={activeMedia.url}
                alt={activeMedia.altText || "Hero background"}
                className="size-full object-cover"
            />
        );
    }

    // Ultimate fallback: local video
    return (
        <video autoPlay loop muted playsInline aria-hidden="true" className="size-full object-cover">
            <source src={fallbackVideoSrc || "/hero-video.mp4"} type="video/mp4" />
        </video>
    );
}

// ============================================================================
// Main VideoHero Component
// ============================================================================

/**
 * VideoHero - Full-viewport hero section with animated content
 *
 * Layout structure:
 * 1. Background layer: Video/image with gradient overlay
 * 2. Content layer: Text (tagline, heading, description) + Shop Now CTA
 * 3. Promo card: Bottom-right collection preview (desktop only, animated bounce)
 *    - DYNAMIC: Shows random collection from Shopify if available
 *    - FALLBACK: Uses metaobject content if no collection provided
 * 4. Animated brand text: Large text at bottom that animates to header on scroll
 *
 * Responsive behavior:
 * - Mobile: Text left-aligned, promo card hidden, compact spacing
 * - Tablet: Larger text, more spacing, promo card still hidden
 * - Desktop: Full layout with promo card, maximum spacing
 *
 * CMS Integration:
 * - All text content from site_settings metaobject (heroHeading, heroDescription, etc.)
 * - Brand words for tagline (first 3 joined with " · ")
 * - Hero media (video or image) with fallback
 *
 * Dynamic Collection Showcase:
 * - Accepts optional randomCollection prop from homepage loader
 * - If provided, displays collection image, truncated description, and link to collection
 * - Falls back to static metaobject content if no collection or on error
 * - Creates fresh, dynamic homepage content on each page load
 *
 * Animation Integration:
 * - Registers with BrandAnimationProvider via setIsHomePage effect
 * - AnimatedBrandText component handles scroll-driven transformation
 */
export function VideoHero({randomCollection}: {randomCollection?: HeroCollection | null}) {
    const {heroRef, setIsHomePage} = useBrandAnimation();
    const {open: openSearch} = useAside();
    const {heroHeading, heroDescription, heroMediaMobile, heroMediaLargeScreen, brandWords} = useSiteSettings();
    const fallbackVideoSrc = (FALLBACK_HERO_MEDIA_CONFIG as {videoSrc?: string}).videoSrc;

    // Generate tagline from first 3 brand words
    const heroTagline = brandWords.slice(0, 3).join(" · ");

    // =========================================================================
    // DYNAMIC COLLECTION SHOWCASE LOGIC
    // =========================================================================
    // Hero card showcases a random collection with its image and description.
    // Fallback to hero media image if no collection is provided.

    // Card Image: Collection image > Hero large screen media > Fallback
    // Uses large screen variant because the promo card is desktop-only (hidden md:flex)
    const effectiveLargeScreenMedia = heroMediaLargeScreen || heroMediaMobile;
    const cardImage = randomCollection?.image
        ? {url: randomCollection.image.url, altText: randomCollection.image.altText}
        : effectiveLargeScreenMedia?.mediaType === "image"
          ? {url: effectiveLargeScreenMedia.url, altText: effectiveLargeScreenMedia.altText}
          : effectiveLargeScreenMedia?.mediaType === "video" && effectiveLargeScreenMedia.previewImage
            ? effectiveLargeScreenMedia.previewImage
            : null;

    // Card Description: Truncated collection description > Hardcoded text
    // Truncate to ~120 chars as first pass; CSS line-clamp-3 handles visual overflow
    // This prevents very long descriptions from bloating the DOM unnecessarily
    const cardText = randomCollection?.description
        ? truncateText(randomCollection.description, 120, {stripHtml: true, breakOnWord: true})
        : "Explore our curated collection of rare essences.";

    // Card CTA Link: Collection page > All products
    const cardLink = randomCollection ? `/collections/${randomCollection.handle}` : "/collections/all-products";

    // Card CTA Text: Hardcoded for consistent branding
    const cardCtaText = "Discover Yours";

    // Mark that we're on the home page (where VideoHero is present)
    // This enables the BrandAnimation scroll transformation
    useEffect(() => {
        setIsHomePage(true);
        return () => setIsHomePage(false);
    }, [setIsHomePage]);

    return (
        <section ref={heroRef} className="group grid h-dvh overflow-hidden w-full p-0">
            {/* Background Media (Video or Image) with Gradient */}
            <div className="relative col-start-1 row-start-1 w-full h-full overflow-hidden @container">
                <ParallaxLayer className="size-full" contentClassName="size-full" amplitude={32} scale={1.08}>
                    <HeroBackgroundMedia
                        mobile={heroMediaMobile}
                        largeScreen={heroMediaLargeScreen}
                        fallbackVideoSrc={fallbackVideoSrc}
                    />
                </ParallaxLayer>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50 motion-surface lg:bg-black/60 lg:group-hover:bg-black/50" />

                {/* Hero Content - Center-left
                     Responsive positioning and max-width to prevent overflow at 320px
                     Extended positioning and max-width for ultrawide screens */}
                <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 md:left-8 lg:left-12 xl:left-16 2xl:left-24 3xl:left-32 right-3 sm:right-auto z-[10] max-w-[calc(100%-1.5rem)] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
                    {/* Text Content */}
                    <div className="flex flex-col mb-6 md:mb-8">
                        {/* Tagline */}
                        <p className="font-sans text-xs sm:text-sm md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] text-light/90">
                            {heroTagline}
                        </p>

                        {/* Main Heading
                             Responsive text sizing: clamp ensures smooth fluid scaling across all viewports
                             - min 2rem (32px): readable on 320px mobile without overflow
                             - 4.5vw: fluid scale through tablet/laptop breakpoints
                             - max 5.5rem (88px): visually impactful on large desktop/ultrawide without being excessive
                             Allow text wrapping on mobile (no whitespace-nowrap)
                             whitespace-nowrap applied at sm+ where there's enough space
                             Extended breakpoints for large desktop (2xl) and ultrawide (3xl) */}
                        <h1 className="font-serif text-light font-medium leading-[1.1] sm:leading-tight my-3 sm:my-4 md:my-6 sm:whitespace-nowrap" style={{fontSize: "clamp(2rem, 4.5vw, 5.5rem)"}}>
                            {heroHeading}
                        </h1>

                        {/* Description - scales up for larger screens
                             text-sm (14px) mobile → text-base (16px) tablet → text-lg (18px) desktop
                             Follows 16px baseline standard for readable body text at a glance */}
                        <p className="font-sans text-sm md:text-base lg:text-lg text-light/85 leading-relaxed">
                            {heroDescription}
                        </p>
                    </div>

                    {/* CTA Row: Shop Now + Search trigger
                        Search button is icon-only (ghost/outline), visually subordinate to Shop Now.
                        Both share the same pill radius and vertical rhythm for deliberate pairing.

                        Shop Now (inverted CTA pattern):
                        - Default: bg-primary (dark), text-primary-foreground (white), border-primary
                        - Hover: bg-light (white), text-primary (dark), border-light
                        Contrast: #fff on bg-primary = 14.68:1 (WCAG AAA) ✓ | #1f1f1f on #fff = 14.68:1 ✓

                        Search (ghost on dark hero overlay):
                        - Default: bg-transparent, border-light/40, text-light
                        - Hover: bg-light/15, border-light/65
                        Contrast: text-light (#fff) over dark overlay background > 7:1 (WCAG AAA) ✓

                        Touch targets: py-3 + icon h-5 ≈ 44px minimum (WCAG 2.5.5) ✓ */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link
                            to="/collections/all-products"
                            className="group inline-flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 rounded-[var(--radius-pill-raw)] bg-primary border-2 border-primary px-4 sm:px-5 md:px-6 py-3 md:py-3.5 font-sans text-sm md:text-base font-medium text-primary-foreground no-underline hover:no-underline sleek hover:bg-light hover:text-primary hover:border-light active:bg-light/90 active:border-light active:scale-[0.98] cursor-pointer"
                        >
                            Shop Now
                            <CircleArrowOutUpRight className="w-5 h-5 md:w-6 md:h-6 sleek lg:rotate-45 group-hover:rotate-45 lg:group-hover:rotate-90" />
                        </Link>

                        <button
                            type="button"
                            onClick={() => openSearch("search")}
                            aria-label="Search"
                            className="inline-flex items-center justify-center rounded-[var(--radius-pill-raw)] bg-transparent border-2 border-light/40 text-light px-3 md:px-3.5 py-3 md:py-3.5 sleek hover:bg-light/15 hover:border-light/65 active:scale-[0.98] cursor-pointer"
                        >
                            <Search className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>

                {/* Collection Promo Card - Bottom right, hidden on mobile
                     DYNAMIC CONTENT: Shows random collection if available, falls back to hardcoded text
                     Image: collection.image > hero media > fallback
                     Text: truncated collection.description > hardcoded text
                     CTA: hardcoded "Discover Yours"
                     Link: /collections/{handle} > /collections/all-products */}
                {/* text-foreground on bg-overlay-light-hover: ~15:1 (WCAG AAA) ✓
                     bg-overlay-light-hover → brand-accent-subtle is always L≈0.92 (light surface)
                     → dark text required for all brands universally */}
                <Link
                    to={cardLink}
                    className="hidden md:flex absolute top-[60%] right-8 z-[10] w-90 lg:w-105 h-auto rounded-2xl overflow-hidden bg-overlay-light-hover backdrop-blur-md border border-foreground/15 no-underline hover:no-underline group sleek hover:bg-light/30 animate-float-gentle will-change-transform motion-reduce:animate-none cursor-pointer"
                >
                    {/* Image container with fixed aspect ratio - prevents flex stretching */}
                    <div className="w-36 lg:w-44 shrink-0 aspect-video overflow-hidden">
                        <img
                            src={cardImage?.url || "/hero-image.avif"}
                            alt={
                                randomCollection
                                    ? `${randomCollection.title} collection`
                                    : cardImage?.altText || "Collection preview"
                            }
                            className="w-full h-full object-cover border border-r-0 border-foreground/15 rounded-l-2xl"
                        />
                    </div>
                    {/* Text container: flex-1 takes remaining space, min-w-0 prevents flex blowout */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-3 lg:px-6 lg:py-4">
                        {/* Line clamp ensures text never overflows regardless of description length */}
                        <p className="font-serif text-sm lg:text-base text-foreground leading-snug mb-2 line-clamp-3">
                            {cardText}
                        </p>
                        <span className="font-sans text-sm lg:text-base font-semibold text-foreground group-hover:text-primary motion-interactive shrink-0">
                            {cardCtaText}
                        </span>
                    </div>
                </Link>

                {/* Animated Brand Text - transforms from hero to header on scroll */}
                <AnimatedBrandText />
            </div>
        </section>
    );
}
