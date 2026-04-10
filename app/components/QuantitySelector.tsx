/**
 * @fileoverview Quantity selector with increment/decrement buttons
 *
 * @description
 * Pill-shaped quantity control with plus/minus buttons. Enforces min/max constraints
 * and provides visual feedback for disabled states.
 *
 * @features
 * - Increment/decrement buttons with icons
 * - Min/max value constraints
 * - Disabled state styling when limits reached
 * - Pill/rounded-full shape matching product form design
 * - Active state feedback (bg color on press)
 * - Tabular numbers for consistent width
 * - Accessible button labels
 *
 * @props
 * - quantity: Current quantity value
 * - onQuantityChange: Callback when quantity changes
 * - min: Minimum allowed quantity (default: 1)
 * - max: Maximum allowed quantity (default: undefined/unlimited)
 * - className: Additional CSS classes
 *
 * @constraints
 * - Decrement disabled when quantity <= min
 * - Increment disabled when quantity >= max (if max is set)
 * - Visual opacity reduction for disabled buttons
 *
 * @styling
 * - Border: 2px border-primary
 * - Height: min-h-10 for consistent touch target
 * - Icons: size-5 for clear visibility
 * - Active state: bg-primary/10 on button press
 *
 * @accessibility
 * - Proper aria-label on buttons
 * - Disabled attribute when limits reached
 * - Cursor feedback (pointer vs not-allowed)
 *
 * @related
 * - ProductForm.tsx - Primary usage location
 * - ~/routes/cart.tsx - Cart line quantity updates
 */

import {useCallback} from "react";
import {Minus, Plus} from "lucide-react";
import {cn} from "~/lib/utils";

interface QuantitySelectorProps {
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    min?: number;
    max?: number;
    className?: string;
}

// =============================================================================
// QUANTITY SELECTOR
// =============================================================================

export function QuantitySelector({quantity, onQuantityChange, min = 1, max, className}: QuantitySelectorProps) {
    // Stable handlers — only change when quantity, min, max, or onQuantityChange change
    const handleDecrement = useCallback(() => {
        if (quantity > min) {
            onQuantityChange(quantity - 1);
        }
    }, [quantity, min, onQuantityChange]);

    const handleIncrement = useCallback(() => {
        if (max === undefined || quantity < max) {
            onQuantityChange(quantity + 1);
        }
    }, [quantity, max, onQuantityChange]);

    const canDecrement = quantity > min;
    const canIncrement = max === undefined || quantity < max;

    return (
        <div className={cn("flex select-none items-center justify-between rounded-full border-2 border-primary", className)}>
            <button
                type="button"
                onClick={handleDecrement}
                disabled={!canDecrement}
                className={cn(
                    "flex min-h-10 items-center justify-center px-2.5 py-1.5 text-primary rounded-l-full sleek hover:bg-primary/5 active:bg-primary/10",
                    canDecrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Decrease quantity"
            >
                <Minus className="size-5" />
            </button>
            <span className="min-w-8 px-1 text-lg font-medium text-primary text-center tabular-nums">{quantity}</span>
            <button
                type="button"
                onClick={handleIncrement}
                disabled={!canIncrement}
                className={cn(
                    "flex min-h-10 items-center justify-center px-2.5 py-1.5 text-primary rounded-r-full sleek hover:bg-primary/5 active:bg-primary/10",
                    canIncrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Increase quantity"
            >
                <Plus className="size-5" />
            </button>
        </div>
    );
}
