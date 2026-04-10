/**
 * @fileoverview Account Profile Route
 *
 * @description
 * Comprehensive customer profile page combining personal information,
 * address book management, and email marketing preferences. Features
 * auto-saving profile fields and modal-based address editing.
 *
 * @route GET/PUT/POST /account/profile
 *
 * @authentication
 * Requires customer authentication (enforced by parent account layout).
 * Customer data inherited from account layout via outlet context.
 *
 * @data-loading
 * - Loader: Verifies authentication only (no data loaded)
 * - Customer data: Provided by parent layout via useOutletContext
 * - Profile updates: Auto-saved via fetcher (debounced 800ms)
 * - Address operations: Full page mutations with revalidation
 *
 * @related
 * - CustomerUpdateMutation.ts - Profile field updates
 * - MarketingMutations.ts - Email subscription mutations
 * - CustomerAddressMutations.ts - Address CRUD mutations
 * - account.tsx - Parent layout providing customer context
 */

import type {CustomerAddressInput, CustomerUpdateInput} from "@shopify/hydrogen/customer-account-api-types";
import type {AddressFragment, CustomerFragment} from "customer-accountapi.generated";
import {CUSTOMER_UPDATE_MUTATION} from "~/graphql/customer-account/CustomerUpdateMutation";
import {
    CUSTOMER_EMAIL_MARKETING_SUBSCRIBE,
    CUSTOMER_EMAIL_MARKETING_UNSUBSCRIBE
} from "~/graphql/customer-account/MarketingMutations";
import {
    UPDATE_ADDRESS_MUTATION,
    DELETE_ADDRESS_MUTATION,
    CREATE_ADDRESS_MUTATION
} from "~/graphql/customer-account/CustomerAddressMutations";
import {
    data as remixData,
    Form,
    useActionData,
    useFetcher,
    useLoaderData,
    useNavigation,
    useOutletContext
} from "react-router";
import type {Route} from "./+types/account.profile";
import {getAccountMeta} from "~/lib/seo";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {Button} from "~/components/ui/button";
import {Alert, AlertDescription} from "~/components/ui/alert";
import {Avatar, AvatarFallback} from "~/components/ui/avatar";
import {Separator} from "~/components/ui/separator";
import {Card, CardContent} from "~/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "~/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "~/components/ui/alert-dialog";
import {Checkbox} from "~/components/ui/checkbox";
import {Badge} from "~/components/ui/badge";
import {AuthRequiredFallback} from "~/components/AuthRequiredFallback";
import {
    MailIcon,
    PhoneIcon,
    UserIcon,
    BellIcon,
    AlertCircleIcon,
    LockIcon,
    PlusIcon,
    MapPinIcon,
    HomeIcon,
    GlobeIcon,
    PencilIcon,
    Trash2Icon,
    BuildingIcon,
    CheckIcon,
    Loader2Icon,
    UserCogIcon
} from "lucide-react";
import {AnimatedSection} from "~/components/AnimatedSection";
import {Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent} from "~/components/ui/empty";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {useScrollLock} from "~/hooks/useScrollLock";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Combined action response type for all profile operations.
 *
 * Supports multiple operation types with shared error handling:
 * - Profile updates return customer data
 * - Marketing updates return marketingUpdated flag
 * - Address operations return created/updated/deleted IDs
 */
export type ActionResponse = {
    // Profile
    customer?: CustomerFragment | null;
    marketingUpdated?: boolean;
    // Addresses
    addressId?: string | null;
    createdAddress?: AddressFragment | null;
    updatedAddress?: AddressFragment | null;
    deletedAddress?: string | null;
    // Shared
    error?: string | Record<string, string> | null;
};

// =============================================================================
// ROUTE EXPORTS
// =============================================================================

export const meta: Route.MetaFunction = () => {
    return getAccountMeta("Profile");
};

/**
 * Always revalidate to ensure fresh customer data.
 * Profile changes should reflect immediately.
 */
export function shouldRevalidate() {
    return true;
}

// =============================================================================
// LOADER
// =============================================================================

/**
 * Checks authentication status and returns it for the component.
 *
 * Customer data comes from parent account layout via outlet context.
 * No longer throws/redirects for unauthenticated users - the component
 * shows AuthRequiredFallback instead.
 */
export async function loader({context}: Route.LoaderArgs) {
    let isAuthenticated = false;
    try {
        isAuthenticated = await context.customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    return remixData(
        {isAuthenticated},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
}

// =============================================================================
// ACTION
// =============================================================================

/**
 * Handles all profile-related mutations.
 *
 * Routes operations based on request method and intent:
 * - PUT: Profile field updates (firstName, lastName)
 * - POST + intent: Specific operations (marketing, addresses)
 *
 * @returns ActionResponse with operation result or error
 */
export async function action({request, context}: Route.ActionArgs) {
    const {customerAccount} = context;

    const form = await request.formData();
    const intent = form.get("intent");

    try {
        // Handle marketing subscription toggle
        if (intent === "toggleEmailMarketing") {
            const subscribe = form.get("subscribe") === "true";

            if (subscribe) {
                const {data: subscribeData, errors} = await customerAccount.mutate(CUSTOMER_EMAIL_MARKETING_SUBSCRIBE, {
                    variables: {
                        language: customerAccount.i18n.language
                    }
                });

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (subscribeData?.customerEmailMarketingSubscribe?.userErrors?.length) {
                    throw new Error(subscribeData.customerEmailMarketingSubscribe.userErrors[0].message);
                }
            } else {
                const {data: unsubscribeData, errors} = await customerAccount.mutate(
                    CUSTOMER_EMAIL_MARKETING_UNSUBSCRIBE,
                    {
                        variables: {
                            language: customerAccount.i18n.language
                        }
                    }
                );

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (unsubscribeData?.customerEmailMarketingUnsubscribe?.userErrors?.length) {
                    throw new Error(unsubscribeData.customerEmailMarketingUnsubscribe.userErrors[0].message);
                }
            }

            return remixData(
                {error: null, customer: null, marketingUpdated: true},
                {
                    headers: {
                        "Set-Cookie": await context.session.commit(),
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                }
            );
        }

        // Handle address creation (no addressId needed — the address doesn't exist yet)
        if (intent === "createAddress") {
            const isLoggedIn = await customerAccount.isLoggedIn();
            if (!isLoggedIn) {
                return remixData(
                    {error: {create: "Unauthorized"}},
                    {
                        status: 401,
                        headers: {"Set-Cookie": await context.session.commit()}
                    }
                );
            }

            const defaultAddress = form.has("defaultAddress") ? String(form.get("defaultAddress")) === "on" : false;
            const address = parseAddressForm(form);

            const {data, errors} = await customerAccount.mutate(CREATE_ADDRESS_MUTATION, {
                variables: {
                    address,
                    defaultAddress,
                    language: customerAccount.i18n.language
                }
            });

            if (errors?.length) {
                throw new Error(errors[0].message);
            }

            if (data?.customerAddressCreate?.userErrors?.length) {
                return remixData(
                    {error: {create: data.customerAddressCreate.userErrors[0].message}},
                    {
                        status: 400,
                        headers: {"Set-Cookie": await context.session.commit()}
                    }
                );
            }

            if (!data?.customerAddressCreate?.customerAddress) {
                throw new Error("Customer address create failed.");
            }

            return remixData(
                {
                    error: null,
                    createdAddress: data.customerAddressCreate.customerAddress
                },
                {
                    headers: {
                        "Set-Cookie": await context.session.commit(),
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                }
            );
        }

        // Handle address update/delete (addressId required)
        if (intent === "updateAddress" || intent === "deleteAddress") {
            const addressId = form.has("addressId") ? String(form.get("addressId")) : null;
            if (!addressId) {
                throw new Error("You must provide an address id.");
            }

            const isLoggedIn = await customerAccount.isLoggedIn();
            if (!isLoggedIn) {
                return remixData(
                    {error: {[addressId]: "Unauthorized"}},
                    {
                        status: 401,
                        headers: {"Set-Cookie": await context.session.commit()}
                    }
                );
            }

            const defaultAddress = form.has("defaultAddress") ? String(form.get("defaultAddress")) === "on" : false;
            const address = parseAddressForm(form);

            if (intent === "updateAddress") {
                const {data, errors} = await customerAccount.mutate(UPDATE_ADDRESS_MUTATION, {
                    variables: {
                        address,
                        addressId: decodeURIComponent(addressId),
                        defaultAddress,
                        language: customerAccount.i18n.language
                    }
                });

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (data?.customerAddressUpdate?.userErrors?.length) {
                    return remixData(
                        {error: {[addressId]: data.customerAddressUpdate.userErrors[0].message}},
                        {
                            status: 400,
                            headers: {"Set-Cookie": await context.session.commit()}
                        }
                    );
                }

                if (!data?.customerAddressUpdate?.customerAddress) {
                    throw new Error("Customer address update failed.");
                }

                return remixData(
                    {
                        error: null,
                        updatedAddress: data.customerAddressUpdate.customerAddress
                    },
                    {
                        headers: {
                            "Set-Cookie": await context.session.commit(),
                            "Cache-Control": "no-cache, no-store, must-revalidate"
                        }
                    }
                );
            }

            if (intent === "deleteAddress") {
                const {data, errors} = await customerAccount.mutate(DELETE_ADDRESS_MUTATION, {
                    variables: {
                        addressId: decodeURIComponent(addressId),
                        language: customerAccount.i18n.language
                    }
                });

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (data?.customerAddressDelete?.userErrors?.length) {
                    return remixData(
                        {error: {[addressId]: data.customerAddressDelete.userErrors[0].message}},
                        {
                            status: 400,
                            headers: {"Set-Cookie": await context.session.commit()}
                        }
                    );
                }

                if (!data?.customerAddressDelete?.deletedAddressId) {
                    throw new Error("Customer address delete failed.");
                }

                return remixData(
                    {error: null, deletedAddress: addressId},
                    {
                        headers: {
                            "Set-Cookie": await context.session.commit(),
                            "Cache-Control": "no-cache, no-store, must-revalidate"
                        }
                    }
                );
            }
        }

        // Handle profile update (PUT method without intent)
        if (request.method === "PUT") {
            const isLoggedIn = await customerAccount.isLoggedIn();
            if (!isLoggedIn) {
                return remixData(
                    {error: {profile: "Unauthorized"}, customer: null},
                    {
                        status: 401,
                        headers: {
                            "Set-Cookie": await context.session.commit(),
                            "Cache-Control": "no-cache, no-store, must-revalidate"
                        }
                    }
                );
            }

            const customer: CustomerUpdateInput = {};
            const validInputKeys = ["firstName", "lastName"] as const;
            for (const [key, value] of form.entries()) {
                if (!validInputKeys.includes(key as (typeof validInputKeys)[number])) {
                    continue;
                }
                if (typeof value === "string" && value.length) {
                    customer[key as (typeof validInputKeys)[number]] = value;
                }
            }

            const {data: mutationData, errors} = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
                variables: {
                    customer,
                    language: customerAccount.i18n.language
                }
            });

            if (errors?.length) {
                throw new Error(errors[0].message);
            }

            if (!mutationData?.customerUpdate?.customer) {
                throw new Error("Customer profile update failed.");
            }

            return remixData(
                {
                    error: null,
                    customer: mutationData?.customerUpdate?.customer
                },
                {
                    headers: {
                        "Set-Cookie": await context.session.commit(),
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                }
            );
        }

        return remixData(
            {error: "Method not allowed"},
            {
                status: 405,
                headers: {"Set-Cookie": await context.session.commit()}
            }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        return remixData(
            {error: errorMessage, customer: null},
            {
                status: 400,
                headers: {
                    "Set-Cookie": await context.session.commit()
                }
            }
        );
    }
}

// =============================================================================
// HELPERS
// =============================================================================

/** Extract address fields from form data into a CustomerAddressInput object. */
function parseAddressForm(form: FormData): CustomerAddressInput {
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
        "address1",
        "address2",
        "city",
        "company",
        "territoryCode",
        "firstName",
        "lastName",
        "phoneNumber",
        "zoneCode",
        "zip"
    ];

    for (const key of keys) {
        const value = form.get(key);
        if (typeof value === "string") {
            address[key] = value;
        }
    }

    return address;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Debounce delay for auto-save in milliseconds */
const AUTO_SAVE_DELAY = 800;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Account profile page with auto-saving and address management.
 *
 * Uses outlet context for customer data from parent layout.
 * Manages multiple fetchers for independent form submissions.
 */
export default function AccountProfile() {
    const {isAuthenticated} = useLoaderData<typeof loader>();
    const account = useOutletContext<{customer: CustomerFragment}>();
    const {state} = useNavigation();
    const actionData = useActionData<ActionResponse>();
    const customer = account?.customer;

    // All hooks must be called unconditionally before any early returns
    // to satisfy the Rules of Hooks (same order every render).
    const profileFetcher = useFetcher<ActionResponse>();
    const marketingFetcher = useFetcher<ActionResponse>();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<AddressFragment | null>(null);

    const [firstName, setFirstName] = useState(customer?.firstName ?? "");
    const [lastName, setLastName] = useState(customer?.lastName ?? "");
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useScrollLock(isAddDialogOpen || !!editingAddress);

    // Show success indicator when profile save completes
    useEffect(() => {
        if (profileFetcher.state === "idle" && profileFetcher.data?.customer) {
            setShowSaveSuccess(true);

            // Clear any existing success timeout
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }

            // Hide success indicator after 2 seconds
            successTimeoutRef.current = setTimeout(() => {
                setShowSaveSuccess(false);
            }, 2000);
        }
    }, [profileFetcher.state, profileFetcher.data]);

    // Handle marketing toggle errors - revert UI and show error
    const isServerEmailSubscribed = customer?.emailAddress?.marketingState === "SUBSCRIBED";
    const isEmailSubscribed = marketingFetcher.formData
        ? marketingFetcher.formData.get("subscribe") === "true"
        : isServerEmailSubscribed;

    useEffect(() => {
        if (marketingFetcher.state === "idle" && marketingFetcher.data?.error) {
            const errorMessage =
                typeof marketingFetcher.data.error === "string"
                    ? marketingFetcher.data.error
                    : "Failed to update email preferences";
            toast.error(errorMessage);
        } else if (marketingFetcher.state === "idle" && marketingFetcher.data?.marketingUpdated) {
            // Show subtle success feedback
            toast.success(isEmailSubscribed ? "Subscribed to email updates" : "Unsubscribed from email updates");
        }
    }, [marketingFetcher.state, marketingFetcher.data, isEmailSubscribed]);

    // Handle success notifications for address operations
    useEffect(() => {
        if (state === "idle" && actionData) {
            if (actionData.createdAddress) {
                toast.success("Address created successfully");
                setIsAddDialogOpen(false);
            } else if (actionData.updatedAddress) {
                toast.success("Address updated successfully");
                setEditingAddress(null);
            } else if (actionData.deletedAddress) {
                toast.success("Address deleted successfully");
            }
        }
    }, [actionData, state]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        };
    }, []);

    // Early return for unauthenticated users (after all hooks)
    if (!isAuthenticated) {
        return <AuthRequiredFallback message="Sign in to manage your profile, addresses, and preferences." />;
    }

    // Get initials for avatar fallback
    const initials = [customer.firstName?.[0], customer.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

    // Determine if profile is currently saving
    const isProfileSaving = profileFetcher.state !== "idle";

    // Auto-save name fields with debouncing
    const autoSaveProfile = (newFirstName: string, newLastName: string) => {
        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Only save if values have changed from server state
        const hasFirstNameChanged = newFirstName !== (customer.firstName ?? "");
        const hasLastNameChanged = newLastName !== (customer.lastName ?? "");

        if (!hasFirstNameChanged && !hasLastNameChanged) {
            return;
        }

        // Set new timeout for debounced save
        saveTimeoutRef.current = setTimeout(() => {
            const formData = new FormData();
            formData.append("firstName", newFirstName);
            formData.append("lastName", newLastName);

            void profileFetcher.submit(formData, {
                method: "PUT",
                action: "/account/profile"
            });
        }, AUTO_SAVE_DELAY);
    };

    // Handle first name change
    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        setShowSaveSuccess(false);
        autoSaveProfile(value, lastName);
    };

    // Handle last name change
    const handleLastNameChange = (value: string) => {
        setLastName(value);
        setShowSaveSuccess(false);
        autoSaveProfile(firstName, value);
    };

    return (
        <>
            {/* Max-width wrapper for optimal readability on large screens
                Constrains form-heavy content to ~1024px for better readability
                and visual balance. No effect on mobile/tablet. */}
            <div className="max-w-5xl mx-auto">
                <div className="space-y-10 md:space-y-14 lg:space-y-16">
                    {/* Profile Header - Hero style matching dashboard */}
                    <AnimatedSection animation="hero" threshold={0.1}>
                        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 sm:p-8 md:p-10">
                            {/* Subtle decorative gradient overlay */}
                            <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary/90 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-light/5 to-transparent pointer-events-none" />

                            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                {/* Left Side - Avatar and Info */}
                                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                    <Avatar className="size-16 sm:size-20 md:size-24 border-2 border-primary-foreground/20 shadow-lg shrink-0 ring-4 ring-primary-foreground/10">
                                        <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-serif bg-primary-foreground/10 text-primary-foreground">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1.5 min-w-0">
                                        <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-primary-foreground mb-0 leading-tight tracking-tight">
                                            {customer.displayName || "Your Profile"}
                                        </h1>
                                        <p className="text-primary-foreground/90 text-sm md:text-base truncate">
                                            Manage your account details and preferences
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side - Auto-save status */}
                                <div className="hidden md:flex items-center gap-2 text-sm text-primary-foreground/90 shrink-0">
                                    {isProfileSaving && (
                                        <>
                                            <Loader2Icon className="size-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    )}
                                    {showSaveSuccess && !isProfileSaving && (
                                        <>
                                            <CheckIcon className="size-4 text-success-on-dark" />
                                            <span className="text-success-on-dark">Changes saved</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Personal Information Section */}
                    <AnimatedSection animation="slide-up" threshold={0.1} delay={50}>
                        <section className="space-y-6">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                        <UserCogIcon className="size-5 md:size-6 text-muted-foreground" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                                        Personal Information
                                    </h2>
                                </div>
                                {/* Mobile auto-save status */}
                                <div className="flex md:hidden items-center gap-2 text-sm text-muted-foreground">
                                    {isProfileSaving && (
                                        <>
                                            <Loader2Icon className="size-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    )}
                                    {showSaveSuccess && !isProfileSaving && (
                                        <>
                                            <CheckIcon className="size-4 text-success" />
                                            <span className="text-success">Saved</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {typeof profileFetcher.data?.error === "string" && (
                                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                                    <AlertCircleIcon className="size-4 text-destructive" />
                                    <AlertDescription className="text-destructive">
                                        {profileFetcher.data.error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Personal Info Card */}
                            <Card className="overflow-hidden rounded-2xl py-0 bg-linear-to-br from-muted/30 via-card to-muted/15 shadow-[0_0_0_1px_oklch(0.94_0_0/0.3),0_2px_12px_rgba(0,0,0,0.04)]">
                                <CardContent className="p-5 md:p-6 space-y-5 md:space-y-6">
                                    {/* Name Fields */}
                                    <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="firstName" className="text-sm font-medium">
                                                First name
                                            </Label>
                                            <Input
                                                id="firstName"
                                                type="text"
                                                autoComplete="given-name"
                                                placeholder="Enter your first name"
                                                aria-label="First name"
                                                value={firstName}
                                                onChange={e => handleFirstNameChange(e.target.value)}
                                                minLength={2}
                                                className="h-10 md:h-11"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="lastName" className="text-sm font-medium">
                                                Last name
                                            </Label>
                                            <Input
                                                id="lastName"
                                                type="text"
                                                autoComplete="family-name"
                                                placeholder="Enter your last name"
                                                aria-label="Last name"
                                                value={lastName}
                                                onChange={e => handleLastNameChange(e.target.value)}
                                                minLength={2}
                                                className="h-10 md:h-11"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Contact Info - Read-only */}
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                            Contact Details
                                        </p>

                                        {/* Email */}
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                                            <div className="flex items-center justify-center size-10 rounded-full bg-muted shrink-0">
                                                <MailIcon className="size-5 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                    <LockIcon className="size-3" />
                                                    Email address
                                                </p>
                                                <p className="text-foreground font-medium truncate">
                                                    {customer.emailAddress?.emailAddress ?? "Not set"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Phone - if present */}
                                        {customer.phoneNumber?.phoneNumber && (
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                                                <div className="flex items-center justify-center size-10 rounded-full bg-muted shrink-0">
                                                    <PhoneIcon className="size-5 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-muted-foreground">Phone number</p>
                                                    <p className="text-foreground font-medium">
                                                        {customer.phoneNumber.phoneNumber}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </AnimatedSection>

                    {/* Saved Addresses Section */}
                    <AnimatedSection animation="section" threshold={0.1} delay={100}>
                        <section className="space-y-6">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                        <MapPinIcon className="size-5 md:size-6 text-muted-foreground" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                                        Saved Addresses
                                    </h2>
                                </div>
                                {customer.addresses.nodes.length > 0 && (
                                    <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="gap-2">
                                        <PlusIcon className="size-4" />
                                        <span className="hidden sm:inline">Add Address</span>
                                        <span className="sm:hidden">Add</span>
                                    </Button>
                                )}
                            </div>

                            {/* Add Address Modal */}
                            <AddressFormModal
                                isOpen={isAddDialogOpen}
                                onClose={() => setIsAddDialogOpen(false)}
                                mode="create"
                            />

                            {/* Edit Address Modal */}
                            <AddressFormModal
                                isOpen={!!editingAddress}
                                onClose={() => setEditingAddress(null)}
                                mode="edit"
                                address={editingAddress}
                                isDefaultAddress={editingAddress?.id === customer.defaultAddress?.id}
                            />

                            {/* Addresses list */}
                            {customer.addresses.nodes.length === 0 ? (
                                <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                                    <CardContent className="p-0">
                                        <Empty className="py-16 md:py-20">
                                            <EmptyHeader>
                                                <EmptyMedia>
                                                    <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 shadow-inner">
                                                        <MapPinIcon className="size-10 md:size-12 text-muted-foreground" />
                                                    </div>
                                                </EmptyMedia>
                                                <EmptyTitle className="text-xl md:text-2xl font-serif">
                                                    No addresses saved
                                                </EmptyTitle>
                                                <EmptyDescription className="max-w-sm">
                                                    Add a shipping address to make your checkout experience faster and
                                                    easier
                                                </EmptyDescription>
                                            </EmptyHeader>
                                            <EmptyContent>
                                                <Button
                                                    onClick={() => setIsAddDialogOpen(true)}
                                                    size="lg"
                                                    className="gap-2 motion-interactive"
                                                >
                                                    <PlusIcon className="size-4" />
                                                    Add your first address
                                                </Button>
                                            </EmptyContent>
                                        </Empty>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:gap-5 md:grid-cols-2">
                                    {customer.addresses.nodes.map(address => (
                                        <AddressCard
                                            key={address.id}
                                            address={address}
                                            isDefault={customer.defaultAddress?.id === address.id}
                                            isOnlyAddress={customer.addresses.nodes.length === 1}
                                            onEdit={() => setEditingAddress(address)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </AnimatedSection>

                    {/* Preferences Section */}
                    <AnimatedSection animation="slide-up" threshold={0.1} delay={50}>
                        <section className="space-y-6">
                            {/* Section Header */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                    <BellIcon className="size-5 md:size-6 text-muted-foreground" />
                                </div>
                                <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                                    Preferences
                                </h2>
                            </div>

                            {/* Email Marketing Card */}
                            <Card className="overflow-hidden rounded-2xl bg-linear-to-br from-success/5 via-card to-success/5 py-0 shadow-sm">
                                <CardContent className="p-5 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Left Side - Icon and Content */}
                                        <div className="flex items-start gap-4 md:gap-5 flex-1">
                                            <div className="flex items-center justify-center size-14 md:size-16 rounded-2xl bg-success/15 shrink-0 shadow-inner">
                                                <MailIcon className="size-7 md:size-8 text-success" />
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="text-lg md:text-xl font-serif font-medium text-foreground">
                                                        Email Updates
                                                    </h3>
                                                    <Badge
                                                        variant={isEmailSubscribed ? "default" : "secondary"}
                                                        className={
                                                            isEmailSubscribed
                                                                ? "bg-success/15 text-[oklch(0.40_0.12_142)] hover:bg-success/15"
                                                                : ""
                                                        }
                                                    >
                                                        {isEmailSubscribed ? "Subscribed" : "Not subscribed"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg">
                                                    Be the first to know about new arrivals, exclusive offers, and
                                                    seasonal promotions tailored just for you.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Side - Toggle */}
                                        <div className="flex items-center justify-end md:pl-4">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={isEmailSubscribed}
                                                aria-label={
                                                    isEmailSubscribed
                                                        ? "Unsubscribe from email updates"
                                                        : "Subscribe to email updates"
                                                }
                                                onClick={() => {
                                                    const formData = new FormData();
                                                    formData.append("intent", "toggleEmailMarketing");
                                                    formData.append("subscribe", isEmailSubscribed ? "false" : "true");

                                                    void marketingFetcher.submit(formData, {
                                                        method: "POST",
                                                        action: "/account/profile"
                                                    });
                                                }}
                                                className={`
                                            relative inline-flex h-8 w-14 md:h-10 md:w-18 shrink-0 cursor-pointer items-center
                                            rounded-full border-2 border-transparent
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                            disabled:cursor-not-allowed disabled:opacity-50
                                            ${isEmailSubscribed ? "bg-primary" : "bg-muted"}
                                        `}
                                            >
                                                <span
                                                    className={`
                                                pointer-events-none block size-6 md:size-8 rounded-full bg-background shadow-lg ring-0
                                                transition-transform duration-300 ease-in-out
                                                ${isEmailSubscribed ? "translate-x-7 md:translate-x-9" : "translate-x-0.5"}
                                            `}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </AnimatedSection>
                </div>
            </div>
        </>
    );
}

// =============================================================================
// ADDRESS FORM MODAL
// =============================================================================

/**
 * Reusable modal dialog for address creation and editing.
 *
 * @param isOpen - Modal visibility state
 * @param onClose - Close handler callback
 * @param mode - "create" or "edit" operation mode
 * @param address - Existing address data (for edit mode)
 * @param isDefaultAddress - Whether address is currently default
 *
 * Features:
 * - Grouped form sections (Contact, Street, Location)
 * - Validation for required fields
 * - Default address checkbox
 * - Sticky header/footer for scrollable content
 * - Mobile-responsive layout
 */
function AddressFormModal({
    isOpen,
    onClose,
    mode,
    address,
    isDefaultAddress = false
}: {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    address?: AddressFragment | null;
    isDefaultAddress?: boolean;
}) {
    const navigation = useNavigation();
    const actionData = useActionData<ActionResponse>();

    const isCreate = mode === "create";
    const addressId = isCreate ? "NEW_ADDRESS_ID" : (address?.id ?? "");
    const error =
        typeof actionData?.error === "object" && actionData?.error !== null ? actionData.error[addressId] : null;

    const currentIntent = navigation.formData?.get("intent");
    const isSubmitting =
        navigation.state !== "idle" &&
        (isCreate ? currentIntent === "createAddress" : currentIntent === "updateAddress");

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent
                data-lenis-prevent
                className="w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] lg:w-[50vw] lg:max-w-3xl max-h-[85vh] sm:max-h-[90vh] p-0 gap-0 rounded-2xl sm:rounded-3xl overflow-y-auto overflow-x-hidden"
            >
                {/* Sticky Header */}
                <DialogHeader className="px-5 md:px-6 pt-5 md:pt-6 pb-4 bg-background sticky top-0 z-10 rounded-t-2xl sm:rounded-t-3xl">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-primary/10">
                            <MapPinIcon className="size-5 md:size-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl md:text-2xl font-serif mb-0">
                                {isCreate ? "Add New Address" : "Edit Address"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm mt-1">
                                {isCreate
                                    ? "Fill in the details below to add a new shipping address."
                                    : "Update the details below to modify this address."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form Content */}
                <Form method="POST">
                    <input type="hidden" name="intent" value={isCreate ? "createAddress" : "updateAddress"} />
                    <input type="hidden" name="addressId" value={addressId} />

                    {/* Error display at top */}
                    {error && (
                        <div className="px-5 md:px-6 pt-4">
                            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                                <AlertCircleIcon className="size-4" />
                                <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <div className="px-5 md:px-6 py-5 md:py-6 space-y-5 md:space-y-6">
                        {/* Contact Information Section */}
                        <section className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2">
                                <UserIcon className="size-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Contact Information
                                </h3>
                            </div>

                            <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-firstName`} className="text-sm font-medium">
                                        First name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`${mode}-firstName`}
                                        name="firstName"
                                        type="text"
                                        autoComplete="given-name"
                                        placeholder="First name"
                                        defaultValue={address?.firstName ?? ""}
                                        required
                                        className="h-10 md:h-11"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-lastName`} className="text-sm font-medium">
                                        Last name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`${mode}-lastName`}
                                        name="lastName"
                                        type="text"
                                        autoComplete="family-name"
                                        placeholder="Last name"
                                        defaultValue={address?.lastName ?? ""}
                                        required
                                        className="h-10 md:h-11"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-company`} className="text-sm font-medium">
                                        Company
                                    </Label>
                                    <Input
                                        id={`${mode}-company`}
                                        name="company"
                                        type="text"
                                        autoComplete="organization"
                                        placeholder="Company (optional)"
                                        defaultValue={address?.company ?? ""}
                                        className="h-10 md:h-11"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-phoneNumber`} className="text-sm font-medium">
                                        Phone
                                    </Label>
                                    <Input
                                        id={`${mode}-phoneNumber`}
                                        name="phoneNumber"
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder="+1 (555) 123-4567"
                                        defaultValue={address?.phoneNumber ?? ""}
                                        className="h-10 md:h-11"
                                    />
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Street Address Section */}
                        <section className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2">
                                <HomeIcon className="size-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Street Address
                                </h3>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor={`${mode}-address1`} className="text-sm font-medium">
                                    Address <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={`${mode}-address1`}
                                    name="address1"
                                    type="text"
                                    autoComplete="address-line1"
                                    placeholder="Street address"
                                    defaultValue={address?.address1 ?? ""}
                                    required
                                    className="h-10 md:h-11"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor={`${mode}-address2`} className="text-sm font-medium">
                                    Apt, suite, etc.
                                </Label>
                                <Input
                                    id={`${mode}-address2`}
                                    name="address2"
                                    type="text"
                                    autoComplete="address-line2"
                                    placeholder="Apartment, suite, unit (optional)"
                                    defaultValue={address?.address2 ?? ""}
                                    className="h-10 md:h-11"
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* Location Section */}
                        <section className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2">
                                <GlobeIcon className="size-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Location
                                </h3>
                            </div>

                            <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-city`} className="text-sm font-medium">
                                        City <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`${mode}-city`}
                                        name="city"
                                        type="text"
                                        autoComplete="address-level2"
                                        placeholder="City"
                                        defaultValue={address?.city ?? ""}
                                        required
                                        className="h-10 md:h-11"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-zoneCode`} className="text-sm font-medium">
                                        State / Province <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`${mode}-zoneCode`}
                                        name="zoneCode"
                                        type="text"
                                        autoComplete="address-level1"
                                        placeholder="e.g., CA, NY"
                                        defaultValue={address?.zoneCode ?? ""}
                                        required
                                        className="h-10 md:h-11"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-zip`} className="text-sm font-medium">
                                        ZIP / Postal code <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`${mode}-zip`}
                                        name="zip"
                                        type="text"
                                        autoComplete="postal-code"
                                        placeholder="Postal code"
                                        defaultValue={address?.zip ?? ""}
                                        required
                                        className="h-10 md:h-11"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`${mode}-territoryCode`} className="text-sm font-medium">
                                        Country <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`${mode}-territoryCode`}
                                        name="territoryCode"
                                        type="text"
                                        autoComplete="country"
                                        placeholder="e.g., US, CA"
                                        defaultValue={address?.territoryCode ?? ""}
                                        required
                                        maxLength={2}
                                        className="h-10 md:h-11 uppercase"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Default Address Option */}
                        <div className="flex items-center gap-3 pt-2 p-4 rounded-xl bg-muted/30">
                            <Checkbox
                                id={`${mode}-defaultAddress`}
                                name="defaultAddress"
                                value="on"
                                defaultChecked={isDefaultAddress}
                                className="size-5"
                            />
                            <Label
                                htmlFor={`${mode}-defaultAddress`}
                                className="text-sm cursor-pointer text-foreground hover:text-foreground/80 motion-interactive"
                            >
                                Set as default address
                            </Label>
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <DialogFooter className="px-5 md:px-6 py-4 md:py-5 bg-muted/30 sticky bottom-0 z-10 rounded-b-2xl sm:rounded-b-3xl">
                        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting
                                    ? isCreate
                                        ? "Creating..."
                                        : "Saving..."
                                    : isCreate
                                      ? "Create Address"
                                      : "Save Changes"}
                            </Button>
                        </div>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// ADDRESS CARD
// =============================================================================

/**
 * Individual address card with edit and delete actions.
 *
 * @param address - Address data to display
 * @param isDefault - Whether this is the default address
 * @param isOnlyAddress - Whether this is the only address (affects delete)
 * @param onEdit - Edit button click handler
 *
 * Features:
 * - Visual display of address fields
 * - Default badge indicator
 * - Edit and delete action buttons
 * - Confirmation dialog for deleting last address
 */
function AddressCard({
    address,
    isDefault,
    isOnlyAddress,
    onEdit
}: {
    address: AddressFragment;
    isDefault: boolean;
    isOnlyAddress: boolean;
    onEdit: () => void;
}) {
    const navigation = useNavigation();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const isDeleting =
        navigation.state !== "idle" &&
        navigation.formData?.get("intent") === "deleteAddress" &&
        navigation.formData?.get("addressId") === address.id;

    // Lock body scroll when delete confirmation dialog is open
    useScrollLock(isDeleteDialogOpen);

    return (
        <Card
            className={`group relative py-0 overflow-hidden rounded-2xl motion-surface shadow-[0_0_0_1px_oklch(0.94_0_0/0.3),0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_oklch(0.92_0_0/0.4),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 ${isDefault ? "bg-linear-to-br from-primary/5 via-card to-primary/3" : "bg-linear-to-br from-muted/30 via-card to-muted/15"}`}
        >
            <CardContent className="p-5 md:p-6 flex flex-col h-full">
                {/* Header with Name and Default Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                        {/* Address Icon */}
                        <div className="flex items-center justify-center size-12 md:size-14 rounded-2xl bg-muted/40 shrink-0 ring-2 ring-card shadow-sm sleek group-hover:-translate-y-0.5 group-hover:shadow-md">
                            <HomeIcon className="size-6 md:size-7 text-muted-foreground" />
                        </div>
                        {/* Name and Company */}
                        <div className="min-w-0 flex-1">
                            <p className="font-serif font-medium text-foreground text-lg md:text-xl tracking-tight">
                                {address.firstName} {address.lastName}
                            </p>
                            {address.company && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <BuildingIcon className="size-3 text-muted-foreground shrink-0" />
                                    <p className="text-sm text-muted-foreground truncate">{address.company}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Default Badge */}
                    {isDefault && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 shrink-0">Default</Badge>
                    )}
                </div>

                {/* Address Details */}
                <div className="space-y-1 text-sm text-muted-foreground flex-1 mb-4">
                    <p className="text-foreground font-medium">{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>
                        {address.city}, {address.zoneCode} {address.zip}
                    </p>
                    <p>{address.territoryCode}</p>
                    {/* Phone if exists */}
                    {address.phoneNumber && (
                        <div className="flex items-center gap-1.5 pt-1">
                            <PhoneIcon className="size-3 shrink-0" />
                            <span>{address.phoneNumber}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-3">
                    <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 gap-2 motion-interactive">
                        <PencilIcon className="size-4" />
                        Edit
                    </Button>

                    {/* Delete with confirmation for last address */}
                    <Form method="POST">
                        <input type="hidden" name="intent" value="deleteAddress" />
                        <input type="hidden" name="addressId" value={address.id} />

                        {isOnlyAddress ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isDeleting}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    {isDeleting ? (
                                        <Loader2Icon className="size-4 animate-spin" />
                                    ) : (
                                        <Trash2Icon className="size-4" />
                                    )}
                                </Button>
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <AlertDialogContent className="w-[calc(100%-1rem)] sm:w-auto rounded-2xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="font-serif text-lg md:text-xl">
                                                Cannot delete default address
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-sm md:text-base">
                                                This is your default address and cannot be deleted. To remove it, please
                                                add another address and set it as your default first.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Got it</AlertDialogCancel>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                disabled={isDeleting}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                            >
                                {isDeleting ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                    <Trash2Icon className="size-4" />
                                )}
                            </Button>
                        )}
                    </Form>
                </div>
            </CardContent>
        </Card>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
