import type {MappedProductOptions} from "@shopify/hydrogen";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {Bot} from "lucide-react";

type MoneyV2 = {amount: string; currencyCode: string};

type AgentVariant = {
    price?: MoneyV2 | null;
    compareAtPrice?: MoneyV2 | null;
    availableForSale?: boolean | null;
};

type AgentProductBriefProps = {
    product: {
        title: string;
        vendor?: string;
        productType?: string;
        description?: string;
        handle: string;
        tags?: string[];
        collections?: {nodes: Array<{handle: string; title: string}>};
    };
    selectedVariant: AgentVariant;
    productOptions: MappedProductOptions[];
};

export function AgentProductBrief({product, selectedVariant, productOptions}: AgentProductBriefProps) {
    const price = selectedVariant?.price;
    const compareAtPrice = selectedVariant?.compareAtPrice;
    const isAvailable = selectedVariant?.availableForSale ?? false;
    const collections = product.collections?.nodes ?? [];
    const tags = product.tags?.filter(t => t) ?? [];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-2xl px-6 py-12 font-mono">
                {/* Header */}
                <div className="mb-10">
                    <div className="mb-1 flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                            Agent Product View
                        </span>
                    </div>
                    <div className="mt-3 border-t border-border pt-3 flex items-baseline justify-between">
                        <h1 className="text-base font-semibold leading-snug">{product.title}</h1>
                        <span
                            className={`text-[10px] ${isAvailable ? "text-foreground" : "text-muted-foreground"}`}
                        >
                            {isAvailable ? "In Stock" : "Unavailable"}
                        </span>
                    </div>
                </div>

                {/* Identity */}
                <section className="mb-8">
                    <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Details
                    </h3>
                    <div className="divide-y divide-border/50 border-y border-border">
                        {product.vendor && <FieldRow label="Brand" value={product.vendor} />}
                        {product.productType && <FieldRow label="Type" value={product.productType} />}
                        <div className="grid grid-cols-3 py-2.5">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Price</span>
                            <div className="col-span-2 flex items-baseline gap-2">
                                <span className="text-xs font-semibold">
                                    {price ? formatShopifyMoney(price) : "—"}
                                </span>
                                {compareAtPrice && (
                                    <span className="text-[10px] text-muted-foreground line-through">
                                        {formatShopifyMoney(compareAtPrice)}
                                    </span>
                                )}
                            </div>
                        </div>
                        {collections.length > 0 && (
                            <FieldRow
                                label="Collections"
                                value={collections.map(c => c.title).join(", ")}
                            />
                        )}
                        {tags.length > 0 && (
                            <FieldRow label="Tags" value={tags.slice(0, 8).join(", ")} />
                        )}
                        <FieldRow label="Handle" value={product.handle} />
                    </div>
                </section>

                {/* Options */}
                {productOptions.length > 0 && (
                    <section className="mb-8">
                        <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Options
                        </h3>
                        <div className="divide-y divide-border/50 border-y border-border">
                            {productOptions.map(option => (
                                <div key={option.name} className="py-2.5">
                                    <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                                        {option.name}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {option.optionValues.map(val => (
                                            <span
                                                key={val.name}
                                                className={`border px-2 py-0.5 text-[10px] ${
                                                    val.selected
                                                        ? "border-foreground text-foreground"
                                                        : val.available
                                                          ? "border-border text-muted-foreground"
                                                          : "border-border/40 text-muted-foreground/40 line-through"
                                                }`}
                                            >
                                                {val.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Description */}
                {product.description && (
                    <section>
                        <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Description
                        </h3>
                        <p className="border-y border-border py-3 text-xs leading-relaxed text-muted-foreground">
                            {product.description}
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
}

function FieldRow({label, value}: {label: string; value: string}) {
    return (
        <div className="grid grid-cols-3 py-2.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="col-span-2 text-xs text-foreground">{value}</span>
        </div>
    );
}
