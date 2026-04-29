# storefront_002

## Always Do First

**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## ⚠️ Git Worktree Workflow (MANDATORY)

**NEVER CREATE BRANCHES**. Use git worktrees for parallel work:

```bash
git worktree add ../storefront_002-<feature-name>   # Create worktree
git worktree list                              # List worktrees
git worktree remove <path>                     # Remove worktree
git worktree prune                             # Clean stale refs
```

Direct commits to main only. Enables parallel AI development, eliminates branch overhead.

**Always break large tasks into focused scopes** — run parallel agents with git worktrees, each with a narrow, well-defined goal.

---

## Project Overview

Part of the **storefront family** (`storefront_001`, `storefront_002`, `storefront_003`, etc.) — a collection of commercial Shopify Hydrogen templates built to be sold to multiple client brands across different niches. High-performance storefront (React Router 7, Shopify Oxygen/Cloudflare Workers) with PWA, metaobject CMS, wishlist, blog, offline support. **Critical**: Import from `react-router`, NOT `@remix-run/react`.

Backend behavior, data flow, and Hydrogen conventions **must remain consistent** across all storefronts — the frontend layer (UI, presentation, visual identity) is where storefronts differentiate.

### Hydrogen Implementation Reference

`~/Desktop/projects/demo-store` is a **freshly scaffolded, unmodified Shopify Hydrogen codebase** — the **primary source of truth** for all non-frontend-visual-design patterns. Consult it first when uncertain about core Hydrogen conventions, data-fetching patterns, route/loader structure, or server-side implementation details.

### Dual Deployment Targets

| Target                             | Purpose                         | Data Source                               |
| ---------------------------------- | ------------------------------- | ----------------------------------------- |
| **Shopify Oxygen**                 | Client production deployments   | Client's own Shopify store (no fallback)  |
| **Cloudflare Workers + local dev** | Portfolio showcase + dev server | Demo Shopify store credentials + in-repo content defaults |

- On **Oxygen**: use the client's Shopify credentials only
- On **Cloudflare Workers** portfolio deployments: `wrangler.jsonc` is preconfigured with the demo-store credentials
- During **local development**: point `.env` at the desired Shopify store; UI and content defaults currently live in `app/lib/metaobject-parsers.ts`

## Tech Stack

| Category      | Tech             | Version    | Notes                               |
| ------------- | ---------------- | ---------- | ----------------------------------- |
| **Framework** | React            | 18.3.1     |                                     |
|               | React Router     | 7.12       | Hydrogen preset, file-based routing |
|               | Shopify Hydrogen | 2026.4.1   | Storefront + Customer Account APIs  |
|               | Storefront API   | 2026-04    | GraphQL API version                 |
|               | TypeScript       | 5.9        | Strict mode, ES2022 target          |
|               | Vite             | 6          | Build tooling                       |
| **UI**        | Tailwind CSS     | v4         | CSS-first config via `@import`      |
|               | shadcn/ui        | -          | 27 Radix UI components              |
|               | Lucide React     | -          | Icons                               |
|               | OKLCH colors     | -          | WCAG 2.1 AA compliant               |
| **Features**  | Lenis            | 1.3.16     | GPU-accelerated smooth scroll       |
|               | Workbox          | 7.0.0      | Service worker, offline support     |
|               | Embla Carousel   | 8.6.x      | Auto-scroll, wheel gestures         |
|               | colorjs.io       | -          | Color manipulation                  |
|               | Sonner           | 2.x        | Toast notifications                 |
|               | tw-animate-css   | 1.x        | CSS animation utilities             |
|               | react-intersection-observer | 10.x | Viewport detection / infinite scroll |
| **Dev**       | ESLint           | 9          | TypeScript, React, a11y             |
|               | npm              | Latest     | Package manager + scripts           |
|               | Prettier         | 3          | Shopify config                      |
|               | Node.js          | >= 20.19.0 | **Strict requirement**              |

**GraphQL**: Dual-project (Storefront API + Customer Account API)
**Path Alias**: `~/` → `app/`

## Core Architecture

```
storefront_002/
├── app/
│   ├── routes/              # 51 routes
│   ├── components/          # 135 components
│   │   ├── ui/              # 27 shadcn
│   │   ├── blog/            # 7 blog
│   │   ├── changelog/       # 2 changelog
│   │   ├── pwa/             # 5 PWA
│   │   ├── product/         # ShoppingSummary, ProductBadge, ProductTagList
│   │   ├── motion/          # Parallax
│   │   ├── gallery/         # Gallery grid
│   │   ├── icons/           # Custom icons
│   │   └── ProductLightbox/ # Lightbox system
│   ├── lib/                 # 71 utilities
│   │   ├── metaobject-*.ts  # CMS
│   │   ├── pwa-*.ts         # PWA
│   │   ├── changelog-data.ts # Static changelog entries
│   │   ├── color/           # WCAG color contrast
│   │   ├── performance/     # Image optimization helpers
│   │   ├── product/         # Product data, variants, pricing
│   │   ├── types/           # Shared type definitions
│   │   └── fragments.ts     # GraphQL fragments
│   ├── hooks/               # 13 hooks
│   ├── graphql/customer-account/  # 15 queries
│   └── styles/tailwind.css  # v4 + animations
├── public/sw.js             # Workbox
├── server.ts                # Cloudflare Workers entry
├── wrangler.jsonc           # Workers deploy config
├── vite.config.ts           # Vite build config
└── react-router.config.ts   # Hydrogen preset
```

## Common Commands

```bash
npm run dev                  # Dev server + GraphQL codegen
npm run build                # Production build
npm run preview              # Preview build
npm run lint                 # ESLint
npm run typecheck            # TypeScript + route types
npm run codegen              # Regenerate GraphQL types
npm run dev:workers          # Build + run locally under Wrangler
npm run deploy:workers       # Build + deploy to Cloudflare Workers
npm run deploy:workers:dry   # Build + Wrangler dry-run (no publish)
npm run cf-typegen           # Regenerate Cloudflare Worker types
```

## Code Style

**ESLint**: `eslint:recommended` + TypeScript + React + JSX a11y

- camelCase/PascalCase naming, `no-console: warn`, `object-shorthand: error`
- React hooks v7 rules disabled (TODO: refactor)

**Prettier**: 4 spaces, 120 chars, double quotes, no trailing commas, `avoid` arrow parens

**TypeScript**: Strict mode, ES2022, Bundler resolution, `~/` alias

**React**: Import from `react-router`, JSDoc comments

**Files**: Co-locate related files, PascalCase components, camelCase utilities

## MCP Servers

**shopify-dev**: Hydrogen, Storefront/Customer Account APIs, `validate_graphql_codeblocks` (MANDATORY for GraphQL)
**context7**: Tailwind, shadcn, Radix UI, React, TypeScript

Always use MCP tools over web search for official docs. Validate GraphQL after ANY query change.

## Testing

**Current**: None
**Recommended**: Vitest, React Testing Library, Playwright, MSW

## Cart Actions Reference (`app/routes/cart.tsx`)

| Action                                 | Method                          | Notes                                  |
| -------------------------------------- | ------------------------------- | -------------------------------------- |
| `CartForm.ACTIONS.LinesAdd`            | `cart.addLines()`               | Add line items                         |
| `CartForm.ACTIONS.LinesUpdate`         | `cart.updateLines()`            | Update quantities / attributes         |
| `CartForm.ACTIONS.LinesRemove`         | `cart.removeLines()`            | Remove line items                      |
| `CartForm.ACTIONS.DiscountCodesUpdate` | `cart.updateDiscountCodes()`    | Replace all discount codes             |
| `CartForm.ACTIONS.GiftCardCodesUpdate` | `cart.updateGiftCardCodes()`    | Replace all gift card codes            |
| `CartForm.ACTIONS.GiftCardCodesAdd`    | `cart.addGiftCardCodes()`       | Append gift card codes (2026.1.0+)     |
| `CartForm.ACTIONS.GiftCardCodesRemove` | `cart.removeGiftCardCodes()`    | Remove applied gift card codes         |
| `CartForm.ACTIONS.NoteUpdate`          | `cart.updateNote()`             | Update cart note                       |
| `CartForm.ACTIONS.BuyerIdentityUpdate` | `cart.updateBuyerIdentity()`    | Update buyer country / customer        |

## Repository

**Commits**: Conventional (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:`)
**Before Push**: `npm run typecheck`, `npm run lint`, `npm run codegen` (after GraphQL changes)
**Code Review**: Read comments, update on change, test WCAG compliance

## Environment

**Node.js**: >= 20.19.0 (strict)
**Env Vars** (`.env`):

```bash
SESSION_SECRET=<32chars>                        # Required
PUBLIC_STORE_DOMAIN=<store>.myshopify.com      # Required
PUBLIC_STOREFRONT_API_TOKEN=<token>            # Required
PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX            # Optional
```

**Fallback Demo Store (Cloudflare Workers, Local Dev, and Portfolio Showcase ONLY):**

> ⚠️ Used during local development and Cloudflare Workers portfolio deployments. **NEVER use on Oxygen / client deployments.**

```bash
PUBLIC_STOREFRONT_API_TOKEN=586d8fd7c598fea7e1b97a8eff48ed49
PUBLIC_STORE_DOMAIN=horcrux-demo-store.myshopify.com
PUBLIC_CHECKOUT_DOMAIN=horcrux-demo-store.myshopify.com
PRIVATE_STOREFRONT_API_TOKEN=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
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=d59946cb-1d27-415f-bb8e-c8ea32ffb5eb
PUBLIC_CUSTOMER_ACCOUNT_API_URL=https://shopify.com/66049638586
SHOP_ID=66049638586
```

For portfolio Workers deploys, demo-store credentials live in `wrangler.jsonc`. UI and content defaults are currently embedded in `app/lib/metaobject-parsers.ts`, and `app/lib/data-source.ts` currently proxies Shopify only.

**Setup**: `npm install && npm run codegen && npm run dev`
**Dev URL**: check the Hydrogen dev output for the active local URL; do not assume `http://localhost:3000`

## Key Files

**Architecture**: `lib/pwa-queries.ts`, `lib/pwa-parsers.ts`, `lib/color/`, `lib/metaobject-*.ts`, `public/sw.js`
**Config**: `vite.config.ts`, `react-router.config.ts`, `eslint.config.js`, `styles/tailwind.css`
**GraphQL**: `storefrontapi.generated.d.ts`, `customer-accountapi.generated.d.ts`
**Solutions**: `lib/color/contrast.ts` (WCAG), `lib/wishlist-context.tsx` (SSR), `lib/smoothScroll.ts` (Lenis), `lib/cart-utils.ts` (global cart fetcher key + mutation hooks — `CART_FETCHER_KEY` must be passed to all CartForm components; `useCartMutationPending()` checks if any cart op is in flight; `useLineItemMutating(lineId)` scopes loading state to a specific line item only)
**Shared UI Patterns**: `components/PageHeading.tsx` — unified page heading + optional description used across all content pages (changelog, gallery, search, blog, FAQ, policies, etc.); use this instead of ad-hoc heading markup
**Skeleton Library**: `components/skeletons.tsx` — comprehensive skeleton loading components for all content types (products, articles, collections, cart, orders); use this instead of ad-hoc loading states
**Data Source Resolver**: `app/lib/data-source.ts` — validates store env and proxies Shopify queries used by the app context
**Content Defaults**: `app/lib/metaobject-parsers.ts` — fallback UI and content constants used when metaobject fields are missing
**Promise Utils**: `lib/promise-utils.ts` — timeout and fallback wrappers for deferred data; `withTimeoutAndFallback` prevents permanent loading states when promises hang (used in `root.tsx` for all deferred loaders — cart, footer, suggestions, auth)

## Critical Warnings

**1. React Router Imports**

- **Problem**: `@remix-run/react` causes runtime errors
- **Solution**: Always import from `react-router`

**2. WCAG Contrast**

- **Problem**: 4.5:1 (text) or 3:1 (UI) required
- **Solution**: `ensureContrastCompliance()`, test https://contrast-ratio.com

**3. SSR Hydration**

- **Problem**: LocalStorage during SSR breaks hydration
- **Solution**: `useState` + `useEffect` pattern (see `lib/wishlist-context.tsx`)

**4. GraphQL Codegen**

- **Problem**: Stale types after query changes
- **Solution**: `npm run codegen` after ANY GraphQL modification

**5. Service Worker Cache**

- **Problem**: Old content after deployments
- **Dev**: Disable cache or use Incognito
- **Production**: Auto-updates, version in `sw.js`

**6. Metaobject Fallbacks**

- **Problem**: Missing data breaks pages
- **Solution**: All parsers in `lib/metaobject-parsers.ts` have fallbacks

**7. Node Version**

- **Problem**: Node < 20.19.0 fails builds
- **Solution**: Use nvm/nodenv, verify `node --version`

**8. Path Alias**

- **Problem**: `~/` imports fail in tests
- **Solution**: `vite-tsconfig-paths` plugin loaded

**9. ESLint Hooks**

- **Problem**: React hooks v7 rules disabled
- **Status**: TODO - refactor to comply
- **Disabled**: `set-state-in-effect`, `refs`, `purity`

**10. `links()` in React Router 7**

- **Problem**: React Router 7 calls `links()` with zero arguments — destructuring `{data}` from `undefined` throws TypeError, causing 500s on every page load
- **Solution**: Never export `links()` that accesses loader data. For `<link rel="preload">`, add a `{tagName: "link", rel: "preload", ...}` descriptor inside `meta()` using resolved loader data instead

## Execution Strategy

- Use **multiple sub-agents** for independent tasks (research, implementation, review)
- Use **git worktrees** for parallel implementation work
- Provide agents with **context, constraints, and objectives** — not overly prescriptive step-by-step instructions
- Quality priorities: **clarity > technical correctness > practical usefulness > context density > signal over noise**

## Code Comments (MANDATORY)

Read all comments before editing. Update when changing code. Add for complex logic. Comments document intent, constraints, dependencies, edge cases, architecture.

## WCAG Accessibility (MANDATORY)

### Contrast Ratios

| Content                      | Minimum | WCAG        |
| ---------------------------- | ------- | ----------- |
| Normal text                  | 4.5:1   | 1.4.3 (AA)  |
| Large text (≥18pt/14pt bold) | 3:1     | 1.4.3 (AA)  |
| UI components                | 3:1     | 1.4.11 (AA) |
| Touch targets                | 44x44px | 2.5.5 (A)   |

**Color System**: OKLCH in `styles/tailwind.css`, contrast ratios documented inline, utility: `lib/color/contrast.ts`

**Checklist**:

1. Convert OKLCH→RGB (https://oklch.com)
2. Calculate ratio (https://contrast-ratio.com)
3. Verify 4.5:1 (text) or 3:1 (UI)
4. Document inline: `/* fg on bg = X.XX:1 (WCAG AA) ✓ */`
5. Test with a11y tools

**Merchant Colors**: Use `ensureContrastCompliance(merchantColor, background, fallback, 4.5)` - Shopify brand API may not be WCAG compliant.

**Tools**: contrast-ratio.com, oklch.com, axe DevTools, Chrome Accessibility Panel

## Performance

**Lenis**: GPU-accelerated smooth scrolling, `LenisProvider` in `PageLayout.tsx`, scroll hooks: `lib/useScrolled.ts`, `lib/useScrollProgress.ts`

**View Transitions + Prefetch**: All nav and product links use React Router 7's `viewTransition` prop for native browser page transitions, paired with `prefetch="viewport"` (links visible in the viewport) or `prefetch="intent"` (hover-intent). Any new `Link` or `NavLink` in navigation, product grids, or collection layouts MUST include both props to stay consistent with the established pattern (55 usages across the app).

**Service Worker**: Workbox 7.0.0, 5 caching strategies:

1. Shopify CDN (images/fonts): CacheFirst, 30 days
2. Google Fonts: StaleWhileRevalidate, 365 days
3. API: NetworkFirst, 5 min
4. Product images: CacheFirst, 7 days
5. Pages: NetworkFirst + `/offline` fallback

**PWA Components**: `components/pwa/` (AlreadyInstalledInstructions, IosInstallInstructions, OpenInAppButton, PwaAppIcon, ServiceWorkerUpdateBanner) + root `components/` (ServiceWorkerRegistration, NetworkStatusIndicator)

**PWA Hooks**: usePwaInstall, useServiceWorkerUpdate, useNetworkStatus, usePwaAnalytics

**Already-Installed Sheet**: When the PWA is detected as already installed, `AlreadyInstalledInstructions.tsx` renders a bottom sheet prompting the user to open the installed app instead of the browser.

## UI Guidelines (MANDATORY)

1. Use Tailwind CSS classes for all styling
2. Use shadcn components from `/app/components/ui`
3. Use context7 MCP server for Tailwind/shadcn docs

## Key Features

**Metaobject CMS**:

- `site_settings` (singleton): Brand, hero, testimonials, FAQs, Instagram, shipping, search content (labels, placeholders, filter text), messaging widgets (Messenger page_id, WhatsApp number — powers FloatingChatWidget)
- `theme_settings` (singleton): Fonts (Google), colors (OKLCH/HEX)
- 80/20 architecture: High-value content only
- Files: `lib/metaobject-queries.ts`, `lib/metaobject-parsers.ts`, `lib/site-content-context.tsx`
  Fallback constants currently live in `lib/metaobject-parsers.ts`.

**PWA Manifest**: Generated from metaobjects via `lib/pwa-queries.ts`, `lib/pwa-parsers.ts`, `routes/manifest[.]webmanifest.tsx`

| Field            | Source                           | Notes                      |
| ---------------- | -------------------------------- | -------------------------- |
| name             | site_settings.brand_name         | Fallback: shop.name        |
| description      | site_settings.brand_mission      | Fallback: shop.description |
| theme_color      | theme_settings.color_primary     | OKLCH→HEX                  |
| background_color | theme_settings.color_background  | OKLCH→HEX                  |
| icons            | site_settings.icon_192, icon_512 | Required                   |

**Wishlist**: `lib/wishlist-context.tsx` - React Context + LocalStorage, SSR-safe, cross-tab sync, optimistic updates, 6 animations. Routes: `/wishlist`, `/wishlist/share`, `/account/wishlist`, API: `/api/wishlist-products`. Account view sort options: date newest/oldest, price asc/desc, A-Z/Z-A — persisted in localStorage via `useWishlistSort` in `account.wishlist.tsx`.

**Cart**: `CartMain.tsx` — line items, promo codes, gift cards, order summary. Contains `CartSuggestions`: product recommendations carousel in the cart aside (fetched via `root.tsx` `cartSuggestions` deferred data). Multi-variant products open `QuickAddDialog` (desktop) or `QuickAddSheet` (mobile) for variant selection without leaving the cart.

**Quick Add**: `QuickAddButton.tsx` / `QuickAddDialog.tsx` (desktop modal) / `QuickAddSheet.tsx` (mobile bottom sheet) — add-to-cart with variant selection from product cards, no PDP navigation required. Auto-selects first available variant, integrates quantity selector, auto-closes on success.

**Color System**: `lib/color/` - OKLCH parsing, sRGB conversion, dual contrast (WCAG 2.1 + APCA), swatch borders, 500+ color names, `ensureContrastCompliance()`

**Hooks** (13 in `hooks/`): useChangelogFilter, useFooterClearance, useInView, useNetworkStatus, usePointerCapabilities, usePwaAnalytics, usePwaInstall, useReadingProgress, useRecentSearches, useScreenSize, useScrollLock, useSearchKeyboard, useServiceWorkerUpdate. Additional scroll hooks in `lib/`: useScrolled, useScrollProgress

**Animations**: 26 `@keyframes` in `tailwind.css` - product (fade-in, image-hover), cart (cart-item-enter, success-pulse, price-dot), wishlist (heart-beat, heart-glow, burst-ring), hero (shimmer), GPU-accelerated, respects `prefers-reduced-motion`

**Search**: Regular (full data), predictive (autocomplete), popular terms, recent (LocalStorage), keyboard (Cmd/Ctrl+K), full-screen overlay. Availability/in-stock filter labels and all UI text are CMS-configurable via `site_settings` search content fields (with hardcoded fallbacks in `metaobject-parsers.ts`)

**Blog**: 7 components in `components/blog/` - ArticleCard, ArticleHero, AuthorBio, ReadingTime, RelatedArticles, ShareButtons, TagBadge. SEO-optimized (JSON-LD), tag filtering. Routes: `/blogs`, `/blogs/:blogHandle`, `/blogs/:blogHandle/:articleHandle`, `/blogs/feed.xml` (RSS feed, returns XML with last 50 articles)

**Gallery**: Responsive grid + lightbox, route: `/gallery`, components: GalleryGrid, GalleryImageCard, metaobject-driven

**Changelog**: Changelog page for shoppers, route: `/changelog`, components: ChangelogEntry, ChangelogPage, hook: `useChangelogFilter`. Entries live in `lib/changelog-data.ts` (static file — add entries manually at commit time, see Changelog Entries section). The loader returns static entries directly — no external API calls.

**Recently Viewed**: Cookie-based product tracking across sessions. `lib/recently-viewed.ts` reads/writes product IDs via a cookie. `components/RecentlyViewedSection.tsx` renders a personalized product row on the homepage; products are fetched server-side in `routes/_index.tsx` by resolving the stored IDs against the Storefront API.

**Homepage Hero System**: `VideoHero.tsx` — full-viewport hero with separate mobile/desktop media from `site_settings`, integrated collection card overlay, and scroll-driven brand text animation via `BrandAnimationProvider` (`lib/brand-animation-layout.ts`, `lib/brand-name-sizes.ts`). `BrandMarquee.tsx` renders a scrolling marquee of trust signals below the hero. These three components form the homepage's above-the-fold section in `routes/_index.tsx`.

**Subscriptions**: Customer subscription contract management. Routes: `/account/subscriptions` (list), `/account/subscriptions/:id` (detail/management). `SellingPlanSelector.tsx` on the PDP renders delivery frequency options for products with selling plans; state is managed via the `?selling_plan=` URL query parameter (variant-aware filtering, price adjustment display).

**Chat Widgets**: `FloatingChatWidget.tsx` — floating column of Messenger + WhatsApp buttons, driven entirely by `site_settings.messengerPageId` and `site_settings.whatsappNumber`. Returns null and leaves no DOM trace when both fields are empty.

**Infinite Scroll**: `InfiniteScrollSection.tsx` — Hydrogen Pagination-based infinite scroll; navigates to next page URL when the "Load more" link enters viewport (replace mode, preserves history). `InfiniteScrollGrid.tsx` wraps the grid layout. Used by collections, search, and the sale page.

**Sale Page**: `/sale` route — auto-filters all products to those with compare-at pricing (on-sale items), sorted by highest discount percentage. Shows max discount in page title/meta. Uses `InfiniteScrollSection` + collection sidebar layout.

**Newsletter**: `api.newsletter.tsx` — POST endpoint that creates a Shopify customer with `acceptsMarketing: true`. Components: `NewsletterForm.tsx` (email input + submission) + `NewsletterSection.tsx` (section wrapper that also renders `PromotionalBanner.tsx` above the form). `PromotionalBanner.tsx` renders full-width media (image or video, 90dvh) for hero/campaign banners on the homepage and newsletter section.

---

## Frontend UI Visual Verification (REQUIRED)

**During any frontend UI or design work, you MUST use Playwright MCP to visually verify your changes.**

### Workflow

1. **Determine the active port** for this project before taking screenshots (see Port Detection below)
2. **Take screenshots** via Playwright MCP targeting the correct `http://localhost:<port>`
3. **Save to `tmp_screenshots/`** at the root of this repository
4. **Analyze each screenshot** against the plan or requirements to verify accuracy
5. **Iterate** — fix discrepancies, re-screenshot, re-analyze until requirements are met

### Rules

- **ALWAYS** take at least one screenshot per UI change before considering it done
- **NEVER** mark frontend work as complete without visual verification
- Screenshots go in `tmp_screenshots/` at the project root (create the directory if it doesn't exist)
- Name screenshots descriptively: `tmp_screenshots/homepage-hero.png`, `tmp_screenshots/cart-drawer-open.png`
- Take screenshots at multiple viewport sizes when responsive behavior matters (mobile + desktop)
- After each batch of changes, compare the screenshots against the original requirements or design spec and explicitly state what matches and what still needs work
- **MANDATORY CLEANUP**: After every successful task implementation, if the `tmp_screenshots/` directory was created during the work, it must be deleted before the task is considered complete. Do not skip this step — it is a hard requirement.
- **MANDATORY CLEANUP**: After every successful task implementation, if the `.playwright-mcp/` directory exists in the project root, it must be deleted before the task is considered complete. This directory is created by the Playwright MCP server during browser automation and is a transient artifact that must not persist in the codebase. Do not skip this step — it is a hard requirement.

### Port Detection

Multiple dev servers may be running simultaneously across projects. **Always identify the correct port before screenshotting.**

Detection order (use the first that works):

1. **Check dev server output** — the terminal running `npm run dev` prints the active URL (e.g. `Local: http://localhost:4457`)
2. **Check `vite.config.ts`** — look for an explicit `server.port` value
3. **Check `package.json`** — some scripts hardcode a port via `--port` flag
4. **Scan active ports** — run `lsof -i :3000-4999 | grep LISTEN` to see what's bound, then match the process to this project's directory

**Never assume port 3000.** If multiple Vite/Hydrogen servers are running, confirm you're screenshotting the right one by checking the page title or a unique element.

### Example Playwright MCP Usage

```
// First confirm the port (e.g. from dev server output: http://localhost:4457)
navigate to http://localhost:4457
take screenshot → tmp_screenshots/homepage-initial.png

// After making changes, verify
take screenshot → tmp_screenshots/homepage-after-fix.png
// Analyze: does this match the requirement?
```

### What to Check in Screenshots

- Layout matches the intended design/spec
- Spacing, typography, and colors are correct
- Interactive states (hover, focus, open/closed) render properly
- No visible layout breaks or overflow issues
- Responsive breakpoints behave as expected

## Changelog Entries (MANDATORY)

Every meaningful commit — one that adds a feature, improves the shopping experience, or fixes something users would notice — **MUST** include a corresponding entry in `app/lib/changelog-data.ts`.

**Rules:**
- Add the entry in the **same commit** that ships the change (never as a follow-up)
- Place the new entry at the **top** of `CHANGELOG_ENTRIES` (newest first)
- Write in plain English for shoppers — no SHAs, file paths, variable names, branch names, or technical jargon
- Use the correct category: `"New Feature"` | `"Improvement"` | `"Fix"` | `"Performance"` | `"Design"`
- Keep `headline` under 80 characters, focused on the user benefit

**Skip entries for:** `chore`, `ci`, `build`, `docs`, `lint`, dependency bumps, internal refactors with no visible user effect, and commits under ~20 lines changed.

**Do NOT rely on automation or AI to generate entries retroactively.** The entry must be written at commit time by the person who understands the change. Context is lost after the fact.
