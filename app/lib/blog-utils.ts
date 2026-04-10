/**
 * @fileoverview Blog Article Utilities and Formatting
 *
 * @description
 * Utility functions for blog article processing including reading time calculation, date
 * formatting, author handling, related article filtering, and social share data generation.
 * Supports Shopify blog articles with HTML content, tags, and metadata.
 *
 * @architecture
 * Utility Categories:
 * - Content Processing: HTML stripping, reading time calculation
 * - Date Formatting: Long format, short format, internationalized
 * - Sharing: Article → ShareData conversion for social platforms
 * - Related Content: Tag-based article matching with scoring
 * - Author Handling: Initials generation from names
 * - Text Formatting: Truncation, slugification
 *
 * Reading Time Calculation:
 * - Strips HTML tags from article content
 * - Counts words (200 wpm default reading speed)
 * - Returns estimated reading time in minutes
 *
 * Related Articles Algorithm:
 * - Scores articles by matching tag count with current article
 * - Sorts by score (most matching tags first)
 * - Returns top N articles (default 4)
 * - Falls back to recent articles if no tags
 *
 * @dependencies
 * - ShareData type from ~/lib/social-share
 * - Browser Intl.DateTimeFormat API
 *
 * @related
 * - app/routes/blogs.$blogHandle.$articleHandle.tsx - Uses reading time and share data
 * - app/components/blog/ReadingTime.tsx - Displays reading time
 * - app/components/blog/ShareButtons.tsx - Uses share data
 * - app/components/blog/RelatedArticles.tsx - Uses related article filtering
 * - app/components/blog/AuthorBio.tsx - Uses author initials
 */

import type {ShareData} from "~/lib/social-share";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";

/**
 * Strip HTML tags from a string for word counting
 */
export function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

/**
 * Calculate estimated reading time from content
 * @param content HTML or plain text content
 * @param wordsPerMinute Average reading speed (default: 200 wpm)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
    const text = stripHtml(content);
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Format article date for display
 */
export function formatArticleDate(date: string, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(STORE_FORMAT_LOCALE, {
        year: "numeric",
        month: "long",
        day: "numeric",
        ...options
    }).format(new Date(date));
}

/**
 * Format article date in short format (e.g., "Dec 4, 2025")
 */
export function formatArticleDateShort(date: string): string {
    return new Intl.DateTimeFormat(STORE_FORMAT_LOCALE, {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(new Date(date));
}

/**
 * Article data for sharing
 */
export interface ArticleShareInput {
    title: string;
    excerpt?: string | null;
    image?: {
        url: string;
    } | null;
    blog: {
        handle: string;
    };
    handle: string;
}

/**
 * Create share data from article
 */
export function createArticleShareData(article: ArticleShareInput, baseUrl: string, shopName?: string): ShareData {
    const articleUrl = `${baseUrl}/blogs/${article.blog.handle}/${article.handle}`;

    return {
        title: article.title,
        description: article.excerpt || `Read "${article.title}" on our blog.`,
        url: articleUrl,
        imageUrl: article.image?.url,
        price: "", // Articles don't have prices
        shopName
    };
}

/**
 * Article type for filtering related articles
 */
export interface ArticleForRelated {
    handle: string;
    tags?: string[];
    id?: string;
}

/**
 * Filter related articles by matching tags
 * @param articles All available articles
 * @param currentArticle The current article to find related content for
 * @param limit Maximum number of related articles to return
 * @returns Array of related articles sorted by tag match count
 */
export function filterRelatedArticles<T extends ArticleForRelated>(
    articles: T[],
    currentArticle: ArticleForRelated,
    limit: number = 4
): T[] {
    const currentTags = new Set(currentArticle.tags || []);
    const currentHandle = currentArticle.handle;

    // If no tags, just return other articles excluding current
    if (currentTags.size === 0) {
        return articles.filter(a => a.handle !== currentHandle).slice(0, limit);
    }

    // Score articles by matching tags
    const scored = articles
        .filter(a => a.handle !== currentHandle)
        .map(article => {
            const articleTags = article.tags || [];
            const matchCount = articleTags.filter(tag => currentTags.has(tag)).length;
            return {article, matchCount};
        })
        .sort((a, b) => b.matchCount - a.matchCount);

    return scored.slice(0, limit).map(item => item.article);
}

/**
 * Get initials from author name
 */
export function getAuthorInitials(name?: string | null): string {
    if (!name) return "AU";

    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Truncate text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
}

/**
 * Generate a URL-safe slug from text (for tag URLs)
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
