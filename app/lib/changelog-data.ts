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
        date: "2026-04-19",
        category: "Improvement",
        headline: "Cart suggestions no longer show products already in your bag",
        summary:
            "The 'You might also like' carousel now hides any product you've already added to your cart — instantly and without a page refresh. This keeps suggestions fresh and relevant as you shop."
    },
    {
        id: "trackpad-horizontal-scroll-carousels",
        date: "2026-04-19",
        version: "1.x",
        category: "Improvement",
        headline: "Two-finger trackpad scroll now works on all product and article carousels",
        description:
            "You can now swipe horizontally with two fingers on a trackpad to scroll through product recommendations, curated collections, and related articles — in addition to clicking and dragging."
    },
    {
        id: "cart-suggestions-card-sizing",
        date: "2026-04-19",
        version: "1.x",
        category: "Design",
        headline: "Cart suggestions are better sized for browsing at all screen sizes",
        description:
            "Product cards in the 'You might also like' section now show multiple cards at once on tablet and desktop, with a clear peek of the next card on mobile. Scrolling also snaps cleanly to card boundaries."
    },
    {
        date: "2026-04-19",
        headline: "Cart drawer no longer cuts off the checkout button on mobile",
        summary:
            "On mobile devices, the checkout button was occasionally pushed off-screen when product suggestions were visible in the cart. The cart drawer now correctly keeps the checkout button pinned at the bottom of the screen at all times, and product suggestions in an empty cart are now visible without needing to scroll.",
        category: "Fix"
    },
    {
        date: "2026-04-19",
        headline: "Sticky buy button now matches your store's color theme",
        summary:
            "The sticky \"Get it Now\" button that appears at the bottom of the screen on product pages now adapts to your store's color settings. On dark-themed stores it was previously showing as a plain white button — it now blends seamlessly with the rest of the page.",
        category: "Design"
    },
    {
        date: "2026-04-19",
        headline: "Quick Add no longer closes immediately after a previous cart add",
        summary:
            "Opening the Quick Add selector for a product right after adding something else to your cart used to cause it to close instantly. This has been fixed — the selector now stays open so you can choose your size or variant without interruption.",
        category: "Fix"
    },
    {
        date: "2026-04-18",
        headline: "Product suggestions now appear in your cart at all times",
        summary:
            "Product suggestions now stay visible in your cart drawer whether it is empty or has items. The section is collapsible — click the heading to hide it, and it resets to open the next time you open the cart.",
        category: "Improvement"
    },
    {
        date: "2026-04-18",
        headline: "Quick Add dialog now appears correctly over the cart panel",
        summary:
            "Clicking \u201cGet it now\u201d on a suggested product while the cart is open now shows the variant picker on top of the cart panel, as expected. Previously it rendered behind the cart, making it impossible to interact with.",
        category: "Fix"
    },
    {
        date: "2026-04-18",
        headline: "Hover effects disabled on touch — smoother mobile experience",
        summary:
            "On phones and tablets, hover animations no longer trigger on tap — eliminating ghost hover states and reducing unnecessary style recalculation. Content that was previously only visible on hover (gallery overlays, expand buttons) is now always visible on touch screens.",
        category: "Performance"
    },
    {
        date: "2026-04-17",
        headline: "Option group labels now appear on mobile product pages",
        summary:
            "When browsing a product with multiple option types — like Size and Color — the label above each group (e.g. \"Size\", \"Color\") was only showing on desktop. On mobile, you'd see the option buttons with no indication of what they were. Labels now appear on mobile too, so it's always clear what you're choosing.",
        category: "Fix"
    },
    {
        date: "2026-04-17",
        headline: "Products with no variants no longer show a stray option label",
        summary:
            "Some products don't have selectable options like size or color — but Shopify was still showing a placeholder label called \"Default Title\" on their product pages. That label is now hidden across all screen sizes, including the full-height mobile section, so single-variant products look clean and uncluttered without breaking add-to-cart.",
        category: "Fix"
    },
    {
        date: "2026-04-17",
        headline: "Search button labels no longer overflow on small screens",
        summary:
            "On phones with narrow screens, the rotating labels inside the search button on the homepage were getting clipped mid-word. The button now shows shorter, equally clear labels on mobile — so the text always fits neatly within the pill without looking broken.",
        category: "Fix"
    },
    {
        date: "2026-04-16",
        headline: "Price and discount now appear on the mobile quick-buy bar",
        summary:
            "When you scroll past the product details on mobile, the sticky button at the bottom now shows the price alongside the call-to-action label. If the product is on sale, the original price appears crossed out next to the discount percentage — so you always know what you're getting and how much you're saving before you tap. The price updates instantly when you switch between variants.",
        category: "Improvement"
    },
    {
        date: "2026-04-16",
        headline: "Option group names now appear on products with multiple choices",
        summary:
            "On product pages with more than one type of option — such as both a size and a bundle size — each group now shows its name above the choices so it's clear what you're selecting. Products with only one type of option are unchanged: the label stays out of the way and the page remains clean.",
        category: "Improvement"
    },
    {
        date: "2026-04-16",
        headline: "Review layout adapts intelligently to the number of reviews",
        summary:
            "The customer reviews section on product pages now adjusts its layout based on how many reviews a product has. A single review gets a focused, featured card with a quote accent. Two reviews appear in a balanced two-column layout. Three reviews fill a clean three-column row. Four or more reviews display in a swipeable carousel with dot navigation and keyboard support — all without wasted space or orphaned cards at any screen size.",
        category: "Design"
    },
    {
        date: "2026-04-16",
        headline: "Products without images now display a branded placeholder",
        summary:
            "Products that don't yet have an image now show a clean, on-brand placeholder instead of a broken or blank space — on both the product grid and the product detail page. The placeholder uses the storefront's visual identity so the layout stays consistent no matter what.",
        category: "Design"
    },
    {
        date: "2026-04-16",
        headline: "Product pages now play videos directly in the gallery",
        summary:
            "Product galleries now support all Shopify media types. Videos hosted on Shopify play inline with native controls — hover to preview, or click expand to watch fullscreen. YouTube and Vimeo embeds open in a fullscreen lightbox. 3D model previews show the product thumbnail. Mixed galleries (photos + videos) are fully supported.",
        category: "New Feature"
    },
    {
        date: "2026-04-16",
        headline: "Product pages now show customer reviews",
        summary:
            "Each product page now displays reviews left by customers — including a star rating, review title, and written feedback. An aggregate rating summary shows the overall score and how ratings are distributed at a glance.",
        category: "New Feature"
    },
    {
        date: "2026-04-15",
        time: "7pm",
        headline: "Search button label in the hero is now visible on all devices",
        summary:
            "The rotating label inside the hero search button was invisible due to a display rendering issue. It now shows correctly — on mobile it's always visible alongside the icon, and on desktop it appears when you hover over the button.",
        category: "Fix"
    },
    {
        date: "2026-04-15",
        time: "6pm",
        headline: "Search button on the hero now shows a rotating label as you hover",
        summary:
            "On desktop, hovering the search button in the hero section smoothly expands it to reveal a rotating prompt — cycling through phrases like \"What are you looking for?\" and \"Search the collection\". On mobile and tablet, the button fills the available row width and cycles through labels automatically. Respects reduced-motion preferences.",
        category: "Design"
    },
    {
        date: "2026-04-15",
        time: "4pm",
        headline: "Google Maps now appears on the homepage for each store location",
        summary:
            "You can now embed an interactive Google Maps view directly on your homepage — one per physical location. Shoppers can see where you are at a glance, with a direct link to open directions in Google Maps. For stores with multiple locations, a tab switcher lets shoppers choose which store to view.",
        category: "New Feature"
    },
    {
        date: "2026-04-15",
        time: "12pm",
        headline: "Store address and contact details are now visible on the homepage",
        summary:
            "Your store's address, email, phone number, and business hours now appear at the bottom of the homepage. The footer also shows your email and phone directly, so shoppers can reach you without hunting for a contact page.",
        category: "New Feature"
    },
    {
        date: "2026-04-14",
        time: "3pm",
        headline: "Changelog dates now show the time each update shipped",
        summary:
            "Each date group on the updates page now shows the time of day alongside the date — like \"3pm\" or \"11am\" — so you can see not just which day an update landed, but roughly when during the day it was released.",
        category: "Design"
    },
    {
        date: "2026-04-14",
        time: "3pm",
        headline: "The updates count on the changelog page is now a proper typographic display",
        summary:
            "The total number of updates shipped so far is now shown as a large, prominent number framed by ruled lines and dot accents — the same visual motifs used in the timeline below. It reads as a milestone rather than a footnote.",
        category: "Design"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "The updates page now shows a live total commit count and per-date update tallies",
        summary:
            "The changelog page now displays the all-time number of commits shipped, shown quietly below the page title. Each date section also shows how many updates landed that day — so you can see at a glance which days were busy and which were quiet.",
        category: "New Feature"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Page titles are now bolder and easier to scan at a glance",
        summary:
            "Headings on pages like Search, Contact, Gallery, FAQ, Blog, and Changelog are now displayed at a larger, more consistent size that matches the visual weight of the Collections pages. Every section of the store now has the same clear, confident title hierarchy.",
        category: "Design"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Date headers stay visible as you scroll through the changelog",
        summary:
            "Each date section header now stays pinned at the top of the page as you scroll through its updates, then slides away when the next date arrives. You always know which date you're reading without having to scroll back up.",
        category: "Design"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Changelog dates now show how long ago each update was",
        summary:
            "Date group headers on the updates page now display a relative label alongside the calendar date — \"Today\", \"Yesterday\", \"3 days ago\", and so on. No need to do the mental arithmetic yourself.",
        category: "Improvement"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Out-of-stock products now appear across all shop pages",
        summary:
            "Products that are temporarily out of stock were previously hidden from collection pages, search results, the gallery, recommendations, and the homepage. They now show up everywhere so you can browse the full range, save items to your wishlist, and come back when they're available again.",
        category: "Improvement"
    },
    {
        date: "2026-04-12",
        time: "7pm",
        headline: "Changelog timeline is easier to read",
        summary:
            "The updates page now has a clean two-column layout with a continuous vertical rail and category-colored markers for each entry. The date and content are clearly separated, entries have consistent spacing, and the layout adapts correctly to every screen size.",
        category: "Design"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Chat and install buttons no longer overlap the footer",
        summary:
            "The floating chat and install buttons were sitting on top of the copyright text at the bottom of the page. They now sit clearly above the footer on every screen size.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Changelog added to the footer navigation",
        summary:
            "The Changelog is now linked directly from the footer under the Connect section, so you can always find the latest updates without having to search for the page.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Install App button now always visible on every page",
        summary:
            "The floating Install App button is now consistently visible across all browsers and screen sizes, making it easy to add the store to your home screen whenever you're ready.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Homepage hero text is larger and more impactful",
        summary:
            "The main heading and description on the homepage are now displayed at a larger size, making the brand message easier to read and giving the page a stronger first impression on every screen size.",
        category: "Design"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Search button added to the homepage hero",
        summary:
            "A search icon now sits beside the main call-to-action on the homepage, so you can jump straight to searching for a specific product without scrolling past the hero first.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Added a floating chat widget — reach support via Messenger or WhatsApp",
        summary:
            "A floating chat button now lives on every page, giving you instant access to support through Facebook Messenger or WhatsApp. Tap the icon and choose your preferred channel — no need to navigate away from what you're browsing.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "App install button is now visible on mobile at all times",
        summary:
            "The button that lets mobile visitors install the store as a home screen app is now always visible, not just under certain conditions. It uses proper safe-area positioning so it never overlaps system UI on notched phones.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Chat button is always visible, regardless of screen size",
        summary:
            "The app open and chat button now appears on all screen sizes — desktop, tablet, and mobile — so customers always have a quick way to get in touch or open the app from wherever they are on the site.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Messenger chat button opens faster without third-party scripts",
        summary:
            "The chat button used to load Facebook's entire Messenger SDK in the background, slowing down the page. It now redirects you directly to Messenger with a simple link, so it opens instantly without any extra tracking scripts.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Fixed layout overlap between promo card and chat widget",
        summary:
            "The homepage promotional card was overlapping with the floating chat support widget, making both hard to interact with. The promo card is now positioned to clear the widget on all screen sizes.",
        category: "Fix"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Chat widget and install button now have correct spacing and brand colors",
        summary:
            "Fixed a visual issue where the chat widget and app button were overlapping and using placeholder colors instead of the brand's real palette. They now sit evenly spaced with proper brand-accurate styling.",
        category: "Fix"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Instagram section has smoother hover effects and links to the profile",
        summary:
            "Hovering over images in the Instagram feed section now triggers a smoother, more refined animation. The section heading now also links directly to the brand's Instagram profile so you can follow with a single tap.",
        category: "Design"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Product info stays visible while you scroll through images",
        summary:
            "On the product page, the pricing, size selector, and add-to-cart button now remain fixed on screen while you scroll through the product photo gallery. You no longer have to scroll back up to buy after reviewing all the images.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Quick Add button on featured products",
        summary:
            "Featured products on the homepage now have a Quick Add button so you can drop items straight into your cart without visiting the product page. Select your variant and add — all without leaving the page.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Featured product section has a cleaner, more balanced layout",
        summary:
            "Resized the featured product title and repositioned the action buttons so the primary \"Add to Cart\" action is always the most prominent element. The layout now feels more editorial and less cluttered.",
        category: "Design"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Keyboard focus indicators no longer appear when clicking with a mouse",
        summary:
            "Focus outlines used to appear on buttons and links whenever you clicked them with a mouse, which looked unintentional. They now only appear when navigating with a keyboard, keeping the interface clean while remaining fully accessible.",
        category: "Improvement"
    },
    {
        date: "2026-04-08",
        time: "4pm",
        headline: "Whole-number prices no longer show unnecessary decimal places",
        summary:
            "Prices like $50.00 or $120.00 now display as $50 and $120 across the entire store, reducing visual noise. Prices with cents (like $19.99) still display the full amount as expected.",
        category: "Improvement"
    },
    {
        date: "2026-04-07",
        time: "6pm",
        headline: "Product links now show the correct preview when shared on social media",
        summary:
            "Fixed missing metadata that caused product pages and other content to appear without a title, image, or description when shared on social platforms like Twitter, Facebook, and iMessage. Links now display a proper rich preview.",
        category: "Fix"
    },
    {
        date: "2026-04-07",
        time: "6pm",
        headline: "Corrected heading structure on product pages for better search visibility",
        summary:
            "Each product page now has a single, well-structured main heading instead of multiple conflicting ones. This helps search engines understand the page content correctly and can improve how products appear in search results.",
        category: "Fix"
    },
    {
        date: "2026-04-06",
        time: "1pm",
        headline: "Free shipping progress bar only appears when a threshold is set",
        summary:
            "The progress bar showing how close you are to free shipping was displaying even when no minimum order requirement was configured. It now correctly stays hidden until a free shipping threshold has been set up.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        time: "9am",
        headline: "Your Instagram handle now links directly to your profile",
        summary:
            "The Instagram section on the homepage now features the brand handle as a live link that takes visitors directly to the Instagram profile. Clicking the handle opens Instagram in a new tab for easy following.",
        category: "New Feature"
    },
    {
        date: "2026-04-05",
        time: "9am",
        headline: "Empty homepage sections are now hidden automatically",
        summary:
            "Sections that have no content configured — such as testimonials or feature highlights — are now hidden instead of showing as blank gaps. The homepage always looks intentional and complete regardless of which sections are active.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        time: "9am",
        headline: "Text on the collection promo card is always readable",
        summary:
            "Fixed a contrast issue where text on the collection promotional card could become hard to read depending on the brand's accent color. The card now ensures readable contrast across all color configurations.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        time: "9am",
        headline: "Product and collection data refreshes up to 4× more often",
        summary:
            "Updated product listings, prices, and inventory now appear on the site within 5 hours instead of the previous 23-hour window. If a product goes out of stock or a promotion starts, the store reflects it much sooner.",
        category: "Performance"
    },
    {
        date: "2026-04-05",
        time: "9am",
        headline: "All Products count in the menu is now accurate",
        summary:
            "The number shown next to \"All Products\" in the full-screen navigation menu was sometimes displaying an incorrect total. It now always reflects the actual product count in the store.",
        category: "Fix"
    }
];
