/**
 * @fileoverview RSS Blog Feed
 *
 * @description
 * Generates an RSS 2.0 feed for all blog articles, enabling readers and
 * aggregators to subscribe to storefront content updates.
 *
 * @route GET /blogs/feed.xml
 *
 * @format
 * RSS 2.0 with Dublin Core (`dc:creator`) and Media RSS (`media:thumbnail`)
 * namespace extensions.
 *
 * @caching Cached for 1 hour (max-age=3600). Public — no auth required.
 *
 * @content
 * Fetches up to 250 articles across all blogs, sorted by publish date descending.
 * Each item includes: title, link, GUID, excerpt, pubDate, author, tags, and
 * featured image thumbnail when available.
 *
 * @related
 * - blogs._index.tsx - Blog listing page
 * - blogs.$blogHandle.$articleHandle.tsx - Individual article page
 */

import type {Route} from "./+types/blogs.feed[.xml]";

/**
 * Fetches all articles and renders them as an RSS 2.0 XML response.
 * Shop name and description are used as the channel title and description.
 */
export async function loader({request, context}: Route.LoaderArgs) {
    const origin = new URL(request.url).origin;

    const {articles, shop} = await context.dataAdapter.query(FEED_QUERY, {
        variables: {first: 250}
    });

    const shopName = shop?.name ?? "Store";
    const shopDescription = shop?.description ?? "The latest articles from our blog.";
    const feedUrl = `${origin}/blogs/feed.xml`;
    const buildDate = new Date().toUTCString();

    const items = (articles?.nodes ?? [])
        .map((article: FeedArticle) => {
            const articleUrl = `${origin}/blogs/${article.blog.handle}/${article.handle}`;
            return [
                `<item>`,
                `  <title><![CDATA[${article.title}]]></title>`,
                `  <link>${articleUrl}</link>`,
                `  <guid isPermaLink="true">${articleUrl}</guid>`,
                `  <description><![CDATA[${article.excerpt ?? ""}]]></description>`,
                `  <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`,
                article.author?.name ? `  <dc:creator>${escapeXml(article.author.name)}</dc:creator>` : null,
                ...(article.tags ?? []).map(tag => `  <category>${escapeXml(tag)}</category>`),
                article.image?.url ? `  <media:thumbnail url="${escapeXml(article.image.url)}"/>` : null,
                `</item>`
            ]
                .filter(Boolean)
                .join("\n      ");
        })
        .join("\n    ");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <channel>
    <title>${escapeXml(shopName)} Blog</title>
    <link>${origin}/blogs</link>
    <description>${escapeXml(shopDescription)}</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
        status: 200,
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600"
        }
    });
}

/** Article shape returned by the feed query, used to build RSS items. */
type FeedArticle = {
    handle: string;
    title: string;
    excerpt: string | null;
    publishedAt: string;
    tags: string[];
    image: {url: string; altText: string | null} | null;
    blog: {handle: string; title: string};
    author: {name: string} | null;
};

/**
 * Escapes the five XML reserved characters so user-generated strings
 * (titles, author names, tags) are safe to embed in XML attributes and text nodes.
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

const FEED_QUERY = `#graphql
  query BlogFeed(
    $first: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        handle
        title
        excerpt
        publishedAt
        tags
        image {
          url
          altText
        }
        blog {
          handle
          title
        }
        author: authorV2 {
          name
        }
      }
    }
    shop {
      name
      description
    }
  }
` as const;
