/**
 * @fileoverview React Router Route Configuration
 *
 * @description
 * Configures the routing system for the application using React Router 7's
 * file-based routing with Hydrogen's route wrapper. Routes are automatically
 * discovered from the app/routes/ directory structure.
 *
 * @architecture
 * Routing Strategy:
 * - Uses flatRoutes() for file-based routing convention
 * - Wrapped with hydrogenRoutes() for Hydrogen-specific features
 * - Route files in app/routes/ are automatically mapped to URLs
 *
 * @file-based-routing
 * File → Route mapping examples:
 * - _index.tsx → /
 * - products.$handle.tsx → /products/:handle
 * - collections._index.tsx → /collections
 * - account.orders._index.tsx → /account/orders
 *
 * @conventions
 * - $ prefix = dynamic segment (parameter)
 * - _ prefix = layout route or private segment
 * - . separator = nested routes
 * - [...] = catch-all route
 *
 * @dependencies
 * - @react-router/fs-routes - File-based routing
 * - @react-router/dev - Route configuration types
 * - @shopify/hydrogen - Hydrogen route wrapper
 *
 * @related
 * - app/routes/ - All route files
 * - react-router.config.ts - React Router configuration
 *
 * @see https://reactrouter.com/api/framework-conventions/routes.ts
 */

import {flatRoutes} from "@react-router/fs-routes";
import {type RouteConfig} from "@react-router/dev/routes";
import {hydrogenRoutes} from "@shopify/hydrogen";

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

/**
 * Export route configuration wrapped with Hydrogen features.
 *
 * hydrogenRoutes() adds:
 * - Cart fetcher routes
 * - Customer Account API routes
 * - SEO meta handling
 *
 * Manual routes can be added to the array alongside file-based routes.
 */
export default hydrogenRoutes([
    ...(await flatRoutes())
    // Manual route definitions can be added here if needed
    // Example: { path: '/custom', file: './routes/custom.tsx' }
]) satisfies RouteConfig;
