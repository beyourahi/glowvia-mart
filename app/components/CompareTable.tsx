import {useNavigate, useSearchParams, Link} from "react-router";
import {Package, X} from "lucide-react";
import {CartForm} from "@shopify/hydrogen";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {AnimatedSection} from "~/components/AnimatedSection";
import {CART_FETCHER_KEY} from "~/lib/cart-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

export type CompareProduct = {
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function CompareProductColumn({
    product,
    onRemove
}: {
    product: CompareProduct;
    onRemove: (id: string) => void;
}) {
    return (
        <div className="relative flex flex-col gap-3">
            <button
                onClick={() => onRemove(product.id)}
                aria-label={`Remove ${product.title} from comparison`}
                className="absolute -top-1 -right-1 z-10 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none"
            >
                <X size={14} strokeWidth={1.5} />
            </button>

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

            <p className="text-sm font-medium text-foreground leading-snug pr-5 text-left">
                {product.title}
            </p>
        </div>
    );
}

export function CompareEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-4">
            <Package size={24} strokeWidth={1} className="text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Select products to compare</p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CompareTableProps {
    products: CompareProduct[];
    onRemove: (productId: string) => void;
}

/**
 * Side-by-side product comparison table.
 * Renders attribute rows and per-product action buttons.
 * Feature 20 — Help me choose comparison.
 */
export function CompareTable({products, onRemove}: CompareTableProps) {
    const rows = buildAttributeRows(products);

    return (
        <AnimatedSection animation="slide-up" threshold={0}>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full border-collapse" style={{minWidth: `${products.length * 220 + 160}px`}}>
                    <colgroup>
                        <col style={{width: "160px"}} />
                        {products.map(p => (
                            <col key={p.id} />
                        ))}
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="pb-6 align-bottom" />
                            {products.map(p => (
                                <th key={p.id} className="pb-6 px-4 align-top">
                                    <CompareProductColumn product={p} onRemove={onRemove} />
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map(row => (
                            <tr key={row.label} className="border-b border-border/40">
                                <td className="py-4 pr-4 align-middle">
                                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                                        {row.label}
                                    </span>
                                </td>
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

                        {/* Actions row */}
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
                                                        lines: [{merchandiseId: firstVariant.id, quantity: 1}]
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
    );
}

// ─── URL helper ───────────────────────────────────────────────────────────────

/**
 * Hook to manage compare URL params — add/remove product IDs while preserving others.
 */
export function useCompareNavigation() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const removeProduct = (productId: string) => {
        const currentIds = searchParams.getAll("ids");
        const next = currentIds.filter(id => id !== productId);
        if (next.length === 0) {
            void navigate("/compare", {replace: true});
        } else {
            const params = new URLSearchParams();
            next.forEach(id => params.append("ids", id));
            void navigate(`/compare?${params.toString()}`, {replace: true});
        }
    };

    return {removeProduct};
}
