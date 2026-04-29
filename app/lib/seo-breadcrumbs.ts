/**
 * @fileoverview Breadcrumb derivation helpers for JSON-LD and visual breadcrumb components
 * Phase 3: Extracts path-to-breadcrumb logic from PageBreadcrumbs.tsx into a pure,
 * reusable module shared by both the visual component and JSON-LD emitters.
 */

/** Convert a URL path to breadcrumb items (Home + path segments) */
export function deriveBreadcrumbsFromPath(
    pathname: string,
    customLeafTitle?: string
): Array<{name: string; url: string}> {
    const segments = pathname.split("/").filter(Boolean);
    const items: Array<{name: string; url: string}> = [{name: "Home", url: "/"}];

    let currentPath = "";
    for (const [index, segment] of segments.entries()) {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        const label = isLast && customLeafTitle
            ? customLeafTitle
            : segment.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        items.push({name: label, url: currentPath});
    }

    return items;
}

/** Derive breadcrumbs for a product page: Home > Collection (if any) > Product */
export function deriveProductBreadcrumbs(product: {
    handle: string;
    title: string;
    collections?: {nodes?: Array<{handle: string; title: string}>} | null;
}): Array<{name: string; url: string}> {
    const items: Array<{name: string; url: string}> = [{name: "Home", url: "/"}];
    const firstCollection = product.collections?.nodes?.[0];

    if (firstCollection && firstCollection.handle !== "all-products") {
        items.push({
            name: firstCollection.title,
            url: `/collections/${firstCollection.handle}`
        });
    } else {
        items.push({name: "Products", url: "/collections/all-products"});
    }

    const cleanTitle = product.title.includes("+")
        ? product.title.split("+")[0].trim()
        : product.title;

    items.push({name: cleanTitle, url: `/products/${product.handle}`});
    return items;
}

/** Derive breadcrumbs for a collection page: Home > Collections > Collection */
export function deriveCollectionBreadcrumbs(collection: {
    handle: string;
    title: string;
}): Array<{name: string; url: string}> {
    return [
        {name: "Home", url: "/"},
        {name: "Collections", url: "/collections"},
        {name: collection.title, url: `/collections/${collection.handle}`}
    ];
}

/** Derive breadcrumbs for a blog article: Home > Blog > Blog Title > Article */
export function deriveArticleBreadcrumbs(
    blogHandle: string,
    blogTitle: string,
    articleHandle: string,
    articleTitle: string
): Array<{name: string; url: string}> {
    return [
        {name: "Home", url: "/"},
        {name: "Blog", url: "/blogs"},
        {name: blogTitle, url: `/blogs/${blogHandle}`},
        {name: articleTitle, url: `/blogs/${blogHandle}/${articleHandle}`}
    ];
}

/** Derive breadcrumbs for a policy page: Home > Policies > Policy */
export function derivePolicyBreadcrumbs(
    policyHandle: string,
    policyTitle: string
): Array<{name: string; url: string}> {
    return [
        {name: "Home", url: "/"},
        {name: "Policies", url: "/policies"},
        {name: policyTitle, url: `/policies/${policyHandle}`}
    ];
}
