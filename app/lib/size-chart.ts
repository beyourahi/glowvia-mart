/**
 * @fileoverview Size Chart Types, Parser, and JSON Schema for Shopify Metafield
 *
 * @description
 * Comprehensive size chart system for clothing products with support for:
 * - Multiple garment categories (tops, bottoms, dresses, shoes, outerwear, accessories)
 * - Body measurements vs garment measurements
 * - International size conversions (US, UK, EU, Asia)
 * - Metric and imperial units with automatic conversion
 * - Fit notes and brand-specific sizing guidance
 *
 * @architecture
 * The size chart data is stored in a JSON product metafield (custom.size_chart).
 * This file provides:
 * 1. TypeScript types for type-safe consumption
 * 2. Parser with validation and fallbacks
 * 3. JSON Schema for Shopify metafield validation (copy to Shopify Admin)
 * 4. Helper functions for unit conversion and display
 *
 * @metafield
 * - Namespace: custom
 * - Key: size_chart
 * - Type: json
 * - Validation: Use SHOPIFY_SIZE_CHART_SCHEMA below
 *
 * @related
 * - app/components/SizeChartDialog.tsx - UI component for displaying size charts
 * - app/components/SizeChartButton.tsx - Trigger button for opening the dialog
 * - app/routes/products.$handle.tsx - Product page that uses size chart data
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported garment categories
 * Each category has a specific set of relevant measurements
 */
export type GarmentCategory =
    | "tops" // T-shirts, shirts, blouses, sweaters
    | "bottoms" // Pants, jeans, shorts, skirts
    | "dresses" // Dresses, jumpsuits, rompers
    | "outerwear" // Jackets, coats, blazers
    | "shoes" // Footwear of all types
    | "accessories"; // Belts, hats, gloves, etc.

/**
 * Measurement unit - supports both imperial and metric
 */
export type MeasurementUnit = "in" | "cm";

/**
 * Measurement type - body (customer's body) vs garment (product dimensions)
 *
 * Body Measurements:
 * - Used for: "Find your size" guidance
 * - Example: "If your bust is 36-38 inches, you're a Medium"
 *
 * Garment Measurements:
 * - Used for: Actual product dimensions
 * - Example: "This Medium shirt measures 21 inches across the chest"
 */
export type MeasurementType = "body" | "garment";

/**
 * International size region for conversions
 */
export type SizeRegion = "US" | "UK" | "EU" | "Asia";

/**
 * A single measurement with optional range
 * Examples:
 * - { value: 36 } → "36"
 * - { min: 36, max: 38 } → "36-38"
 */
export interface MeasurementValue {
    /** Exact value (use when min/max not needed) */
    value?: number;
    /** Minimum value for ranges */
    min?: number;
    /** Maximum value for ranges */
    max?: number;
}

/**
 * International size conversion entry
 * Maps a base size to its equivalents in other regions
 */
export interface SizeConversion {
    /** The base size label (e.g., "S", "M", "L" or "6", "8", "10") */
    size: string;
    /** US size equivalent */
    US?: string;
    /** UK size equivalent */
    UK?: string;
    /** EU size equivalent */
    EU?: string;
    /** Asia size equivalent (typically Japan/Korea) */
    Asia?: string;
}

/**
 * A row in the size chart table
 * Contains the size label and all measurements for that size
 */
export interface SizeChartRow {
    /** Size label (e.g., "XS", "S", "M", "L", "XL", "2XL" or "0", "2", "4") */
    size: string;
    /**
     * Measurements for this size
     * Keys are measurement names (e.g., "bust", "waist", "hips", "length")
     * Values are MeasurementValue objects
     */
    measurements: Record<string, MeasurementValue>;
}

/**
 * A measurement table for either body or garment measurements
 */
export interface MeasurementTable {
    /** Type of measurement: body or garment */
    type: MeasurementType;
    /** Display title (e.g., "Body Measurements", "Garment Measurements") */
    title: string;
    /**
     * Column definitions - the measurements to display
     * These become table headers
     * Example: ["bust", "waist", "hips", "length"]
     */
    columns: string[];
    /** Size rows with their measurements */
    rows: SizeChartRow[];
}

/**
 * Complete size chart data structure
 * This is the shape of data stored in the custom.size_chart metafield
 */
export interface SizeChartData {
    /** Schema version for future compatibility */
    version: "1.0";

    /** Garment category - determines which measurements are relevant */
    category: GarmentCategory;

    /** Unit of measurement for all values in this chart */
    unit: MeasurementUnit;

    /**
     * Measurement tables
     * Typically includes both body and garment measurements
     * Order determines display order in UI
     */
    tables: MeasurementTable[];

    /**
     * International size conversions (optional)
     * Used for stores selling internationally
     */
    conversions?: SizeConversion[];

    /**
     * Fit notes and guidance (optional)
     * Brand-specific sizing tips
     * Example: "This brand runs small, consider sizing up"
     */
    fitNotes?: string;

    /**
     * How to measure instructions (optional)
     * Markdown-formatted instructions for taking body measurements
     */
    howToMeasure?: string;

    /**
     * Model reference (optional)
     * Example: "Model is 5'9\" wearing size M"
     */
    modelInfo?: string;
}

/**
 * Parsed size chart ready for component consumption
 * Includes computed properties and validation status
 */
export interface ParsedSizeChart {
    /** Whether the size chart data is valid and displayable */
    isValid: boolean;
    /** The parsed size chart data (null if invalid) */
    data: SizeChartData | null;
    /** Error message if parsing failed */
    error?: string;
}

// =============================================================================
// JSON SCHEMA FOR SHOPIFY METAFIELD VALIDATION
// =============================================================================

/**
 * JSON Schema for Shopify Metafield Validation
 *
 * HOW TO USE IN SHOPIFY:
 * 1. Go to Shopify Admin → Settings → Custom data → Products
 * 2. Add a new metafield definition
 * 3. Name: "Size Chart"
 * 4. Namespace and key: custom.size_chart
 * 5. Type: JSON
 * 6. Add validation: Paste this schema
 *
 * This schema validates the structure of size chart data and ensures
 * all required fields are present with correct types.
 */
export const SHOPIFY_SIZE_CHART_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Size Chart",
    description: "Product size chart with body/garment measurements and international conversions",
    type: "object",
    required: ["version", "category", "unit", "tables"],
    additionalProperties: false,
    properties: {
        version: {
            type: "string",
            enum: ["1.0"],
            description: "Schema version for future compatibility"
        },
        category: {
            type: "string",
            enum: ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"],
            description: "Garment category - determines relevant measurements"
        },
        unit: {
            type: "string",
            enum: ["in", "cm"],
            description: "Unit of measurement for all values"
        },
        tables: {
            type: "array",
            minItems: 1,
            description: "Measurement tables (body and/or garment)",
            items: {
                type: "object",
                required: ["type", "title", "columns", "rows"],
                additionalProperties: false,
                properties: {
                    type: {
                        type: "string",
                        enum: ["body", "garment"],
                        description: "body = customer measurements, garment = product dimensions"
                    },
                    title: {
                        type: "string",
                        minLength: 1,
                        maxLength: 100,
                        description: "Display title for this table"
                    },
                    columns: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "string",
                            minLength: 1,
                            maxLength: 50
                        },
                        description: "Measurement column names (e.g., bust, waist, hips)"
                    },
                    rows: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "object",
                            required: ["size", "measurements"],
                            additionalProperties: false,
                            properties: {
                                size: {
                                    type: "string",
                                    minLength: 1,
                                    maxLength: 20,
                                    description: "Size label (e.g., S, M, L or 6, 8, 10)"
                                },
                                measurements: {
                                    type: "object",
                                    additionalProperties: {
                                        type: "object",
                                        additionalProperties: false,
                                        properties: {
                                            value: {
                                                type: "number",
                                                minimum: 0,
                                                description: "Exact measurement value"
                                            },
                                            min: {
                                                type: "number",
                                                minimum: 0,
                                                description: "Minimum value for ranges"
                                            },
                                            max: {
                                                type: "number",
                                                minimum: 0,
                                                description: "Maximum value for ranges"
                                            }
                                        }
                                    },
                                    description: "Measurements keyed by column name"
                                }
                            }
                        },
                        description: "Size rows with their measurements"
                    }
                }
            }
        },
        conversions: {
            type: "array",
            description: "International size conversions",
            items: {
                type: "object",
                required: ["size"],
                additionalProperties: false,
                properties: {
                    size: {
                        type: "string",
                        minLength: 1,
                        maxLength: 20,
                        description: "Base size label"
                    },
                    US: {
                        type: "string",
                        maxLength: 20,
                        description: "US size equivalent"
                    },
                    UK: {
                        type: "string",
                        maxLength: 20,
                        description: "UK size equivalent"
                    },
                    EU: {
                        type: "string",
                        maxLength: 20,
                        description: "EU size equivalent"
                    },
                    Asia: {
                        type: "string",
                        maxLength: 20,
                        description: "Asia (Japan/Korea) size equivalent"
                    }
                }
            }
        },
        fitNotes: {
            type: "string",
            maxLength: 500,
            description: "Brand-specific fit guidance"
        },
        howToMeasure: {
            type: "string",
            maxLength: 2000,
            description: "Instructions for taking body measurements (supports markdown)"
        },
        modelInfo: {
            type: "string",
            maxLength: 200,
            description: "Model reference (e.g., Model is 5'9\" wearing size M)"
        }
    }
} as const;

// =============================================================================
// PARSER
// =============================================================================

/**
 * Parse size chart data from metafield JSON value
 *
 * @param jsonValue - Raw JSON string from metafield
 * @returns Parsed size chart with validation status
 *
 * Handles:
 * - Null/undefined input
 * - Invalid JSON
 * - Missing required fields
 * - Type validation
 * - Graceful fallbacks
 *
 * @example
 * ```typescript
 * const { isValid, data, error } = parseSizeChart(product.sizeChart?.value);
 * if (isValid && data) {
 *   // Render size chart
 * }
 * ```
 */
export function parseSizeChart(jsonValue: string | null | undefined): ParsedSizeChart {
    // Handle null/undefined
    if (!jsonValue) {
        return {isValid: false, data: null};
    }

    try {
        const parsed = JSON.parse(jsonValue) as unknown;

        // Type guard for basic structure
        if (!isValidSizeChartStructure(parsed)) {
            return {
                isValid: false,
                data: null,
                error: "Invalid size chart structure"
            };
        }

        // Additional validation
        if (!validateSizeChartData(parsed)) {
            return {
                isValid: false,
                data: null,
                error: "Size chart validation failed"
            };
        }

        return {
            isValid: true,
            data: parsed
        };
    } catch (e) {
        return {
            isValid: false,
            data: null,
            error: e instanceof Error ? e.message : "Failed to parse size chart JSON"
        };
    }
}

/**
 * Type guard for basic size chart structure
 */
function isValidSizeChartStructure(data: unknown): data is SizeChartData {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as Record<string, unknown>;

    // Check required fields exist
    if (typeof obj.version !== "string") return false;
    if (typeof obj.category !== "string") return false;
    if (typeof obj.unit !== "string") return false;
    if (!Array.isArray(obj.tables)) return false;

    // Validate category
    const validCategories: GarmentCategory[] = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"];
    if (!validCategories.includes(obj.category as GarmentCategory)) return false;

    // Validate unit
    const validUnits: MeasurementUnit[] = ["in", "cm"];
    if (!validUnits.includes(obj.unit as MeasurementUnit)) return false;

    // Validate tables array has at least one item
    if (obj.tables.length === 0) return false;

    return true;
}

/**
 * Deep validation of size chart data
 */
function validateSizeChartData(data: SizeChartData): boolean {
    // Validate each table
    for (const table of data.tables) {
        // Check table type
        if (table.type !== "body" && table.type !== "garment") return false;

        // Check title
        if (!table.title || typeof table.title !== "string") return false;

        // Check columns
        if (!Array.isArray(table.columns) || table.columns.length === 0) return false;

        // Check rows
        if (!Array.isArray(table.rows) || table.rows.length === 0) return false;

        // Validate each row
        for (const row of table.rows) {
            if (!row.size || typeof row.size !== "string") return false;
            if (!row.measurements || typeof row.measurements !== "object") return false;
        }
    }

    // Validate conversions if present
    if (data.conversions) {
        if (!Array.isArray(data.conversions)) return false;
        for (const conv of data.conversions) {
            if (!conv.size || typeof conv.size !== "string") return false;
        }
    }

    return true;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert measurement value to the target unit
 *
 * @param value - Measurement value to convert
 * @param fromUnit - Current unit
 * @param toUnit - Target unit
 * @returns Converted value rounded to 1 decimal place
 */
export function convertUnit(value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
    if (fromUnit === toUnit) return value;

    if (fromUnit === "in" && toUnit === "cm") {
        return Math.round(value * 2.54 * 10) / 10;
    }

    if (fromUnit === "cm" && toUnit === "in") {
        return Math.round((value / 2.54) * 10) / 10;
    }

    return value;
}

/**
 * Format a measurement value for display
 *
 * @param measurement - Measurement value object
 * @param unit - Unit to display
 * @returns Formatted string (e.g., "36", "36-38", "36 in")
 */
export function formatMeasurement(
    measurement: MeasurementValue | undefined,
    unit: MeasurementUnit,
    showUnit: boolean = false
): string {
    if (!measurement) return "-";

    const unitSuffix = showUnit ? ` ${unit}` : "";

    // Exact value
    if (measurement.value !== undefined) {
        return `${measurement.value}${unitSuffix}`;
    }

    // Range
    if (measurement.min !== undefined && measurement.max !== undefined) {
        return `${measurement.min}-${measurement.max}${unitSuffix}`;
    }

    // Only min
    if (measurement.min !== undefined) {
        return `${measurement.min}+${unitSuffix}`;
    }

    // Only max
    if (measurement.max !== undefined) {
        return `< ${measurement.max}${unitSuffix}`;
    }

    return "-";
}

/**
 * Get human-readable column name
 * Capitalizes and formats measurement column keys
 *
 * @param columnKey - Raw column key (e.g., "bust", "hip_width")
 * @returns Formatted column name (e.g., "Bust", "Hip Width")
 */
export function formatColumnName(columnKey: string): string {
    return columnKey
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

/**
 * Get the default unit label for display
 */
export function getUnitLabel(unit: MeasurementUnit): string {
    return unit === "in" ? "inches" : "centimeters";
}

/**
 * Check if a product has a valid size chart
 *
 * @param sizeChartValue - Raw metafield value
 * @returns True if the product has displayable size chart data
 */
export function hasSizeChart(sizeChartValue: string | null | undefined): boolean {
    if (!sizeChartValue) return false;
    const {isValid} = parseSizeChart(sizeChartValue);
    return isValid;
}

// =============================================================================
// EXAMPLE SIZE CHART DATA (for reference/testing)
// =============================================================================

/**
 * Example size chart for a women's top
 * Use this as a reference when creating size charts in Shopify
 */
export const EXAMPLE_SIZE_CHART: SizeChartData = {
    version: "1.0",
    category: "tops",
    unit: "in",
    tables: [
        {
            type: "body",
            title: "Body Measurements",
            columns: ["bust", "waist", "hips"],
            rows: [
                {
                    size: "XS",
                    measurements: {
                        bust: {min: 31, max: 32},
                        waist: {min: 24, max: 25},
                        hips: {min: 34, max: 35}
                    }
                },
                {
                    size: "S",
                    measurements: {
                        bust: {min: 33, max: 34},
                        waist: {min: 26, max: 27},
                        hips: {min: 36, max: 37}
                    }
                },
                {
                    size: "M",
                    measurements: {
                        bust: {min: 35, max: 36},
                        waist: {min: 28, max: 29},
                        hips: {min: 38, max: 39}
                    }
                },
                {
                    size: "L",
                    measurements: {
                        bust: {min: 37, max: 39},
                        waist: {min: 30, max: 32},
                        hips: {min: 40, max: 42}
                    }
                },
                {
                    size: "XL",
                    measurements: {
                        bust: {min: 40, max: 42},
                        waist: {min: 33, max: 35},
                        hips: {min: 43, max: 45}
                    }
                }
            ]
        },
        {
            type: "garment",
            title: "Garment Measurements",
            columns: ["chest_width", "length", "sleeve"],
            rows: [
                {
                    size: "XS",
                    measurements: {
                        chest_width: {value: 17},
                        length: {value: 24},
                        sleeve: {value: 23}
                    }
                },
                {
                    size: "S",
                    measurements: {
                        chest_width: {value: 18},
                        length: {value: 25},
                        sleeve: {value: 24}
                    }
                },
                {
                    size: "M",
                    measurements: {
                        chest_width: {value: 19},
                        length: {value: 26},
                        sleeve: {value: 25}
                    }
                },
                {
                    size: "L",
                    measurements: {
                        chest_width: {value: 21},
                        length: {value: 27},
                        sleeve: {value: 26}
                    }
                },
                {
                    size: "XL",
                    measurements: {
                        chest_width: {value: 23},
                        length: {value: 28},
                        sleeve: {value: 27}
                    }
                }
            ]
        }
    ],
    conversions: [
        {size: "XS", US: "0-2", UK: "4-6", EU: "32-34", Asia: "S"},
        {size: "S", US: "4-6", UK: "8-10", EU: "36-38", Asia: "M"},
        {size: "M", US: "8-10", UK: "12-14", EU: "40-42", Asia: "L"},
        {size: "L", US: "12-14", UK: "16-18", EU: "44-46", Asia: "XL"},
        {size: "XL", US: "16-18", UK: "20-22", EU: "48-50", Asia: "XXL"}
    ],
    fitNotes: "This style has a relaxed fit. If you prefer a more fitted look, consider sizing down.",
    howToMeasure:
        "**Bust:** Measure around the fullest part of your bust.\n\n**Waist:** Measure around your natural waistline.\n\n**Hips:** Measure around the fullest part of your hips.",
    modelInfo: "Model is 5'9\" (175cm) wearing size S"
};
