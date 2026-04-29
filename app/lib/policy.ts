type PolicySection = {
    title: string;
    content: string;
    index: number;
};

/** Collapse inter-tag whitespace so SSR and client produce identical HTML strings. */
const normalizeHtml = (html: string): string =>
    html.replace(/>\s+</g, "><").trim();

/**
 * Parse Shopify policy HTML into structured sections split on header elements.
 *
 * Uses a single regex-based parser that produces identical output on server and
 * client, eliminating the hydration mismatch that a DOM-based client parser
 * would introduce (browser innerHTML readback normalizes HTML differently).
 */
export const parsePolicySections = (htmlContent: string): PolicySection[] => {
    if (!htmlContent?.trim()) {
        return [];
    }

    const headerRegex = /<(h[1-6])(?:[^>]*)>(.*?)<\/\1>/gi;
    const headers: Array<{tag: string; title: string; position: number}> = [];

    let match;
    while ((match = headerRegex.exec(htmlContent)) !== null) {
        headers.push({
            tag: match[1],
            title: match[2].replace(/<[^>]*>/g, "").trim(),
            position: match.index
        });
    }

    if (headers.length === 0) {
        return [
            {
                title: "",
                content: normalizeHtml(htmlContent),
                index: 1
            }
        ];
    }

    const sections: PolicySection[] = [];

    headers.forEach((header, index) => {
        const start = header.position;
        const end = index < headers.length - 1 ? headers[index + 1].position : htmlContent.length;

        let sectionHtml = htmlContent.slice(start, end);
        sectionHtml = sectionHtml.replace(/<h[1-6](?:[^>]*)>.*?<\/h[1-6]>/i, "").trim();

        sections.push({
            title: header.title || `Section ${index + 1}`,
            content: normalizeHtml(sectionHtml),
            index: index + 1
        });
    });

    return sections;
};
