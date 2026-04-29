/**
 * @fileoverview Agent-readable structured data helpers
 * Phase 3: Provides meta-tag emission for SCE fields — agents that prefer
 * head-meta scraping over JSON-LD get a flat key/value surface.
 */

export type CatalogExtensionFields = {
    isGiftCard?: boolean;
    requiresShipping?: boolean;
    sellingPlans?: Array<{name: string}>;
    collections?: Array<{handle: string; title: string}>;
    quantityAvailable?: number | null;
    currentlyNotInStock?: boolean;
};

/** Emit <meta name="ucp:product:*" content="..."> tags for SCE fields */
export function getCatalogExtensionMeta(
    fields: CatalogExtensionFields
): Array<{name: string; content: string}> {
    const metas: Array<{name: string; content: string}> = [];

    if (fields.isGiftCard != null) {
        metas.push({name: "ucp:product:isGiftCard", content: String(fields.isGiftCard)});
    }
    if (fields.requiresShipping != null) {
        metas.push({name: "ucp:product:requiresShipping", content: String(fields.requiresShipping)});
    }
    if (fields.sellingPlans?.length) {
        metas.push({name: "ucp:product:sellingPlans", content: fields.sellingPlans.map(p => p.name).join("|")});
    }
    if (fields.collections?.length) {
        metas.push({name: "ucp:product:collections", content: fields.collections.map(c => c.handle).join("|")});
    }
    if (fields.quantityAvailable != null) {
        metas.push({name: "ucp:product:quantityAvailable", content: String(fields.quantityAvailable)});
    }
    if (fields.currentlyNotInStock != null) {
        metas.push({name: "ucp:product:currentlyNotInStock", content: String(fields.currentlyNotInStock)});
    }

    return metas;
}

/** Generate FAQPage JSON-LD for structured data and agent consumption */
export function generateFAQPageSchema(faqs: Array<{question: string; answer: string}>): object {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(({question, answer}) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: {"@type": "Answer", text: answer}
        }))
    };
}
