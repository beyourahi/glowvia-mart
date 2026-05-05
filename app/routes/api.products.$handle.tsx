/**
 * @fileoverview Quick Add Product Data Endpoint
 *
 * @description
 * Fetches full product data by handle for use by the Quick Add system
 * (QuickAddDialog / QuickAddSheet). Returns a normalized `ShopifyProduct` object
 * that matches the shared product card type so Quick Add components can render
 * variant selectors without navigating to the PDP.
 *
 * @route GET /api/products/:handle
 *
 * @authentication None — public endpoint.
 *
 * @rate-limiting 30 requests per IP per minute (sliding window).
 *
 * @query-params
 * - handle (route param, required) — Shopify product handle
 *
 * @returns JSON `{product: ShopifyProduct}` — normalized product with up to 100
 * variants, 20 images, and all option values.
 *
 * @related
 * - components/QuickAddDialog.tsx - Desktop quick-add modal
 * - components/QuickAddSheet.tsx - Mobile quick-add bottom sheet
 * - lib/types/product-card.ts - ShopifyProduct type definition
 */

import type {Route} from "./+types/api.products.$handle";
import type {ShopifyProduct} from "~/lib/types/product-card";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 30});

/**
 * Fetches product data by handle and returns a normalized ShopifyProduct.
 * Rate-limited per IP; responds 400 when handle is missing, 404 when the product
 * does not exist, and 500 on Storefront API failure.
 */
export const loader = async ({request, params, context}: Route.LoaderArgs) => {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;

    const {handle} = params;

    if (!handle) {
        return new Response(JSON.stringify({error: "Product handle is required"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }

    try {
        const {product} = await context.dataAdapter.query(QUICK_ADD_PRODUCT_QUERY, {
            variables: {handle},
            cache: context.dataAdapter.CacheNone()
        });

        if (!product) {
            return new Response(JSON.stringify({error: "Product not found"}), {
                status: 404,
                headers: {"Content-Type": "application/json"}
            });
        }

        return new Response(JSON.stringify({product: normalizeQuickAddProduct(product)}), {
            status: 200,
            headers: {"Content-Type": "application/json"}
        });
    } catch (error) {
        console.error("[api.products.$handle] Error:", error);
        return new Response(JSON.stringify({error: "Failed to fetch product"}), {
            status: 500,
            headers: {"Content-Type": "application/json"}
        });
    }
};

/**
 * Converts the raw Storefront API product node into a `ShopifyProduct` shape.
 *
 * Defensively handles missing or malformed fields so Quick Add components always
 * receive a fully typed object. Falls back to `featuredImage` when `images.nodes`
 * is empty so at least one image is always present.
 */
function normalizeQuickAddProduct(product: any): ShopifyProduct {
    const imageNodes = Array.isArray(product?.images?.nodes)
        ? product.images.nodes.filter(Boolean)
        : [];

    if (imageNodes.length === 0 && product?.featuredImage?.url) {
        imageNodes.push(product.featuredImage);
    }

    return {
        id: String(product?.id ?? ""),
        title: String(product?.title ?? ""),
        handle: String(product?.handle ?? ""),
        description: String(product?.description ?? ""),
        tags: Array.isArray(product?.tags) ? product.tags.filter(Boolean).map((tag: string) => String(tag)) : [],
        vendor: String(product?.vendor ?? ""),
        productType: String(product?.productType ?? ""),
        availableForSale: Boolean(product?.availableForSale),
        options: Array.isArray(product?.options)
            ? product.options.map((option: any, index: number) => ({
                  id: `${product.id}-${index}`,
                  name: String(option?.name ?? ""),
                  values: Array.isArray(option?.optionValues)
                      ? option.optionValues
                            .map((value: any) => value?.name)
                            .filter(Boolean)
                            .map((value: string) => String(value))
                      : []
              }))
            : [],
        variants: {
            edges: Array.isArray(product?.variants?.nodes)
                ? product.variants.nodes
                      .filter((variant: any) => variant?.id)
                      .map((variant: any) => ({
                          node: {
                              id: String(variant.id),
                              title: String(variant?.title ?? ""),
                              price: {
                                  amount: String(variant?.price?.amount ?? "0"),
                                  currencyCode: String(variant?.price?.currencyCode ?? "USD")
                              },
                              compareAtPrice: variant?.compareAtPrice
                                  ? {
                                        amount: String(variant.compareAtPrice.amount ?? "0"),
                                        currencyCode: String(variant.compareAtPrice.currencyCode ?? "USD")
                                    }
                                  : null,
                              selectedOptions: Array.isArray(variant?.selectedOptions)
                                  ? variant.selectedOptions
                                        .filter((selectedOption: any) => selectedOption?.name && selectedOption?.value)
                                        .map((selectedOption: any) => ({
                                            name: String(selectedOption.name),
                                            value: String(selectedOption.value)
                                        }))
                                  : [],
                              availableForSale: Boolean(variant?.availableForSale),
                              quantityAvailable:
                                  typeof variant?.quantityAvailable === "number" ? variant.quantityAvailable : null,
                              image: variant?.image?.url
                                  ? {
                                        id: String(variant.image.id ?? ""),
                                        url: String(variant.image.url),
                                        altText: variant.image.altText ?? null,
                                        width: typeof variant.image.width === "number" ? variant.image.width : undefined,
                                        height:
                                            typeof variant.image.height === "number" ? variant.image.height : undefined
                                    }
                                  : null
                          }
                      }))
                : []
        },
        images: {
            edges: imageNodes.map((image: any) => ({
                node: {
                    id: image?.id ? String(image.id) : undefined,
                    url: String(image?.url ?? ""),
                    altText: image?.altText ?? null,
                    width: typeof image?.width === "number" ? image.width : undefined,
                    height: typeof image?.height === "number" ? image.height : undefined
                }
            }))
        },
        priceRange: {
            minVariantPrice: {
                amount: String(product?.priceRange?.minVariantPrice?.amount ?? "0"),
                currencyCode: String(product?.priceRange?.minVariantPrice?.currencyCode ?? "USD")
            },
            maxVariantPrice: {
                amount: String(product?.priceRange?.maxVariantPrice?.amount ?? product?.priceRange?.minVariantPrice?.amount ?? "0"),
                currencyCode: String(
                    product?.priceRange?.maxVariantPrice?.currencyCode ??
                        product?.priceRange?.minVariantPrice?.currencyCode ??
                        "USD"
                )
            }
        },
        seo: {
            title: product?.seo?.title ?? null,
            description: product?.seo?.description ?? null
        }
    };
}

const QUICK_ADD_PRODUCT_QUERY = `#graphql
  query QuickAddProduct(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      description
      tags
      vendor
      productType
      availableForSale
      featuredImage {
        id
        url
        altText
        width
        height
      }
      images(first: 20) {
        nodes {
          id
          url
          altText
          width
          height
        }
      }
      options {
        name
        optionValues {
          name
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            id
            url
            altText
            width
            height
          }
        }
      }
      seo {
        title
        description
      }
    }
  }
` as const;
