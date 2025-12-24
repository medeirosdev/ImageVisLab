/**
 * ImageVisLab - Custom Filter Utilities
 * 
 * Functions for applying user-defined formulas and kernels to images.
 * 
 * @module customFilters
 * @author ImageVisLab Contributors
 * @license MIT
 */

import { applyConvolution } from './convolution';

// =============================================================================
// Custom Formula Evaluator
// =============================================================================

/**
 * Context variables available in custom formulas.
 */
interface FormulaContext {
    r: number;   // Red channel value (0-255)
    g: number;   // Green channel value (0-255)
    b: number;   // Blue channel value (0-255)
    x: number;   // X position in image
    y: number;   // Y position in image
    w: number;   // Image width
    h: number;   // Image height
}

/**
 * Safely evaluates a mathematical expression with given context.
 * 
 * Supported operations: +, -, *, /, %, ^, (, )
 * Supported functions: sin, cos, tan, sqrt, abs, floor, ceil, round, min, max, log
 * Supported constants: PI, E
 * 
 * @param formula - The formula string (e.g., "255 - r", "r * 1.5")
 * @param context - Variable values for r, g, b, x, y, w, h
 * @returns Evaluated result clamped to 0-255
 */
export function evaluateFormula(formula: string, context: FormulaContext): number {
    try {
        // Create a safe evaluation function
        const safeFormula = formula
            .replace(/\^/g, '**')  // Replace ^ with ** for exponentiation
            .replace(/PI/g, String(Math.PI))
            .replace(/E/g, String(Math.E));

        // Create function with allowed variables
        const evalFunc = new Function(
            'r', 'g', 'b', 'x', 'y', 'w', 'h',
            'sin', 'cos', 'tan', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'min', 'max', 'log',
            `return (${safeFormula});`
        );

        const result = evalFunc(
            context.r, context.g, context.b, context.x, context.y, context.w, context.h,
            Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.floor, Math.ceil, Math.round, Math.min, Math.max, Math.log
        );

        // Clamp result to valid range
        return Math.max(0, Math.min(255, Math.round(result)));
    } catch {
        // Return original value if formula is invalid
        return context.r;
    }
}

/**
 * Applies a custom formula to each pixel of an image.
 * 
 * Available variables:
 * - r, g, b: Current pixel RGB values (0-255)
 * - x, y: Pixel position
 * - w, h: Image dimensions
 * 
 * @param imageData - Source ImageData
 * @param formula - Formula string (e.g., "255 - r", "(r + g + b) / 3")
 * @returns New ImageData with formula applied
 * 
 * @example
 * // Negative
 * applyCustomFormula(img, "255 - r")
 * 
 * @example
 * // Grayscale
 * applyCustomFormula(img, "(r + g + b) / 3")
 * 
 * @example
 * // Threshold
 * applyCustomFormula(img, "r > 128 ? 255 : 0")
 * 
 * @example
 * // Brighten
 * applyCustomFormula(img, "r * 1.5")
 */
export function applyCustomFormula(imageData: ImageData, formula: string): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            const context: FormulaContext = {
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2],
                x,
                y,
                w: width,
                h: height,
            };

            // Apply formula to each channel
            result[idx] = evaluateFormula(formula.replace(/r/g, 'r'), { ...context });
            result[idx + 1] = evaluateFormula(formula.replace(/r/g, 'g'), { ...context, r: context.g });
            result[idx + 2] = evaluateFormula(formula.replace(/r/g, 'b'), { ...context, r: context.b });
            result[idx + 3] = data[idx + 3]; // Keep alpha
        }
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Custom Kernel
// =============================================================================

/**
 * Generates an empty kernel of specified size.
 * 
 * @param size - Kernel size (3, 5, or 7)
 * @returns 2D array of zeros
 */
export function createEmptyKernel(size: number): number[][] {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

/**
 * Common preset kernels for quick selection.
 */
export const PRESET_KERNELS = {
    identity: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
    ],
    sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
    ],
    edgeDetect: [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1],
    ],
    emboss: [
        [-2, -1, 0],
        [-1, 1, 1],
        [0, 1, 2],
    ],
    blur: [
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
    ],
};

/**
 * Applies a custom convolution kernel to an image.
 * 
 * @param imageData - Source ImageData
 * @param kernel - 2D kernel array
 * @returns New ImageData with convolution applied
 */
export function applyCustomKernel(imageData: ImageData, kernel: number[][]): ImageData {
    return applyConvolution(imageData, kernel);
}
