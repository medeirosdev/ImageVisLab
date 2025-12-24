/**
 * ImageVisLab - Morphology Operations
 * 
 * Binary morphological operations for image processing.
 * Includes binarization, erosion, dilation, opening, and closing.
 * 
 * @module morphology
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Binarization (Thresholding)
// =============================================================================

/**
 * Applies binary thresholding to an image.
 * Converts grayscale image to binary (black and white).
 * 
 * @param imageData - Source ImageData
 * @param threshold - Threshold value (0-255)
 * @returns Binary ImageData (0 or 255 only)
 */
export function applyThreshold(imageData: ImageData, threshold: number): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Apply threshold
        const binary = gray >= threshold ? 255 : 0;

        result[i] = binary;
        result[i + 1] = binary;
        result[i + 2] = binary;
        result[i + 3] = data[i + 3]; // Keep alpha
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Structuring Element
// =============================================================================

/**
 * 3x3 cross structuring element (4-connected).
 */
const CROSS_ELEMENT = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
];

/**
 * 3x3 square structuring element (8-connected).
 */
const SQUARE_ELEMENT = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
];

// =============================================================================
// Erosion
// =============================================================================

/**
 * Applies morphological erosion to a binary image.
 * Shrinks white regions and expands black regions.
 * 
 * @param imageData - Binary ImageData (assumed already thresholded)
 * @returns Eroded ImageData
 */
export function applyErosion(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const se = SQUARE_ELEMENT;
    const seSize = 3;
    const seCenter = 1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let minVal = 255;

            // Check all pixels under structuring element
            for (let sy = 0; sy < seSize; sy++) {
                for (let sx = 0; sx < seSize; sx++) {
                    if (se[sy][sx] === 0) continue;

                    const px = x + sx - seCenter;
                    const py = y + sy - seCenter;

                    // Border handling: treat as black (0)
                    if (px < 0 || px >= width || py < 0 || py >= height) {
                        minVal = 0;
                    } else {
                        const idx = (py * width + px) * 4;
                        minVal = Math.min(minVal, data[idx]);
                    }
                }
            }

            const outIdx = (y * width + x) * 4;
            result[outIdx] = minVal;
            result[outIdx + 1] = minVal;
            result[outIdx + 2] = minVal;
            result[outIdx + 3] = data[outIdx + 3];
        }
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Dilation
// =============================================================================

/**
 * Applies morphological dilation to a binary image.
 * Expands white regions and shrinks black regions.
 * 
 * @param imageData - Binary ImageData
 * @returns Dilated ImageData
 */
export function applyDilation(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const se = SQUARE_ELEMENT;
    const seSize = 3;
    const seCenter = 1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let maxVal = 0;

            // Check all pixels under structuring element
            for (let sy = 0; sy < seSize; sy++) {
                for (let sx = 0; sx < seSize; sx++) {
                    if (se[sy][sx] === 0) continue;

                    const px = x + sx - seCenter;
                    const py = y + sy - seCenter;

                    // Border handling: treat as black (0)
                    if (px >= 0 && px < width && py >= 0 && py < height) {
                        const idx = (py * width + px) * 4;
                        maxVal = Math.max(maxVal, data[idx]);
                    }
                }
            }

            const outIdx = (y * width + x) * 4;
            result[outIdx] = maxVal;
            result[outIdx + 1] = maxVal;
            result[outIdx + 2] = maxVal;
            result[outIdx + 3] = data[outIdx + 3];
        }
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Opening (Erosion followed by Dilation)
// =============================================================================

/**
 * Applies morphological opening to a binary image.
 * Opening = Erosion followed by Dilation.
 * Removes small white noise and smooths object boundaries.
 * 
 * @param imageData - Binary ImageData
 * @returns Opened ImageData
 */
export function applyOpening(imageData: ImageData): ImageData {
    const eroded = applyErosion(imageData);
    return applyDilation(eroded);
}

// =============================================================================
// Closing (Dilation followed by Erosion)
// =============================================================================

/**
 * Applies morphological closing to a binary image.
 * Closing = Dilation followed by Erosion.
 * Fills small black holes and connects nearby objects.
 * 
 * @param imageData - Binary ImageData
 * @returns Closed ImageData
 */
export function applyClosing(imageData: ImageData): ImageData {
    const dilated = applyDilation(imageData);
    return applyErosion(dilated);
}
