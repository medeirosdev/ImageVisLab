/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * A visual educational tool for understanding image processing algorithms.
 * This module contains all point-to-point transformation filters.
 * 
 * @module imageFilters
 * @author ImageVisLab Contributors
 * @license MIT
 */

import type { DistanceMetric, NeighborType } from '../types';

// =============================================================================
// Point Operations (Pixel-wise Transformations)
// =============================================================================

/**
 * Applies the Negative filter to an image.
 * Formula: s = L - 1 - r (where L = 256 for 8-bit images)
 * 
 * This inverts all intensity values, making dark pixels bright and vice versa.
 * 
 * @param imageData - The source ImageData object
 * @returns A new ImageData object with inverted intensities
 */
export function applyNegative(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const L = 256; // Intensity levels for 8-bit images

    for (let i = 0; i < data.length; i += 4) {
        data[i] = L - 1 - data[i];         // Red channel
        data[i + 1] = L - 1 - data[i + 1]; // Green channel
        data[i + 2] = L - 1 - data[i + 2]; // Blue channel
        // Alpha channel (data[i + 3]) remains unchanged
    }

    return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Applies the Power-Law (Gamma) Transformation.
 * Formula: s = c * r^gamma
 * 
 * - gamma < 1: Brightens image (expands dark tones)
 * - gamma > 1: Darkens image (compresses dark tones)
 * 
 * Uses a lookup table for optimization (O(256) instead of O(width * height)).
 * 
 * @param imageData - The source ImageData object
 * @param gamma - The gamma exponent value
 * @param c - The scaling constant (default: 1)
 * @returns A new ImageData object with gamma correction applied
 */
export function applyGamma(
    imageData: ImageData,
    gamma: number,
    c: number = 1
): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    // Pre-compute lookup table for optimization
    const lookupTable = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
        // Normalize to [0,1], apply gamma, scale back to [0,255]
        const normalized = i / 255;
        const transformed = c * Math.pow(normalized, gamma);
        lookupTable[i] = Math.round(Math.min(255, Math.max(0, transformed * 255)));
    }

    for (let i = 0; i < data.length; i += 4) {
        data[i] = lookupTable[data[i]];         // Red
        data[i + 1] = lookupTable[data[i + 1]]; // Green
        data[i + 2] = lookupTable[data[i + 2]]; // Blue
    }

    return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Applies the Logarithmic Transformation.
 * Formula: s = c * log(1 + r)
 * 
 * This expands dark pixel values while compressing bright ones,
 * useful for displaying images with large dynamic range.
 * 
 * @param imageData - The source ImageData object
 * @param c - The scaling constant (default: 1)
 * @returns A new ImageData object with log transformation applied
 */
export function applyLog(imageData: ImageData, c: number = 1): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    // Scale factor to map log(256) back to 255
    const scale = 255 / Math.log(256);

    // Pre-compute lookup table
    const lookupTable = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
        const transformed = c * scale * Math.log(1 + i);
        lookupTable[i] = Math.round(Math.min(255, Math.max(0, transformed)));
    }

    for (let i = 0; i < data.length; i += 4) {
        data[i] = lookupTable[data[i]];
        data[i + 1] = lookupTable[data[i + 1]];
        data[i + 2] = lookupTable[data[i + 2]];
    }

    return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Applies Quantization (reduces intensity levels).
 * Simulates reduced bit depth (e.g., 8-bit to 4-bit).
 * 
 * This creates the "false contour" effect visible when using few gray levels.
 * 
 * @param imageData - The source ImageData object
 * @param levels - Number of intensity levels (2 to 256)
 * @returns A new ImageData object with quantized intensities
 */
export function applyQuantization(
    imageData: ImageData,
    levels: number
): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    // Clamp levels between 2 and 256
    levels = Math.max(2, Math.min(256, levels));

    // Quantization step size
    const step = 255 / (levels - 1);

    // Pre-compute lookup table
    const lookupTable = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
        const quantized = Math.round(i / step) * step;
        lookupTable[i] = Math.round(Math.min(255, Math.max(0, quantized)));
    }

    for (let i = 0; i < data.length; i += 4) {
        data[i] = lookupTable[data[i]];
        data[i + 1] = lookupTable[data[i + 1]];
        data[i + 2] = lookupTable[data[i + 2]];
    }

    return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Applies Subsampling (reduces spatial resolution).
 * Creates a pixelation effect by averaging blocks of pixels.
 * 
 * This simulates the effect of reducing image resolution (spatial sampling).
 * 
 * @param imageData - The source ImageData object
 * @param factor - Block size for subsampling (1 to 32)
 * @returns A new ImageData object with reduced spatial resolution
 */
export function applySampling(
    imageData: ImageData,
    factor: number
): ImageData {
    const { width, height, data: srcData } = imageData;
    const data = new Uint8ClampedArray(srcData);

    factor = Math.max(1, Math.min(32, Math.round(factor)));

    for (let y = 0; y < height; y += factor) {
        for (let x = 0; x < width; x += factor) {
            // Get color from top-left pixel of the block
            const idx = (y * width + x) * 4;
            const r = srcData[idx];
            const g = srcData[idx + 1];
            const b = srcData[idx + 2];

            // Apply this color to the entire block
            for (let dy = 0; dy < factor && y + dy < height; dy++) {
                for (let dx = 0; dx < factor && x + dx < width; dx++) {
                    const blockIdx = ((y + dy) * width + (x + dx)) * 4;
                    data[blockIdx] = r;
                    data[blockIdx + 1] = g;
                    data[blockIdx + 2] = b;
                }
            }
        }
    }

    return new ImageData(data, width, height);
}

// =============================================================================
// Histogram Operations
// =============================================================================

/**
 * Calculates the histogram of an image.
 * Returns frequency distribution for R, G, B channels and grayscale.
 * 
 * @param imageData - The source ImageData object
 * @returns Object containing histogram arrays for each channel
 */
export function calculateHistogram(imageData: ImageData) {
    const data = imageData.data;

    const histogram = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0),
        gray: new Array(256).fill(0),
    };

    for (let i = 0; i < data.length; i += 4) {
        histogram.r[data[i]]++;
        histogram.g[data[i + 1]]++;
        histogram.b[data[i + 2]]++;

        // Luminance formula for grayscale conversion
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        histogram.gray[gray]++;
    }

    return histogram;
}

/**
 * Applies Histogram Equalization.
 * Formula: s_k = (L-1) * sum(p_r(r_j)) for j=0 to k
 * 
 * This enhances contrast by spreading out the most frequent intensity values,
 * effectively "flattening" the histogram.
 * 
 * @param imageData - The source ImageData object
 * @returns A new ImageData object with equalized histogram
 */
export function applyEqualization(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const totalPixels = imageData.width * imageData.height;
    const L = 256;

    // Calculate histogram for each channel
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
        histR[data[i]]++;
        histG[data[i + 1]]++;
        histB[data[i + 2]]++;
    }

    // Create CDF-based lookup tables
    const createLUT = (hist: number[]): Uint8ClampedArray => {
        const lut = new Uint8ClampedArray(256);
        let cumulative = 0;

        for (let i = 0; i < 256; i++) {
            cumulative += hist[i];
            lut[i] = Math.round((cumulative / totalPixels) * (L - 1));
        }

        return lut;
    };

    const lutR = createLUT(histR);
    const lutG = createLUT(histG);
    const lutB = createLUT(histB);

    // Apply transformation
    for (let i = 0; i < data.length; i += 4) {
        data[i] = lutR[data[i]];
        data[i + 1] = lutG[data[i + 1]];
        data[i + 2] = lutB[data[i + 2]];
    }

    return new ImageData(data, imageData.width, imageData.height);
}

// =============================================================================
// Pixel Inspection Utilities
// =============================================================================

/**
 * Gets detailed information about a specific pixel.
 * 
 * @param imageData - The source ImageData object
 * @param x - X coordinate of the pixel
 * @param y - Y coordinate of the pixel
 * @returns Pixel information object or null if coordinates are out of bounds
 */
export function getPixelInfo(
    imageData: ImageData,
    x: number,
    y: number
) {
    const { width, height, data } = imageData;

    if (x < 0 || x >= width || y < 0 || y >= height) {
        return null;
    }

    const idx = (y * width + x) * 4;

    return {
        x,
        y,
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
        gray: Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]),
        hex: `#${data[idx].toString(16).padStart(2, '0')}${data[idx + 1].toString(16).padStart(2, '0')}${data[idx + 2].toString(16).padStart(2, '0')}`,
    };
}

/**
 * Extracts a neighborhood of pixels around a center point.
 * Used for the magnifier/inspector feature.
 * 
 * @param imageData - The source ImageData object
 * @param centerX - X coordinate of the center pixel
 * @param centerY - Y coordinate of the center pixel
 * @param radius - Radius of the neighborhood (default: 5, creates 11x11 grid)
 * @returns Array of pixel data with relative coordinates
 */
export function getNeighborhood(
    imageData: ImageData,
    centerX: number,
    centerY: number,
    radius: number = 5
) {
    const { width, height, data } = imageData;
    const neighborhood: Array<{ x: number; y: number; r: number; g: number; b: number }> = [];

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = centerX + dx;
            const y = centerY + dy;

            if (x >= 0 && x < width && y >= 0 && y < height) {
                const idx = (y * width + x) * 4;
                neighborhood.push({
                    x: dx,
                    y: dy,
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2],
                });
            }
        }
    }

    return neighborhood;
}

// =============================================================================
// Distance Metrics
// =============================================================================


/**
 * Calculates the distance between two points using the specified metric.
 * 
 * - Euclidean: sqrt((x1-x2)² + (y1-y2)²)
 * - City-block (D4): |x1-x2| + |y1-y2|
 * - Chessboard (D8): max(|x1-x2|, |y1-y2|)
 * 
 * @param x1 - X coordinate of first point
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
 * @param metric - Distance metric to use
 * @returns The calculated distance
 */
export function calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    metric: DistanceMetric
): number {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);

    switch (metric) {
        case 'euclidean':
            return Math.sqrt(dx * dx + dy * dy);
        case 'cityBlock':
            return dx + dy;
        case 'chessboard':
            return Math.max(dx, dy);
        default:
            return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * Checks if a relative position is part of a specific neighborhood type.
 * 
 * - N4: 4-connected (up, down, left, right)
 * - ND: Diagonal neighbors only
 * - N8: 8-connected (all 8 surrounding pixels)
 * 
 * @param dx - Relative X offset from center (-1, 0, or 1)
 * @param dy - Relative Y offset from center (-1, 0, or 1)
 * @param neighborType - Type of neighborhood to check
 * @returns True if the position is part of the neighborhood
 */
export function isInNeighborhood(
    dx: number,
    dy: number,
    neighborType: NeighborType
): boolean {
    // Center pixel is not part of neighborhood
    if (dx === 0 && dy === 0) return false;

    // Only consider immediate neighbors (distance 1)
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false;

    switch (neighborType) {
        case 'N4':
            // 4-connected: only horizontal and vertical
            return (dx === 0 || dy === 0);
        case 'ND':
            // Diagonal only
            return (dx !== 0 && dy !== 0);
        case 'N8':
            // 8-connected: all surrounding
            return true;
        default:
            return false;
    }
}

/**
 * Gets all valid neighbor positions for a given neighborhood type.
 * 
 * @param neighborType - Type of neighborhood
 * @returns Array of {dx, dy} offsets
 */
export function getNeighborOffsets(neighborType: NeighborType): Array<{ dx: number; dy: number }> {
    const offsets: Array<{ dx: number; dy: number }> = [];

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (isInNeighborhood(dx, dy, neighborType)) {
                offsets.push({ dx, dy });
            }
        }
    }

    return offsets;
}

