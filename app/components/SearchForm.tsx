/**
 * @fileoverview Basic search form with keyboard shortcuts (Cmd+K, Escape)
 *
 * @description
 * SearchForm is a wrapper around React Router's Form component that adds keyboard
 * shortcuts for search input focus. Provides render prop pattern for flexible UI.
 * Submits GET requests to /search route with query parameter.
 *
 * @features
 * - Cmd+K / Ctrl+K to focus search input
 * - Escape to blur search input
 * - Render prop pattern for flexible UI
 * - Optional form ref for programmatic submission
 * - GET method for server-side search handling
 *
 * @props
 * - children: Render function that receives inputRef
 * - formRef: Optional ref to form element
 * - ...props: Additional FormProps (action, method, etc.)
 *
 * @architecture
 * Uses React Router Form component for:
 * - Automatic URL updates with query params
 * - Server-side search handling via loader
 * - Progressive enhancement (works without JS)
 *
 * Keyboard shortcuts handled via custom hook:
 * - useFocusOnCmdK: Sets up global keyboard event listeners
 *
 * @related
 * - routes/search.tsx - Handles search requests and displays results
 * - FullScreenSearch.tsx - Uses SearchForm for search overlay
 * - Header.tsx - May use SearchForm in desktop header
 *
 * @example
 * ```tsx
 * <SearchForm>
 *   {({inputRef}) => (
 *     <>
 *       <input
 *         ref={inputRef}
 *         type="search"
 *         name="q"
 *         placeholder="Search products..."
 *       />
 *       <button type="submit">Search</button>
 *     </>
 *   )}
 * </SearchForm>
 * ```
 */

import {useRef, useEffect} from "react";
import {Form, type FormProps} from "react-router";

// ================================================================================
// Type Definitions
// ================================================================================

type SearchFormProps = Omit<FormProps, "children"> & {
    children: (args: {inputRef: React.RefObject<HTMLInputElement | null>}) => React.ReactNode;
    /** Optional ref to the form element for programmatic submission */
    formRef?: React.RefObject<HTMLFormElement>;
};

// ================================================================================
// Search Form Component
// ================================================================================

/**
 * SearchForm - Search form with keyboard shortcuts
 *
 * Wraps React Router Form with keyboard shortcut handling and render prop pattern.
 * Automatically focuses input on Cmd+K and blurs on Escape.
 *
 * Render prop pattern allows flexible UI:
 * - Caller controls input styling and additional buttons
 * - inputRef provided for keyboard shortcut handling
 * - Full access to FormProps for customization
 *
 * @param children - Render function receiving {inputRef}
 * @param formRef - Optional form element ref
 * @param props - Additional FormProps
 * @returns null if children is not a function, otherwise Form element
 */
export function SearchForm({children, formRef, ...props}: SearchFormProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useFocusOnCmdK(inputRef);

    if (typeof children !== "function") {
        return null;
    }

    return (
        <Form method="get" ref={formRef} {...props}>
            {children({inputRef})}
        </Form>
    );
}

// ================================================================================
// Keyboard Shortcut Hook
// ================================================================================

/**
 * useFocusOnCmdK - Global keyboard shortcuts for search input
 *
 * Sets up global event listeners for:
 * - Cmd+K / Ctrl+K: Focus search input (industry standard)
 * - Escape: Blur search input (close/cancel)
 *
 * Prevents default browser behavior for Cmd+K (browser search).
 * Cleans up event listeners on unmount.
 *
 * @param inputRef - Ref to search input element
 */
function useFocusOnCmdK(inputRef: React.RefObject<HTMLInputElement | null>) {
    // focus the input when cmd+k is pressed
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "k" && event.metaKey) {
                event.preventDefault();
                inputRef.current?.focus();
            }

            if (event.key === "Escape") {
                inputRef.current?.blur();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [inputRef]);
}
