/**
 * @fileoverview Catch-All 404 Route Handler
 *
 * @description
 * The "splat" route that catches all unmatched URLs. The loader immediately
 * throws a 404 Response; the custom ErrorBoundary below reads root loader data
 * so the 404 screen can offer a carousel of real menu collections as recovery
 * paths instead of dead-ending the shopper.
 *
 * When root data is unavailable (root loader itself failed, or an unexpected
 * non-404 status bubbled into this boundary), it delegates to
 * OfflineAwareErrorPage — the same fallback used by the root-level boundary —
 * so offline detection and the standard full-page error UI still apply.
 *
 * @architecture
 * Route matching priority:
 * 1. Static routes (e.g., /cart, /search)
 * 2. Dynamic routes (e.g., /products/$handle)
 * 3. This catch-all route ($) — matches everything else
 *
 * @related
 * - app/root.tsx — Exposes RootLoader type and the `root` route id.
 * - app/components/OfflineAwareErrorPage.tsx — Full-page fallback UI.
 * - app/components/RouteErrorBoundary.tsx — Generic fallback used by most routes.
 * - app/components/ExploreCollectionsSection.tsx — Source of the MobileCollectionCard
 *   visual language we mirror below (kept in-file on purpose; see note on the component).
 * - server.ts — Checks for Shopify redirects before the request reaches this loader.
 *
 * @see https://reactrouter.com/how-to/catchall-routes
 */

import {Link, isRouteErrorResponse, useRouteError, useRouteLoaderData, type MetaFunction} from "react-router";
import {Image} from "@shopify/hydrogen";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import type {Route} from "./+types/$";
import {redirectLegacyProductUrl} from "~/lib/legacy-redirect";
import type {RootLoader} from "~/root";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";

export const meta: MetaFunction = () => {
    return [{title: "Page Not Found"}, {name: "robots", content: "noindex"}];
};

// =============================================================================
// LOADER
// =============================================================================

/**
 * Immediately throws a 404 Response for any unmatched route.
 * Runs the legacy-product-URL redirect first so old product links keep working.
 */
export async function loader({request, context}: Route.LoaderArgs) {
    await redirectLegacyProductUrl(request, context.dataAdapter);
    throw new Response("Not Found", {status: 404});
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Placeholder — never rendered. The loader always throws before reaching it.
 * Exists to satisfy React Router's route module contract.
 */
export default function CatchAllPage() {
    return null;
}

// =============================================================================
// ERROR BOUNDARY (custom 404 with recovery UX)
// =============================================================================

/**
 * Menu collection shape produced by root.loader (see app/root.tsx `menuCollections`).
 * Mirrors the Shopify collection node fields selected by MENU_COLLECTIONS_QUERY.
 */
interface MenuCollectionLink {
    id: string;
    handle: string;
    title: string;
    productsCount: number;
    image?: {
        id?: string | null;
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
}

export function ErrorBoundary() {
    const error = useRouteError();
    const rootData = useRouteLoaderData<RootLoader>("root");

    let status = 500;
    let message: string | undefined;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? (typeof error.data === "string" ? error.data : undefined);
    } else if (error instanceof Error) {
        message = error.message;
    }

    // Defer to the full-page fallback when root data never loaded (root loader
    // failure / offline cold start) or when a non-404 status bubbled into this
    // boundary. OfflineAwareErrorPage handles offline detection + generic UI.
    if (!rootData || status !== 404) {
        return <OfflineAwareErrorPage statusCode={status} title={undefined} message={message} />;
    }

    const menuCollections = (rootData.menuCollections ?? []) as MenuCollectionLink[];

    return (
        <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />

            <div className="relative mx-auto w-full max-w-3xl text-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Error 404
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                            Page Not Found
                        </h1>
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                            {message ?? "The page you're looking for doesn't exist or has been moved."}
                        </p>
                        {menuCollections.length > 0 && (
                            <p className="text-sm font-medium text-primary/80">
                                But our collections are still here, waiting for you
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button asChild>
                            <Link to="/">Back to Home</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/collections/all-products">Browse All Products</Link>
                        </Button>
                    </div>

                    <div className="sr-only">
                        <h3>Error 404</h3>
                        <p>Navigate to: Homepage, All Products{menuCollections.length > 0 ? ", Collections" : ""}</p>
                    </div>
                </div>
            </div>

            {/* Collections carousel — full-bleed so the drag feels like the marketing
                sections elsewhere in the store. max-w-none + negative padding escapes
                the parent section's horizontal rhythm without breaking focus on the hero. */}
            {menuCollections.length > 0 && (
                <div className="relative mt-12 w-full max-w-6xl">
                    <Carousel
                        opts={{align: "start", dragFree: true, loop: menuCollections.length > 3}}
                        plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-3 sm:-ml-4">
                            {menuCollections.map(collection => (
                                <CarouselItem
                                    key={collection.id}
                                    className="basis-[72%] pl-3 sm:basis-[45%] sm:pl-4 md:basis-1/3 lg:basis-1/4"
                                >
                                    <NotFoundCollectionCard collection={collection} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            )}
        </section>
    );
}

// =============================================================================
// NotFoundCollectionCard
// =============================================================================

/**
 * Collection tile used only on the 404 screen.
 *
 * Kept inline (rather than exporting a shared CollectionCard) because
 * ExploreCollectionsSection.MobileCollectionCard is typed to the richer
 * ExploreCollectionFragment GraphQL shape (it needs `description`), while the
 * root loader's `menuCollections` is intentionally leaner — it powers nav and
 * doesn't carry descriptions. Reusing the visual language without tangling the
 * two data shapes keeps both surfaces independently refactorable.
 *
 * Visuals mirror MobileCollectionCard: aspect-[3/4] tile, rounded-2xl on mobile
 * / rounded-3xl at sm+, bottom-anchored gradient, sans-serif title in drop-shadow.
 */
function NotFoundCollectionCard({collection}: {collection: MenuCollectionLink}) {
    return (
        <Link
            to={`/collections/${collection.handle}`}
            prefetch="viewport"
            className="group motion-link motion-press block cursor-pointer hover:no-underline active:scale-[var(--motion-press-scale)]"
        >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl">
                {collection.image ? (
                    <Image
                        alt={collection.image.altText || collection.title}
                        data={collection.image}
                        loading="lazy"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 72vw"
                        className="motion-image absolute inset-0 h-full w-full object-cover group-active:scale-[1.03]"
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/30" />
                )}

                <div className="absolute inset-0 bg-linear-to-t from-dark/75 via-dark/25 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-3 text-left sm:p-4 md:p-5">
                    <h3 className="font-sans text-base font-medium text-light drop-shadow-sm sm:text-lg md:text-xl">
                        {collection.title}
                    </h3>
                </div>
            </div>
        </Link>
    );
}
