/**
 * @fileoverview Product Comparison Page
 *
 * @description
 * Side-by-side product attribute comparison for up to 4 products.
 * URL pattern: /compare?ids=GID1&ids=GID2&ids=GID3&ids=GID4
 *
 * @route GET /compare
 * @query ids — Shopify product GIDs (up to 4, minimum 2 to show comparison)
 *
 * @features
 * - Fetches up to 4 products in parallel
 * - Attribute rows: Price, Brand, Type, In Stock
 * - Remove product from comparison via × button
 * - Add to cart (first variant) + view product links
 * - Empty state when fewer than 2 products
 *
 * @design
 * Strict monochromatic — blacks, whites, grays only.
 * Editorial precision: thin borders, lots of whitespace, no color accents.
 * Attribute labels in uppercase tracking-widest. Rounded-none buttons.
 *
 * @data
 * Products fetched via inline COMPARE_PRODUCT_QUERY (lightweight, compare-optimised).
 * Parallel fetches via Promise.all.
 *
 * @related
 * - lib/agentic/compare.ts — comparison matrix builder (MCP / agent layer)
 * - lib/currency-formatter.ts — price formatting
 */

import {useLoaderData, Link, useNavigate, useSearchParams} from "react-router";
import type {Route} from "./+types/compare";
import {getSeoMeta, CartForm} from "@shopify/hydrogen";
import {Package, X} from "lucide-react";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {AnimatedSection} from "~/components/AnimatedSection";
import {CART_FETCHER_KEY} from "~/lib/cart-utils";

// =============================================================================
// META
// =============================================================================

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    return (
        getSeoMeta({
            title: "Compare Products",
            titleTemplate: `%s | ${brandName}`,
            description: "Compare products side by side to find the perfect match.",
            url: buildCanonicalUrl("/compare", siteUrl)
        }) ?? []
    );
};

// =============================================================================
// LOADER
// =============================================================================

export async function loader({request, context}: Route.LoaderArgs) {
    const url = new URL(request.url);
    const ids = url.searchParams.getAll("ids").slice(0, 4);

    if (ids.length === 0) {
        return {products: [], tooFew: true};
    }

    const results = await Promise.all(
        ids.map(id =>
            context.dataAdapter
                .query(COMPARE_PRODUCT_QUERY, {
                    variables: {id},
                    cache: context.dataAdapter.CacheShort()
                })
                .then((d: {product: CompareProduct | null}) => d.product)
                .catch(() => null)
        )
    );

    const products = results.filter((p): p is CompareProduct => p !== null);
    return {products, tooFew: products.length < 2};
}

// =============================================================================
// TYPES
// =============================================================================

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type CompareProduct = {
    id: string;
    title: string;
    handle: string;
    availableForSale: boolean;
    vendor: string | null;
    productType: string | null;
    featuredImage: {url: string; altText: string | null} | null;
    priceRange: {minVariantPrice: ShopifyMoney};
    compareAtPriceRange: {minVariantPrice: ShopifyMoney};
    variants: {nodes: Array<{id: string; availableForSale: boolean; price: ShopifyMoney}>};
};

// =============================================================================
// ATTRIBUTE ROW BUILDER
// =============================================================================

type AttributeRow = {
    label: string;
    values: (string | null)[];
};

function buildAttributeRows(products: CompareProduct[]): AttributeRow[] {
    return [
        {
            label: "Price",
            values: products.map(p => formatShopifyMoney(p.priceRange.minVariantPrice))
        },
        {
            label: "Brand",
            values: products.map(p => p.vendor || null)
        },
        {
            label: "Type",
            values: products.map(p => p.productType || null)
        },
        {
            label: "In Stock",
            values: products.map(p => (p.availableForSale ? "Yes" : "No"))
        }
    ];
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function Compare() {
    const {products, tooFew} = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    function handleRemove(productId: string) {
        const currentIds = searchParams.getAll("ids");
        const next = currentIds.filter(id => id !== productId);
        if (next.length === 0) {
            void navigate("/compare", {replace: true});
        } else {
            const params = new URLSearchParams();
            next.forEach(id => params.append("ids", id));
            void navigate(`/compare?${params.toString()}`, {replace: true});
        }
    }

    const rows = !tooFew ? buildAttributeRows(products) : [];

    return (
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
            <AnimatedSection animation="fade" threshold={0.05}>
                <header className="pt-(--page-breathing-room) mb-10 md:mb-14">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                        Compare
                    </h1>
                    {!tooFew && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            {products.length} product{products.length !== 1 ? "s" : ""} selected
                        </p>
                    )}
                </header>
            </AnimatedSection>

            {tooFew ? (
                <AnimatedSection animation="fade" threshold={0.05}>
                    <EmptyState />
                </AnimatedSection>
            ) : (
                <AnimatedSection animation="slide-up" threshold={0}>
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                        <table className="w-full border-collapse" style={{minWidth: `${products.length * 220 + 160}px`}}>
                            <colgroup>
                                {/* Label column */}
                                <col style={{width: "160px"}} />
                                {products.map(p => (
                                    <col key={p.id} />
                                ))}
                            </colgroup>

                            {/* ── Product header row ── */}
                            <thead>
                                <tr>
                                    {/* Empty label cell */}
                                    <th className="pb-6 align-bottom" />
                                    {products.map(p => (
                                        <th key={p.id} className="pb-6 px-4 align-top">
                                            <ProductColumn product={p} onRemove={handleRemove} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* ── Attribute rows ── */}
                            <tbody>
                                {rows.map(row => (
                                    <tr key={row.label} className="border-b border-border/40">
                                        {/* Label */}
                                        <td className="py-4 pr-4 align-middle">
                                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                                                {row.label}
                                            </span>
                                        </td>
                                        {/* Values */}
                                        {row.values.map((val, j) => (
                                            <td
                                                key={`${row.label}-${products[j].id}`}
                                                className="py-4 px-4 align-middle text-sm text-foreground"
                                            >
                                                {val !== null ? (
                                                    <span>{val}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                                {/* ── Actions row ── */}
                                <tr>
                                    <td className="pt-6 pr-4 align-top">
                                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                                            Actions
                                        </span>
                                    </td>
                                    {products.map(p => {
                                        const firstVariant = p.variants.nodes[0];
                                        return (
                                            <td key={p.id} className="pt-6 px-4 align-top">
                                                <div className="flex flex-col gap-2.5">
                                                    {firstVariant?.availableForSale && (
                                                        <CartForm
                                                            route="/cart"
                                                            fetcherKey={CART_FETCHER_KEY}
                                                            action={CartForm.ACTIONS.LinesAdd}
                                                            inputs={{
                                                                lines: [
                                                                    {
                                                                        merchandiseId: firstVariant.id,
                                                                        quantity: 1
                                                                    }
                                                                ]
                                                            }}
                                                        >
                                                            <button
                                                                type="submit"
                                                                className="w-full border border-foreground px-4 py-2 text-xs uppercase tracking-widest font-medium rounded-none transition-colors duration-150 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            >
                                                                Add to Cart
                                                            </button>
                                                        </CartForm>
                                                    )}
                                                    <Link
                                                        to={`/products/${p.handle}`}
                                                        viewTransition
                                                        prefetch="intent"
                                                        className="text-xs text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors duration-150"
                                                    >
                                                        View product
                                                    </Link>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </AnimatedSection>
            )}
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Individual product column — image, title, remove button.
 */
function ProductColumn({
    product,
    onRemove
}: {
    product: CompareProduct;
    onRemove: (id: string) => void;
}) {
    return (
        <div className="relative flex flex-col gap-3">
            {/* Remove button */}
            <button
                onClick={() => onRemove(product.id)}
                aria-label={`Remove ${product.title} from comparison`}
                className="absolute -top-1 -right-1 z-10 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none"
            >
                <X size={14} strokeWidth={1.5} />
            </button>

            {/* Product image */}
            <div className="aspect-square w-full overflow-hidden bg-muted border border-border/40">
                {product.featuredImage ? (
                    <img
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText ?? product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={32} strokeWidth={1} className="text-muted-foreground/40" />
                    </div>
                )}
            </div>

            {/* Product title */}
            <p className="text-sm font-medium text-foreground leading-snug pr-5 text-left">
                {product.title}
            </p>
        </div>
    );
}

/**
 * Empty state — shown when fewer than 2 products are selected.
 */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-4">
            <Package size={24} strokeWidth={1} className="text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Select products to compare</p>
        </div>
    );
}

// =============================================================================
// GRAPHQL
// =============================================================================

/**
 * Lightweight product query for comparison — includes only fields
 * needed for the comparison table and add-to-cart action.
 */
const COMPARE_PRODUCT_QUERY = `#graphql
  query CompareProduct($id: ID!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(id: $id) {
      id
      title
      handle
      availableForSale
      vendor
      productType
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 1) {
        nodes {
          id
          availableForSale
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
