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
        date: "2026-04-28",
        category: "New Feature",
        headline: "\"Get it now\" — skip the bag and go straight to checkout",
        summary: "Every product page, Quick Add dialog, and Quick Add sheet now has a \"Get it now\" button alongside the primary Add to Bag button. Tapping it adds the selected variant and quantity to your cart then takes you directly to checkout, with no extra steps."
    },
    {
        date: "2026-04-28",
        category: "New Feature",
        headline: "AI shopping agents can now build carts for you",
        summary: "AI shopping assistants can now create a ready-to-checkout cart on your behalf and send you a direct link. When you arrive via an agent link, a banner lets you review the items before proceeding — nothing goes to checkout without your confirmation."
    },
    {
        date: "2026-04-28",
        category: "Improvement",
        headline: "Cart and checkout always load fresh, never cached",
        summary: "Cart and checkout pages now bypass browser and CDN caches on every visit, so the item count, prices, and availability you see are always accurate and up to date."
    },
    {
        date: "2026-04-28",
        category: "Improvement",
        headline: "Product cards no longer scale during scrolling",
        summary: "Tapping a product card used to show a scale-down effect even when you were just scrolling past it. That feedback now only appears when you deliberately tap or click a card — scrolling through the grid stays smooth and distraction-free."
    },
    {
        date: "2026-04-28",
        category: "Fix",
        headline: "Quick Add no longer accidentally navigates to the product page",
        summary: "Tapping the backdrop to dismiss a Quick Add sheet or dialog would occasionally open the full product page instead. All Quick Add interactions — variant selection, adding to cart, and closing — are now fully isolated from the product card's navigation."
    },
    {
        date: "2026-04-28",
        category: "Improvement",
        headline: "Smoother browsing in product carousels",
        summary: "Product cards inside horizontal carousels (New Arrivals, You May Also Like, Recently Viewed, Cart Suggestions) now scroll cleanly without triggering the card's own media switcher. Cards displayed in the main grid still support swiping through all product photos."
    },
    {
        date: "2026-04-28",
        category: "New Feature",
        headline: "Smart policy search for AI shopping agents",
        summary: "AI assistants can now search shipping, return, and privacy policies along with FAQs to answer customer questions in natural language. Uses BM25-ranked search across all policy documents and FAQ content."
    },
    {
        date: "2026-04-28",
        category: "Improvement",
        headline: "Richer breadcrumb navigation in search results",
        summary: "Product, collection, and blog pages now include structured breadcrumb data, making them eligible for breadcrumb-enhanced Google search results. Added BreadcrumbList structured data (Schema.org) to every page that displays visual breadcrumbs."
    },
    {
        date: "2026-04-28",
        category: "Improvement",
        headline: "Enhanced product information for AI agents",
        summary: "Gift card badges, digital product indicators, and subscription plan chips now appear on product pages when applicable. Product pages now surface extended catalog fields: gift card detection, digital-product shipping status, available subscription plans, and collection membership."
    },
    {
        date: "2026-04-27",
        category: "New Feature",
        headline: "Stories: swipeable editorial product showcase at /stories",
        summary: "Browse the newest arrivals as a full-screen editorial experience — product image on the left, info on the right. Stories auto-advance every 6 seconds, support keyboard navigation with the arrow keys, and show a thumbnail strip so you can jump to any product directly."
    },
    {
        date: "2026-04-27",
        category: "New Feature",
        headline: "Compare products side by side at /compare",
        summary: "Add up to four products to a side-by-side comparison table. Price, brand, type, and availability are laid out in aligned rows so you can evaluate options at a glance. Remove any product with a single click and add your pick directly to the cart from the comparison view."
    },
    {
        date: "2026-04-26",
        category: "New Feature",
        headline: "AI assistants can now browse and shop the store in natural language",
        summary: "The store now supports Shopify's Storefront MCP — the open agentic commerce protocol rolling out across Shopify's entire merchant network. AI assistants like ChatGPT, Claude, and Perplexity can search the product catalog, ask about store policies, and build a cart through natural conversation, with no manual configuration required. The store also publishes a Universal Commerce Protocol profile at a standard discovery address, so any UCP-compliant AI agent can find and interact with it automatically."
    },
    {
        date: "2026-04-26",
        category: "New Feature",
        headline: "Revenue from AI referrals is now tracked per source",
        summary: "When a shopper arrives from an AI assistant — ChatGPT, Claude, Perplexity, Google AI Mode, Bing Copilot, and others — their checkout session is automatically tagged with the referring source. Every AI-referred sale shows up in your analytics under its own channel, so you can see exactly which AI assistants are driving orders and by how much."
    },
    {
        date: "2026-04-26",
        category: "Improvement",
        headline: "Products now publish precision data that AI agents can act on",
        summary: "Product pages now include a richer set of machine-readable structured data: precise availability status (in stock, running low, backordered, or sold out), barcodes and GTINs, original versus current pricing, publish dates, tags, and category. AI shopping agents use this to make accurate recommendations and build carts with confidence — reducing the chance of suggesting an out-of-stock item or quoting the wrong price."
    },
    {
        date: "2026-04-26",
        category: "Fix",
        headline: "Cart updates instantly after Quick Add",
        summary: "Products added via the Quick Add panel (both the pop-up on desktop and the bottom sheet on mobile) now appear in your cart drawer immediately — no page refresh needed."
    },
    {
        date: "2026-04-25",
        category: "Improvement",
        headline: "Smoother swiping on all carousels",
        summary: "Every carousel across the store — products, reviews, blog articles, collections, and more — now stops exactly where you release your finger or cursor, giving browsing a more natural, fluid feel."
    },
    {
        date: "2026-04-25",
        category: "Improvement",
        headline: "Product images stay in view while you read product details",
        summary: "On desktop, the product media panel — including images and videos — now stays fixed on screen while you scroll through the product description, variants, and purchase options. Once you've scrolled past all the product information, the media naturally scrolls away. This makes it easier to reference product visuals while reading copy without having to scroll back up."
    },
    {
        date: "2026-04-25",
        category: "Fix",
        headline: "Brand colors now display correctly across the entire store",
        summary: "The store's custom color theme — set through the brand settings — was being overridden by a default blue color scheme on every page. This affected text, buttons, backgrounds, and all branded UI elements. The issue has been corrected, so the colors you configure in your brand settings now appear exactly as intended for every visitor."
    },
    {
        date: "2026-04-25",
        category: "New Feature",
        headline: "Search can now be filtered to show only in-stock products",
        summary: "A new 'In Stock' toggle has been added to the full-screen search overlay. Switch it on to hide products that are currently unavailable, so every result you see is something you can order right now. The filter carries through when you navigate from the overlay to the main search results page. Quick Add has also been corrected to ensure the variant you select is the one that actually goes into your cart."
    },
    {
        date: "2026-04-25",
        category: "Fix",
        headline: "Homepage, product pages, and collection pages load reliably again",
        summary: "A recent update accidentally broke three of the most important pages in the store — the homepage, individual product pages, and every collection page would all crash with a server error instead of showing content. This has been corrected. All pages load normally again, including the collection sidebar which was also causing a flicker during page transitions."
    },
    {
        date: "2026-04-24",
        category: "Performance",
        headline: "Fonts and product pages load without blocking the screen",
        summary:
            "Custom fonts now load in the background instead of holding up the first paint, so text appears sooner on slower connections. The product page also fetches a smaller set of data — fewer media items, one collection lookup instead of ten, and no duplicate fields. Both changes combine to make pages feel noticeably faster on first visit."
    },
    {
        date: "2026-04-24",
        category: "Performance",
        headline: "Faster browsing with leaner product queries and CDN image optimisation",
        summary: "Product reviews now load separately from product details so the buy button and images appear sooner. The homepage, cart, and search now request fewer product variants, reducing data on every page load. Images use Shopify's CDN transforms for the right size on any screen. Page transitions between products use smooth native browser animations."
    },
    {
        date: "2026-04-24",
        category: "Performance",
        headline: "Faster page loads with smarter Shopify API caching",
        summary: "The homepage and gallery now cache their Shopify data instead of fetching it fresh on every visit. Collections, blog articles, and product lists are held in a long-lived cache so repeat visits load almost instantly. Recently viewed products and gallery pages use a shorter cache so they stay up to date without hitting the API every time. Navigation links on error pages now prefetch their destination the moment you hover, so the next page feels instant when you click."
    },
    {
        date: "2026-04-24",
        category: "New Feature",
        headline: "Gift card codes can now be applied directly in your cart",
        summary: "The cart now fully supports gift card redemption — enter a gift card code in the dedicated field to apply your balance before reaching checkout. You can replace or clear a code at any time while your bag is open. Previously, the gift card field was visible but applying a code had no effect."
    },
    {
        date: "2026-04-24",
        category: "Improvement",
        headline: "Collection pages now include a sidebar for easier browsing",
        summary: "A sidebar now sits alongside the product grid on collection and catalogue pages, making it easier to navigate categories and apply filters without losing your place in the results. On smaller screens the sidebar stays tucked away and slides in when you need it."
    },
    {
        date: "2026-04-24",
        category: "Design",
        headline: "Out-of-stock product cards no longer show a diagonal strikethrough overlay",
        summary: "The semi-transparent diagonal stripe that used to appear over the product photo when an item was unavailable has been removed. The out-of-stock state is now communicated through the badge label and a subtle desaturated tint on the card image, keeping the photography fully visible and unobscured."
    },
    {
        date: "2026-04-24",
        category: "Fix",
        headline: "App offline features now work without depending on Google's CDN",
        summary: "The service worker that powers offline browsing and PWA installation previously loaded its core libraries from an external Google CDN. If that CDN was slow, blocked, or unreachable, the offline layer would fail silently. Those libraries are now bundled with the app itself so offline support stays reliable under any network conditions."
    },
    {
        date: "2026-04-23",
        category: "Improvement",
        headline: "Search links now keep their chosen price order",
        summary: "If you open a search link that asks for Price: Low to High or Price: High to Low, the product results now load in that order right away instead of quietly falling back to relevance. The store also keeps its backup social links ready when a merchant has not filled them in yet, so the footer still shows a complete set of brand channels on lightly configured shops."
    },
    {
        date: "2026-04-23",
        category: "Improvement",
        headline: "Wrong-URL pages now open a browsable carousel of collections instead of a dead end",
        summary: "Typing a link that doesn't exist — or landing on an old URL that's been removed — used to show a plain error screen with a single Return Home button. The 404 page now shows a drag-to-scroll carousel of the store's collections directly below the heading, with the same card style used on the homepage: a tall photo tile, the collection name at the bottom, and a soft gradient for readability. You can sweep through them with a swipe, a mouse wheel, or the arrow keys and jump straight into the aisle you were probably looking for. The same upgrade touches smaller error screens scattered across the store (account sub-pages, order detail pages, policies that have been renamed): each now shows a proper status, a clearer message, and a Try Again button alongside Return Home, instead of a bare link."
    },
    {
        date: "2026-04-23",
        category: "Improvement",
        headline: "Contact section removed — reach support through the live chat button instead",
        summary: "The dedicated contact card on the homepage and the email and phone strip in the footer have been retired to keep the layout cleaner and more focused. The floating Messenger and WhatsApp chat button is still available on every page, giving you a faster and more direct way to reach support from wherever you are in the store."
    },
    {
        date: "2026-04-22",
        category: "Improvement",
        headline: "Product videos now play everywhere a product appears, not just on cards",
        summary: "When a product's lead media is a video, it now plays consistently across the whole store — in the cart drawer and cart page, in the quick add panel on desktop, in the mobile variant sheet, and in the featured product spotlight on the homepage. Before, those surfaces always showed a still image even when the merchant had set a video as the first media. The switch between video and photo happens automatically based on what the merchant uploaded, so whatever you see on a product card is what you'll see everywhere else. Videos stay muted, loop quietly, and only start loading when they scroll into view — on both mobile and desktop."
    },
    {
        date: "2026-04-22",
        category: "Fix",
        headline: "Photo dots on product cards no longer overlap the Quick Add button",
        summary: "On product cards with more than one photo or video, the little row of dots that shows which slide you're on used to sit right on top of the Quick Add button on mobile — and slide underneath it on desktop when you hovered. The dots now lift clear of the button automatically: always visible on phones, and rising up to meet the button as it fades in on desktop. Nothing gets hidden behind anything else anymore."
    },
    {
        date: "2026-04-22",
        category: "Design",
        headline: "Gallery photos on mobile now show without the dark gradient overlay",
        summary: "On phones, every gallery photo used to sit behind a permanent dark gradient at the bottom of the card. The overlay has been removed on small screens so the photography itself takes centre stage — the image fills the card cleanly with nothing obscuring the lower edge. Tablets and desktops keep the overlay behaviour they had, including the hover reveal on pointer devices."
    },
    {
        date: "2026-04-22",
        category: "Improvement",
        headline: "Product cards now browse photos and videos in one carousel",
        summary: "Product cards used to show either a video or a stack of photos. Now every photo and video appears together in a single carousel, so you can flip between the hero video and the detail shots without leaving the card. Videos only start loading when the card is near the screen and pause when you scroll past, keeping browsing smooth even on pages with lots of products."
    },
    {
        date: "2026-04-22",
        category: "New Feature",
        headline: "Product cards now play a short video when the first media asset is a video",
        summary: "If a product's first media asset is a video, shoppers now see that video playing silently on the product card — across collections, search results, related products, cart suggestions, and every other place cards appear. Videos autoplay muted with a poster placeholder that keeps the layout stable, and they only start loading once the card is close to the screen so pages with many products stay fast. Products without a video continue to use the existing image carousel unchanged."
    },
    {
        date: "2026-04-22",
        category: "Performance",
        headline: "Gallery photos now load in the most efficient format, sized to your screen",
        summary: "The gallery used to serve the full-resolution original of every product photo regardless of whether you were on a phone or a desktop. Every image is now delivered in AVIF at a width that matches your screen, with a subtle shimmer placeholder while it loads. Gallery pages feel dramatically lighter on mobile networks and the first row of photos is prioritised for faster initial paint."
    },
    {
        date: "2026-04-21",
        category: "New Feature",
        headline: "Product pages now surface the full set of product tags as pill badges",
        summary: "Every product detail page now lists the product's categorization tags as compact, muted pill badges below the description. Shoppers can see at a glance what categories, themes, or attributes a product belongs to — without cluttering the page or competing with promotional badges like New, Premium, or Pre-Order."
    },
    {
        date: "2026-04-21",
        category: "Design",
        headline: "More breathing room between the footer and the sticky buy button on product pages",
        summary: "On mobile product pages, the footer now sits further above the sticky Get it Now bar. The copyright row and designer credit are no longer crowded against the button — there's a clear gap so the two feel like distinct layers of the page."
    },
    {
        date: "2026-04-21",
        category: "Performance",
        headline: "Article pages now render instantly instead of fading section-by-section",
        summary: "Entrance animations on the article body, share row, author bio, back button, and related articles have been removed. All sections are visible the moment the page loads — the reading experience feels faster and nothing scrolls into view as you read."
    },
    {
        date: "2026-04-21",
        category: "Design",
        headline: "Share buttons on articles refreshed with stronger presence",
        summary: "The share row at the bottom of each article has been redesigned — a bolder serif heading with a decorative rule, larger pill buttons with bigger icons, a subtle lift on hover, and tap targets that comfortably exceed accessibility minimums on every screen size."
    },
    {
        date: "2026-04-21",
        category: "Improvement",
        headline: "Featured blog card is now fully tappable on the blog index",
        summary: "Tapping anywhere on the featured article card at the top of the blog page now opens the article — not just the Read Article button. The card is also taller on phones so the image and headline carry more weight as the entry point to reading."
    },
    {
        date: "2026-04-21",
        category: "Fix",
        headline: "Blog index no longer repeats a lone article twice",
        summary: "When a store has only a single published article, the blog page now shows the featured hero on its own without repeating the same article in a list directly below it."
    },
    {
        date: "2026-04-21",
        category: "Improvement",
        headline: "Recent searches now show a thumbnail of the product you last tapped",
        summary: "When you search and tap a product result, that search term is saved alongside the product's thumbnail. The next time you open search, your recent search chips show a small image next to each term — making it much faster to recognise and return to things you were looking at."
    },
    {
        date: "2026-04-21",
        category: "New Feature",
        headline: "Blog articles now available as an RSS feed",
        summary: "All published blog posts are now syndicated at /blogs/feed.xml in RSS 2.0 format. Subscribe in any RSS reader to get new articles automatically, or share the feed link with newsletter tools and content aggregators."
    },
    {
        date: "2026-04-21",
        category: "Design",
        headline: "Quick-add sheet polished to match the site's visual style",
        summary: "The variant-selection sheet that slides up on mobile when you tap a product's quick-add button has been refined throughout — title weight and colour now match the rest of the site, option group labels (Size, Bundle, etc.) are shown above each set of pills, and all interactive buttons now share the same animation and focus behaviour as the rest of the store."
    },
    {
        date: "2026-04-21",
        category: "Fix",
        headline: "Trackpad scroll now works on cart suggestions carousel",
        summary: "Two-finger horizontal trackpad scroll through product suggestions in the cart drawer is fully working. Touch swipe on mobile also restored. Mouse drag-to-scroll remains off."
    },
    {
        date: "2026-04-21",
        category: "Fix",
        headline: "\"Get Now\" in cart suggestions now opens the size/colour picker",
        summary: "Tapping \"Get Now\" on a product in the suggested items carousel inside your bag now correctly opens the variant selector so you can choose your size, colour, or style before adding — instead of silently adding the default option."
    },
    {
        date: "2026-04-21",
        category: "Design",
        headline: "Featured product action buttons are now full-width on small screens",
        summary: "On phones with narrow screens, the call-to-action buttons in the homepage featured product section now span the full available width, making them easier to tap. The newsletter section on mobile also shows a more compact layout to keep the page clean."
    },
    {
        date: "2026-04-21",
        category: "Improvement",
        headline: "Wishlist can now be sorted alphabetically by product name",
        summary: "Two new sort options — A to Z and Z to A — have been added to the wishlist controls, making it easy to find a specific saved item by name when your list is long. The sort and view controls have also been reorganised into a cleaner layout on all screen sizes."
    },
    {
        date: "2026-04-20",
        category: "Improvement",
        headline: "Only the updated item's price animates during cart changes",
        summary: "When you change the quantity of one item, only that item's price shows the loading shimmer — all other items in your bag remain fully visible and static. The checkout total still updates to reflect any change."
    },
    {
        date: "2026-04-20",
        category: "Design",
        headline: "Prices animate gracefully while your cart is updating",
        summary: "Instead of showing a spinner or going blank, prices in your bag and in the checkout button now display a soft shimmer while a cart change is in progress. The Checkout label and its icon stay visible at all times — only the price itself animates until the updated total arrives."
    },
    {
        date: "2026-04-20",
        category: "Improvement",
        headline: "Cart removals and quantity changes reflect instantly in your bag",
        summary: "Removing an item now hides it immediately — no waiting for the server to confirm. Changing a quantity shows the new number right away. Both changes still sync with Shopify in the background, so your cart is always accurate."
    },
    {
        date: "2026-04-20",
        category: "Improvement",
        headline: "Cart controls freeze instantly while your cart is updating",
        summary: "Quantity buttons, remove buttons, and quick-add buttons now lock the moment a cart action starts and unlock as soon as it completes. Prices in your bag fade slightly to show they're being recalculated. This prevents double-submissions and makes it immediately obvious that your change is on its way."
    },
    {
        date: "2026-04-19",
        category: "Fix",
        headline: "Navigating back no longer crashes the page in some browsers",
        summary: "On certain browsers, pressing the back button to return to a product or collection page could cause the page to go blank or throw a script error. The page now reloads cleanly in this situation, so browsing back through your history always works as expected."
    },
    {
        date: "2026-04-19",
        category: "Fix",
        headline: "Quick Add now shows a clean placeholder for products with no images",
        summary: "Opening Quick Add on a product that has no product images previously resulted in a broken layout. The variant selector now shows a clean placeholder instead, so you can still choose your size and add the item to your cart without any visual glitches."
    },
    {
        date: "2026-04-19",
        category: "Fix",
        headline: "Product page content no longer hides behind the sticky buy bar on mobile",
        summary: "On mobile, the content near the bottom of a product page — including the footer — was occasionally tucked behind the sticky Add to Cart bar, making it unreachable. The page now has enough bottom spacing to keep all content accessible."
    },
    {
        date: "2026-04-19",
        category: "Improvement",
        headline: "Cart suggestions heading rotates based on your cart",
        summary: "The heading above the product recommendations carousel in your bag now adapts to whether your cart is empty or has items. Each time you open your bag, a fresh heading is picked from a curated set — so the experience feels a little more considered, and a little less repetitive."
    },
    {
        date: "2026-04-19",
        category: "Design",
        headline: "Shopping Summary card refreshed to match the store's visual design",
        summary: "The price breakdown card on product pages has been redesigned with a refined look — tighter spacing, cleaner typography, and styling consistent with the rest of the store. Savings badges now use the same emerald styling as free shipping indicators, and the current-cart row has a subtle pill treatment for better clarity."
    },
    {
        date: "2026-04-19",
        category: "New Feature",
        headline: "Shopping Summary now shows your full price breakdown on product pages",
        summary: "A Shopping Summary card now appears on every product page, showing the item price, any savings if it's on sale, and the updated cart total after adding the item — so you know exactly what you're committing to before you tap Add to Bag."
    },
    {
        date: "2026-04-19",
        category: "Design",
        headline: "Cart suggestion cards are now more compact and balanced",
        summary: "The product suggestions strip inside the cart now shows more cards at once across all screen sizes — giving you a better overview of what's available without needing to scroll as much."
    },
    {
        date: "2026-04-19",
        category: "New Feature",
        headline: "Product pages now show tag badges for special items",
        summary: "Pre-Order, New, Premium, and Clearance products now display a badge above the product title on the product page so you can quickly identify what makes each item special before adding it to your cart."
    },
    {
        date: "2026-04-19",
        category: "Fix",
        headline: "Brand name size is now consistent across the site",
        summary: "The store name in the navigation bar, the scroll animation that brings it up from the hero, and the full-screen menu header all now render at the same size at every screen width. Previously, the scroll animation would settle at a slightly different size than the nav bar, creating a subtle but visible jump."
    },
    {
        date: "2026-04-19",
        category: "Improvement",
        headline: "Button loading states now show a clean spinner instead of loading text",
        summary: "All action buttons (newsletter, address form, wishlist, return request) now display a consistent spinner during loading — no more text swapping between states. Button dimensions stay stable throughout."
    },
    {
        date: "2026-04-19",
        category: "Improvement",
        headline: "Cart suggestions no longer show products already in your bag",
        summary:
            "The 'You might also like' carousel now hides any product you've already added to your cart — instantly and without a page refresh. This keeps suggestions fresh and relevant as you shop."
    },
    {
        date: "2026-04-19",
        category: "Improvement",
        headline: "Two-finger trackpad scroll now works on all product and article carousels",
        summary:
            "You can now swipe horizontally with two fingers on a trackpad to scroll through product recommendations, curated collections, and related articles — in addition to clicking and dragging."
    },
    {
        date: "2026-04-19",
        category: "Design",
        headline: "Cart suggestions are better sized for browsing at all screen sizes",
        summary:
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
        category: "Fix",
        headline: "Add to Bag button no longer gets stuck after returning from the checkout page",
        summary: "If you tapped 'Add to Bag' and then navigated back from the Shopify checkout page, the button could become unresponsive for the rest of the session — requiring a page refresh to shop again. It now resets correctly when you return, so you can keep adding items without any interruption."
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
        category: "Improvement",
        headline: "App updates now apply automatically without any action from you",
        summary: "When the store app receives an update, the changes now take effect on your next visit — with no 'A new version is available' banner to dismiss or 'Refresh' prompt to acknowledge."
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
            "Headings on pages like Search, Gallery, FAQ, Blog, and Changelog are now displayed at a larger, more consistent size that matches the visual weight of the Collections pages. Every section of the store now has the same clear, confident title hierarchy.",
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
        category: "Improvement",
        headline: "Installed app users are now prompted to open the app, not install it again",
        summary: "If you have already added the store to your home screen, the install button now recognises this and shows a prompt to open the installed app directly — instead of offering to install something you already have."
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
    },
    {
        date: "2026-04-05",
        category: "New Feature",
        headline: "Collections can now be sorted by best sellers",
        summary: "A 'Best Selling' option has been added to the sort controls on all collection pages, so you can quickly see the most popular products in any category without having to guess which ones other shoppers prefer."
    },
    {
        date: "2026-04-04",
        category: "New Feature",
        headline: "Newsletter sign-up section added to the homepage",
        summary: "A newsletter subscription block now appears on the homepage between the FAQ and the footer, making it easy for visitors to sign up for updates without navigating away from what they are browsing."
    },
    {
        date: "2026-04-02",
        category: "Design",
        headline: "Account pages have been refreshed with a consistent card-based layout",
        summary: "Your order history, saved addresses, profile settings, and other account sections have been redesigned with a unified card layout and subtle entrance animations — making the account area feel more polished and easier to navigate."
    },
    {
        date: "2026-04-01",
        category: "Fix",
        headline: "Homepage no longer shows a dark blank area when loading",
        summary: "On certain devices and browsers, the top section of the homepage briefly appeared as a solid dark block before the hero image and content loaded in. The page now renders cleanly from the first frame, and the hero animation plays reliably every time."
    },
    {
        date: "2026-04-01",
        category: "Improvement",
        headline: "Blog page now shows a helpful message when no articles are published yet",
        summary: "When the blog has no published articles, the page previously appeared blank. It now shows a friendly message along with a direct link to browse the shop, so visitors always have somewhere useful to go."
    },
    {
        date: "2026-04-01",
        category: "Fix",
        headline: "Account navigation is now hidden for visitors who are not signed in",
        summary: "When visiting account-related pages without being logged in, the account navigation sidebar was still showing. It now stays out of the way for signed-out visitors, keeping the page relevant to what you can actually do."
    },
    {
        date: "2026-04-01",
        category: "Fix",
        headline: "Page-not-found errors now show a clean, friendly message",
        summary: "When you landed on a page that doesn't exist, the error screen used to display the full URL path in the message, which looked technical and confusing. It now shows a short, plain message instead."
    },
    {
        date: "2026-04-01",
        category: "Fix",
        headline: "Navigating directly to the cart address no longer shows an error",
        summary: "Typing the cart URL directly into the browser or following an outdated bookmark to the cart page used to return a page-not-found error. It now redirects you to the homepage instead."
    },
    {
        date: "2026-04-01",
        category: "Improvement",
        headline: "Older product and collection links now redirect to the right page",
        summary: "Links to products and collections using older URL formats — from previous store setups, social posts, or bookmarks — now automatically redirect to the correct page instead of landing on a 404 error."
    },
    {
        date: "2026-03-26",
        category: "Improvement",
        headline: "Log out and cancel subscription buttons now show a loading indicator",
        summary: "Clicking 'Log out' or 'Cancel subscription' now immediately disables the button and shows a spinner while the action processes — preventing accidental double-taps and making it clear that your request is on its way."
    },
    {
        date: "2026-03-23",
        category: "Fix",
        headline: "Brand marquee no longer pauses when you hover over it",
        summary: "The scrolling strip at the bottom of the hero section used to stop moving when you moved your cursor over it. It now scrolls continuously — hovering over it no longer interrupts the animation."
    },
    {
        date: "2026-03-09",
        category: "Fix",
        headline: "Brand name animation plays correctly as you scroll",
        summary: "The animation that brings the store name into view as you scroll down past the hero section was not triggering reliably. It now plays smoothly on every page load."
    },
    {
        date: "2026-03-06",
        category: "Fix",
        headline: "Navigation links are now easier to read",
        summary: "The colour of links in the top navigation bar has been adjusted for better readability, making it clearer which items are tappable and where they take you."
    },
    {
        date: "2026-03-04",
        category: "Fix",
        headline: "Checkout button now correctly opens the checkout page",
        summary: "The 'Proceed to Checkout' button was not navigating to the checkout page — clicking it did nothing. It now takes you to your cart checkout every time."
    }
];
