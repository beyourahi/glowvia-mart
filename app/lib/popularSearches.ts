/**
 * @fileoverview Popular Search Terms Extraction from Product Catalog
 *
 * @description
 * Analyzes product titles, product types, and collection titles to extract popular search
 * keywords using word frequency analysis and stop word filtering. Generates dynamic search
 * suggestions based on actual catalog content rather than hardcoded terms.
 *
 * @architecture
 * Extraction Algorithm:
 * 1. Tokenize product titles and collection titles
 * 2. Filter stop words (articles, prepositions, common modifiers)
 * 3. Weight collection words 3x (curated by merchant)
 * 4. Score by frequency across catalog
 * 5. Prioritize product types (highest value search terms)
 * 6. Return top 12 terms
 *
 * Term Prioritization:
 * - Product types (highest priority): e.g., "shirt", "mug", "poster"
 * - High-frequency words from titles: e.g., "vintage", "organic", "handmade"
 * - Collection titles (1-2 word phrases): e.g., "summer collection", "sale"
 *
 * Stop Word Filtering:
 * - 100+ common English words excluded
 * - Articles, prepositions, size terms, generic e-commerce words
 * - Ensures meaningful search suggestions
 *
 * @dependencies
 * - None (pure JavaScript)
 *
 * @related
 * - app/components/SearchFormPredictive.tsx - Displays popular search suggestions
 * - app/routes/search.tsx - Uses popular searches when query is empty
 * - app/lib/metaobject-parsers.ts - Provides fallback popular searches
 */

// Common words to exclude from keyword extraction
const STOP_WORDS = new Set([
    // Articles and prepositions
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    // Common modifiers that don't make good search terms alone
    "new",
    "best",
    "top",
    "great",
    "good",
    "nice",
    "beautiful",
    "amazing",
    // Size/quantity words
    "small",
    "medium",
    "large",
    "xl",
    "xxl",
    "xs",
    "one",
    "two",
    "three",
    "set",
    "pack",
    // Generic product words
    "product",
    "item",
    "style",
    "design",
    "collection",
    "edition",
    "version",
    // Common e-commerce terms
    "sale",
    "deal",
    "offer",
    "discount",
    "free",
    "shipping",
    // Other common words
    "is",
    "it",
    "be",
    "are",
    "was",
    "were",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "this",
    "that",
    "these",
    "those",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "can",
    // Symbols and empty strings
    "",
    "-",
    "&",
    "|",
    "/",
    "+"
]);

// Minimum word length to consider
const MIN_WORD_LENGTH = 3;

// Maximum number of popular search terms to return
const MAX_TERMS = 12;

interface ProductData {
    title: string;
    productType?: string | null;
    availableForSale: boolean;
}

interface CollectionData {
    title: string;
    handle: string;
}

/**
 * Extracts and ranks keywords from product and collection data
 */
export function extractPopularSearchTerms(products: ProductData[], collections: CollectionData[]): string[] {
    const wordFrequency = new Map<string, number>();
    const productTypes = new Set<string>();

    // Process available products only
    const availableProducts = products.filter(p => p.availableForSale);

    // Extract words from product titles
    for (const product of availableProducts) {
        const words = tokenize(product.title);
        for (const word of words) {
            if (isValidKeyword(word)) {
                wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
            }
        }

        // Track product types (these make excellent search terms)
        if (product.productType && product.productType.trim()) {
            const type = product.productType.toLowerCase().trim();
            productTypes.add(type);
        }
    }

    // Extract words from collection titles (weighted higher as they're curated)
    for (const collection of collections) {
        // Skip generic collection handles
        if (["all", "all-collections", "frontpage"].includes(collection.handle.toLowerCase())) {
            continue;
        }

        const words = tokenize(collection.title);
        for (const word of words) {
            if (isValidKeyword(word)) {
                // Weight collection words 3x since they're intentionally curated by the merchant
                wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 3);
            }
        }
    }

    // Sort by frequency and extract top keywords
    const sortedWords = Array.from(wordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);

    // Combine product types (highest priority) with frequent words
    const result: string[] = [];
    const seen = new Set<string>();

    // First, add unique product types (they're the most useful search terms)
    for (const type of productTypes) {
        if (!seen.has(type) && result.length < MAX_TERMS) {
            result.push(type);
            seen.add(type);
        }
    }

    // Then add high-frequency words from titles
    for (const word of sortedWords) {
        if (!seen.has(word) && result.length < MAX_TERMS) {
            result.push(word);
            seen.add(word);
        }
    }

    // Add collection-based compound terms (e.g., "summer collection" -> "summer")
    const collectionKeywords = collections
        .filter(c => !["all", "all-collections", "frontpage"].includes(c.handle.toLowerCase()))
        .map(c => c.title.toLowerCase().trim())
        .filter(title => title.length >= MIN_WORD_LENGTH && !seen.has(title));

    for (const keyword of collectionKeywords) {
        if (result.length < MAX_TERMS && !seen.has(keyword)) {
            // Only add if it's a short, memorable phrase (1-2 words)
            if (keyword.split(/\s+/).length <= 2) {
                result.push(keyword);
                seen.add(keyword);
            }
        }
    }

    return result.slice(0, MAX_TERMS);
}

/**
 * Tokenizes a string into individual words
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ") // Remove special characters except hyphens
        .split(/\s+/)
        .filter(Boolean);
}

/**
 * Checks if a word is a valid keyword for search suggestions
 */
function isValidKeyword(word: string): boolean {
    return (
        word.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(word) && !/^\d+$/.test(word) // Not purely numeric
    );
}
