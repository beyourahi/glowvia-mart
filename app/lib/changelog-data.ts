/**
 * @fileoverview Changelog data — hand-curated product update entries
 *
 * @description
 * Single source of truth for the /changelog page. Every meaningful
 * customer-facing change gets one entry here, written in plain English
 * for shoppers — no technical jargon, no commit SHAs, no file paths.
 *
 * HOW TO ADD A NEW ENTRY
 * ─────────────────────
 * 1. Add a new object at the TOP of CHANGELOG_ENTRIES (newest first).
 * 2. Write the entry in the SAME commit that ships the change.
 * 3. Use the shopper's perspective — what changed for them?
 * 4. Pick the right category:
 *    • "New Feature"  — something that didn't exist before
 *    • "Improvement"  — existing experience made better
 *    • "Fix"          — something that was broken, now working
 *    • "Performance"  — faster load times or data freshness
 *    • "Design"       — visual or layout refinement
 *
 * WHAT TO SKIP
 * ────────────
 * chore, ci, build, docs, lint, dependency bumps, internal refactors with
 * no visible user effect, commits under ~20 lines changed.
 */

import type {ChangelogEntry} from "~/lib/types/changelog";

// Newest entries at the top. Add new entries here in the same commit that ships the change.
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        date: "2026-04-13",
        headline: "Date headers stay visible as you scroll through the changelog",
        summary:
            "Each date section header now stays pinned at the top of the page as you scroll through its updates, then slides away when the next date arrives. You always know which date you're reading without having to scroll back up.",
        category: "Design"
    },
    {
        date: "2026-04-13",
        headline: "Changelog dates now show how long ago each update was",
        summary:
            "Date group headers on the updates page now display a relative label alongside the calendar date — \"Today\", \"Yesterday\", \"3 days ago\", and so on. No need to do the mental arithmetic yourself.",
        category: "Improvement"
    },
    {
        date: "2026-04-13",
        headline: "Out-of-stock products now appear across all shop pages",
        summary:
            "Products that are temporarily out of stock were previously hidden from collection pages, search results, the gallery, recommendations, and the homepage. They now show up everywhere so you can browse the full range, save items to your wishlist, and come back when they're available again.",
        category: "Improvement"
    },
    {
        date: "2026-04-12",
        headline: "Changelog timeline is easier to read",
        summary:
            "The updates page now has a clean two-column layout with a continuous vertical rail and category-colored markers for each entry. The date and content are clearly separated, entries have consistent spacing, and the layout adapts correctly to every screen size.",
        category: "Design"
    },
    {
        date: "2026-04-10",
        headline: "Chat and install buttons no longer overlap the footer",
        summary:
            "The floating chat and install buttons were sitting on top of the copyright text at the bottom of the page. They now sit clearly above the footer on every screen size.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        headline: "Changelog added to the footer navigation",
        summary:
            "The Changelog is now linked directly from the footer under the Connect section, so you can always find the latest updates without having to search for the page.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        headline: "Install App button now always visible on every page",
        summary:
            "The floating Install App button is now consistently visible across all browsers and screen sizes, making it easy to add the store to your home screen whenever you're ready.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        headline: "Homepage hero text is larger and more impactful",
        summary:
            "The main heading and description on the homepage are now displayed at a larger size, making the brand message easier to read and giving the page a stronger first impression on every screen size.",
        category: "Design"
    },
    {
        date: "2026-04-10",
        headline: "Search button added to the homepage hero",
        summary:
            "A search icon now sits beside the main call-to-action on the homepage, so you can jump straight to searching for a specific product without scrolling past the hero first.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        headline: "Added a floating chat widget — reach support via Messenger or WhatsApp",
        summary:
            "A floating chat button now lives on every page, giving you instant access to support through Facebook Messenger or WhatsApp. Tap the icon and choose your preferred channel — no need to navigate away from what you're browsing.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        headline: "App install button is now visible on mobile at all times",
        summary:
            "The button that lets mobile visitors install the store as a home screen app is now always visible, not just under certain conditions. It uses proper safe-area positioning so it never overlaps system UI on notched phones.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        headline: "Chat button is always visible, regardless of screen size",
        summary:
            "The app open and chat button now appears on all screen sizes — desktop, tablet, and mobile — so customers always have a quick way to get in touch or open the app from wherever they are on the site.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        headline: "Messenger chat button opens faster without third-party scripts",
        summary:
            "The chat button used to load Facebook's entire Messenger SDK in the background, slowing down the page. It now redirects you directly to Messenger with a simple link, so it opens instantly without any extra tracking scripts.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        headline: "Fixed layout overlap between promo card and chat widget",
        summary:
            "The homepage promotional card was overlapping with the floating chat support widget, making both hard to interact with. The promo card is now positioned to clear the widget on all screen sizes.",
        category: "Fix"
    },
    {
        date: "2026-04-09",
        headline: "Chat widget and install button now have correct spacing and brand colors",
        summary:
            "Fixed a visual issue where the chat widget and app button were overlapping and using placeholder colors instead of the brand's real palette. They now sit evenly spaced with proper brand-accurate styling.",
        category: "Fix"
    },
    {
        date: "2026-04-09",
        headline: "Instagram section has smoother hover effects and links to the profile",
        summary:
            "Hovering over images in the Instagram feed section now triggers a smoother, more refined animation. The section heading now also links directly to the brand's Instagram profile so you can follow with a single tap.",
        category: "Design"
    },
    {
        date: "2026-04-09",
        headline: "Product info stays visible while you scroll through images",
        summary:
            "On the product page, the pricing, size selector, and add-to-cart button now remain fixed on screen while you scroll through the product photo gallery. You no longer have to scroll back up to buy after reviewing all the images.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        headline: "Quick Add button on featured products",
        summary:
            "Featured products on the homepage now have a Quick Add button so you can drop items straight into your cart without visiting the product page. Select your variant and add — all without leaving the page.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        headline: "Featured product section has a cleaner, more balanced layout",
        summary:
            "Resized the featured product title and repositioned the action buttons so the primary \"Add to Cart\" action is always the most prominent element. The layout now feels more editorial and less cluttered.",
        category: "Design"
    },
    {
        date: "2026-04-09",
        headline: "Keyboard focus indicators no longer appear when clicking with a mouse",
        summary:
            "Focus outlines used to appear on buttons and links whenever you clicked them with a mouse, which looked unintentional. They now only appear when navigating with a keyboard, keeping the interface clean while remaining fully accessible.",
        category: "Improvement"
    },
    {
        date: "2026-04-08",
        headline: "Whole-number prices no longer show unnecessary decimal places",
        summary:
            "Prices like $50.00 or $120.00 now display as $50 and $120 across the entire store, reducing visual noise. Prices with cents (like $19.99) still display the full amount as expected.",
        category: "Improvement"
    },
    {
        date: "2026-04-07",
        headline: "Product links now show the correct preview when shared on social media",
        summary:
            "Fixed missing metadata that caused product pages and other content to appear without a title, image, or description when shared on social platforms like Twitter, Facebook, and iMessage. Links now display a proper rich preview.",
        category: "Fix"
    },
    {
        date: "2026-04-07",
        headline: "Corrected heading structure on product pages for better search visibility",
        summary:
            "Each product page now has a single, well-structured main heading instead of multiple conflicting ones. This helps search engines understand the page content correctly and can improve how products appear in search results.",
        category: "Fix"
    },
    {
        date: "2026-04-06",
        headline: "Free shipping progress bar only appears when a threshold is set",
        summary:
            "The progress bar showing how close you are to free shipping was displaying even when no minimum order requirement was configured. It now correctly stays hidden until a free shipping threshold has been set up.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        headline: "Your Instagram handle now links directly to your profile",
        summary:
            "The Instagram section on the homepage now features the brand handle as a live link that takes visitors directly to the Instagram profile. Clicking the handle opens Instagram in a new tab for easy following.",
        category: "New Feature"
    },
    {
        date: "2026-04-05",
        headline: "Empty homepage sections are now hidden automatically",
        summary:
            "Sections that have no content configured — such as testimonials or feature highlights — are now hidden instead of showing as blank gaps. The homepage always looks intentional and complete regardless of which sections are active.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        headline: "Text on the collection promo card is always readable",
        summary:
            "Fixed a contrast issue where text on the collection promotional card could become hard to read depending on the brand's accent color. The card now ensures readable contrast across all color configurations.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        headline: "Product and collection data refreshes up to 4× more often",
        summary:
            "Updated product listings, prices, and inventory now appear on the site within 5 hours instead of the previous 23-hour window. If a product goes out of stock or a promotion starts, the store reflects it much sooner.",
        category: "Performance"
    },
    {
        date: "2026-04-05",
        headline: "All Products count in the menu is now accurate",
        summary:
            "The number shown next to \"All Products\" in the full-screen navigation menu was sometimes displaying an incorrect total. It now always reflects the actual product count in the store.",
        category: "Fix"
    }
];
