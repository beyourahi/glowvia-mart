/**
 * @fileoverview Product Variant State Utilities
 *
 * Helpers for finding variants by option selection, computing their price/discount
 * state, and deriving available option values given the current selection. Used
 * by PDP option pickers and quick-add flows.
 */

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type ShopifySelectedOption = {
    name: string;
    value: string;
};

type ShopifyImage = {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
};

type ShopifyProductVariant = {
    id: string;
    title: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    selectedOptions: ShopifySelectedOption[];
    availableForSale: boolean;
    quantityAvailable: number | null;
    image: ShopifyImage | null;
};

type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

type ShopifyPriceRange = {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
};

type ShopifyProductSeo = {
    title: string | null;
    description: string | null;
};

type ShopifyProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: ShopifyProductOption[];
    variants: {edges: {node: ShopifyProductVariant}[]};
    images: {edges: {node: ShopifyImage}[]};
    priceRange: ShopifyPriceRange;
    seo: ShopifyProductSeo;
};

/** Map of option name → selected value (e.g. `{Color: "Red", Size: "M"}`). */
export interface VariantSelection {
    [optionName: string]: string;
}

/** Find the first variant whose `selectedOptions` fully match the given selection. */
export const findVariantByOptions = (
    variants: ShopifyProductVariant[],
    selectedOptions: VariantSelection
): ShopifyProductVariant | null => {
    return (
        variants.find(variant => {
            return variant.selectedOptions.every(option => selectedOptions[option.name] === option.value);
        }) || null
    );
};

/** Extract price, compare-at price, and whether a discount exists for the given variant. */
export const getVariantPrice = (variant: ShopifyProductVariant | null) => {
    if (!variant) return null;

    return {
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        hasDiscount: Boolean(
            variant.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
        )
    };
};

/** Return availability status and quantity for the given variant. */
export const getVariantInventory = (variant: ShopifyProductVariant | null) => {
    if (!variant) return {available: false, quantity: 0};

    return {
        available: variant.availableForSale,
        quantity: variant.quantityAvailable || 0
    };
};

export const getProductOptions = (product: ShopifyProduct): ShopifyProductOption[] => {
    return (
        product.options?.map(option => ({
            id: option.id,
            name: option.name,
            values: option.values
        })) || []
    );
};

export const getDefaultSelection = (product: ShopifyProduct): VariantSelection => {
    const options = getProductOptions(product);
    const selection: VariantSelection = {};

    options.forEach(option => {
        if (option.values && option.values.length > 0) {
            selection[option.name] = option.values[0];
        }
    });

    return selection;
};

export const isValidSelection = (product: ShopifyProduct, selectedOptions: VariantSelection): boolean => {
    const productOptions = getProductOptions(product);

    return productOptions.every(
        option => selectedOptions[option.name] && option.values && option.values.includes(selectedOptions[option.name])
    );
};

/**
 * Return the option values for `optionName` that are available for sale
 * given the rest of the current selection (other options must match).
 * Used to disable unavailable swatches/pills without hiding them.
 */
export const getAvailableValues = (
    product: ShopifyProduct,
    optionName: string,
    currentSelection: VariantSelection
): string[] => {
    const variants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableValues = new Set<string>();

    variants.forEach(variant => {
        if (!variant.availableForSale) return;

        const variantMatches = variant.selectedOptions.every(
            option => option.name === optionName || currentSelection[option.name] === option.value
        );

        if (variantMatches) {
            const targetOption = variant.selectedOptions.find(opt => opt.name === optionName);
            if (targetOption) {
                availableValues.add(targetOption.value);
            }
        }
    });

    return Array.from(availableValues);
};
