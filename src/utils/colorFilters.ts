/**
 * ImageVisLab - Color Filters
 * 
 * Color manipulation filters: grayscale, sepia, and channel swapping.
 * 
 * @module colorFilters
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Grayscale
// =============================================================================

/**
 * Converts an image to grayscale using the luminance formula.
 * Formula: gray = 0.299*R + 0.587*G + 0.114*B
 * 
 * @param imageData - Source ImageData
 * @returns Grayscale ImageData
 */
export function applyGrayscale(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(
            0.299 * data[i] +
            0.587 * data[i + 1] +
            0.114 * data[i + 2]
        );

        result[i] = gray;
        result[i + 1] = gray;
        result[i + 2] = gray;
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Sepia
// =============================================================================

/**
 * Applies a sepia (vintage brownish) tone to an image.
 * 
 * Transformation matrix:
 * newR = 0.393*R + 0.769*G + 0.189*B
 * newG = 0.349*R + 0.686*G + 0.168*B
 * newB = 0.272*R + 0.534*G + 0.131*B
 * 
 * @param imageData - Source ImageData
 * @returns Sepia-toned ImageData
 */
export function applySepia(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        result[i] = Math.min(255, Math.round(0.393 * r + 0.769 * g + 0.189 * b));
        result[i + 1] = Math.min(255, Math.round(0.349 * r + 0.686 * g + 0.168 * b));
        result[i + 2] = Math.min(255, Math.round(0.272 * r + 0.534 * g + 0.131 * b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Channel Swapping
// =============================================================================

/**
 * Swaps color channels: R→G, G→B, B→R
 * Creates a psychedelic color shift effect.
 * 
 * @param imageData - Source ImageData
 * @returns ImageData with swapped channels
 */
export function applySwapChannels(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        // R → G, G → B, B → R
        result[i] = data[i + 2];     // New R = old B
        result[i + 1] = data[i];     // New G = old R
        result[i + 2] = data[i + 1]; // New B = old G
        result[i + 3] = data[i + 3]; // Keep alpha
    }

    return new ImageData(result, width, height);
}
