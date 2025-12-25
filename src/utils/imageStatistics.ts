/**
 * ImageVisLab - Image Statistics Utilities
 * 
 * Functions to calculate statistical measures of image data including
 * mean, variance, standard deviation, and entropy.
 * 
 * @module imageStatistics
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Types
// =============================================================================

export interface ImageStatistics {
    /** Mean intensity value (0-255) */
    mean: number;
    /** Variance of intensity values */
    variance: number;
    /** Standard deviation of intensity values */
    stdDev: number;
    /** Entropy in bits (0-8 for 8-bit images) */
    entropy: number;
    /** Minimum intensity value */
    min: number;
    /** Maximum intensity value */
    max: number;
    /** Total number of pixels */
    pixelCount: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts RGB to grayscale using luminosity method.
 * Uses ITU-R BT.601 standard weights.
 * 
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns Grayscale value (0-255)
 */
function rgbToGrayscale(r: number, g: number, b: number): number {
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Calculates comprehensive statistics for an image.
 * 
 * Computes:
 * - **Mean (μ)**: Average intensity value
 * - **Variance (σ²)**: Measure of intensity spread
 * - **Standard Deviation (σ)**: Square root of variance
 * - **Entropy (H)**: Information content in bits
 * - **Min/Max**: Intensity range
 * 
 * Entropy formula: H = -Σ p(i) * log₂(p(i))
 * Where p(i) is the probability of intensity level i
 * 
 * @param imageData - The image data to analyze
 * @returns Object containing all statistics
 */
export function calculateImageStatistics(imageData: ImageData): ImageStatistics {
    const { data, width, height } = imageData;
    const pixelCount = width * height;

    // Initialize histogram for entropy calculation (256 levels for 8-bit)
    const histogram = new Uint32Array(256);

    // First pass: calculate histogram, sum, min, max
    let sum = 0;
    let min = 255;
    let max = 0;

    for (let i = 0; i < data.length; i += 4) {
        const gray = rgbToGrayscale(data[i], data[i + 1], data[i + 2]);

        histogram[gray]++;
        sum += gray;

        if (gray < min) min = gray;
        if (gray > max) max = gray;
    }

    // Calculate mean
    const mean = sum / pixelCount;

    // Second pass: calculate variance
    let varianceSum = 0;
    for (let i = 0; i < data.length; i += 4) {
        const gray = rgbToGrayscale(data[i], data[i + 1], data[i + 2]);
        const diff = gray - mean;
        varianceSum += diff * diff;
    }
    const variance = varianceSum / pixelCount;
    const stdDev = Math.sqrt(variance);

    // Calculate entropy from histogram
    // H = -Σ p(i) * log₂(p(i)) for all i where p(i) > 0
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (histogram[i] > 0) {
            const probability = histogram[i] / pixelCount;
            entropy -= probability * Math.log2(probability);
        }
    }

    return {
        mean: Math.round(mean * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        entropy: Math.round(entropy * 100) / 100,
        min,
        max,
        pixelCount,
    };
}

/**
 * Formats pixel count in a human-readable way.
 * Examples: 1000 -> "1K", 1500000 -> "1.5M"
 * 
 * @param count - Number of pixels
 * @returns Formatted string
 */
export function formatPixelCount(count: number): string {
    if (count >= 1_000_000) {
        return `${(count / 1_000_000).toFixed(1)}M`;
    }
    if (count >= 1_000) {
        return `${(count / 1_000).toFixed(0)}K`;
    }
    return count.toString();
}
