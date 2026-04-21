import {Image} from "@shopify/hydrogen";
import {ArrowUpRight} from "lucide-react";
import {Link} from "react-router";
import type {FeaturedProductSection} from "types";
import {Money} from "~/components/Money";
import {QuickAddButton} from "~/components/QuickAddButton";
import {Button} from "~/components/ui/button";
import {parseProductTitle} from "~/lib/product";

const getDescription = (description: string) => {
    const trimmed = description.trim();
    if (!trimmed) {
        return "A merchant-selected spotlight product placed here to accelerate discovery before the trust layer begins.";
    }

    return trimmed.length > 250 ? `${trimmed.slice(0, 247).trimEnd()}...` : trimmed;
};

const getDiscountPercentage = (
    price: FeaturedProductSection["price"],
    compareAtPrice: FeaturedProductSection["compareAtPrice"]
) => {
    if (!compareAtPrice) return null;

    const current = Number(price.amount);
    const original = Number(compareAtPrice.amount);

    if (!Number.isFinite(current) || !Number.isFinite(original) || original <= current) {
        return null;
    }

    return Math.round(((original - current) / original) * 100);
};

export function FeaturedProductSpotlight({product}: {product: FeaturedProductSection}) {
    const discountPercentage = getDiscountPercentage(product.price, product.compareAtPrice);
    const displayImage = product.featuredImage;
    const {primary, secondary} = parseProductTitle(product.title);

    return (
        <section className="grid gap-6 rounded-[var(--radius-3xl-raw)] border border-border/60 bg-card/60 p-3 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)] backdrop-blur md:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] md:p-5 lg:gap-8 lg:p-6">
            <Link
                to={`/products/${product.handle}`}
                prefetch="intent"
                className="group relative overflow-hidden rounded-[var(--radius-2xl-raw)] bg-muted/35"
            >
                {displayImage ? (
                    <Image
                        data={{
                            url: displayImage.url,
                            altText: displayImage.altText || product.title
                        }}
                        sizes="(min-width: 1280px) 42vw, (min-width: 768px) 50vw, 100vw"
                        className="aspect-[4/5] md:aspect-[4/3.5] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex aspect-[4/5] md:aspect-[4/3.5] items-center justify-center bg-gradient-to-br from-muted to-muted/30 px-10 text-center">
                        <div>
                            <p className="font-serif text-3xl uppercase md:text-4xl">Featured edit</p>
                            <p className="text-muted-foreground mt-3 text-xs uppercase tracking-[0.32em]">
                                Product image unavailable
                            </p>
                        </div>
                    </div>
                )}

                {discountPercentage ? (
                    <div className="absolute left-4 top-4 rounded-[var(--radius-pill-raw)] bg-background/92 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-foreground backdrop-blur">
                        Save {discountPercentage}%
                    </div>
                ) : null}
            </Link>

            <div className="flex flex-col justify-between gap-6 rounded-[var(--radius-2xl-raw)] bg-background/70 p-5 md:p-6">
                <div className="space-y-5">
                    <div className="space-y-3">
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.32em]">Featured product</p>
                        <h2 className="font-serif text-2xl leading-tight uppercase sm:text-3xl lg:text-4xl">
                            {primary}
                        </h2>
                        {secondary && (
                            <p className="font-serif text-lg leading-tight uppercase text-muted-foreground sm:text-xl lg:text-2xl">
                                {secondary}
                            </p>
                        )}
                    </div>

                    <p className="text-muted-foreground max-w-xl text-sm leading-7 md:text-base">
                        {getDescription(product.description)}
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-wrap items-end gap-3">
                        <Money data={product.price} className="font-mono text-2xl md:text-4xl" />
                        {product.compareAtPrice ? (
                            <Money
                                data={product.compareAtPrice}
                                className="text-muted-foreground font-mono text-base line-through md:text-lg"
                            />
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <QuickAddButton product={product} className="w-full md:w-auto hover:scale-100" />
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="group/cta w-full justify-between rounded-[var(--radius-pill-raw)] px-6 py-6 text-sm uppercase tracking-[0.24em] hover:translate-y-0 md:w-auto"
                        >
                            <Link to={`/products/${product.handle}`} prefetch="intent">
                                View featured product
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
