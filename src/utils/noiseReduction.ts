/**
 * ImageVisLab - Noise Reduction Filters
 * 
 * Median filter implementation for noise removal.
 * 
 * @module noiseReduction
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Median Filter
// =============================================================================

/**
 * Applies median filter to an image.
 * Effective for removing salt-and-pepper noise while preserving edges.
 * 
 * For each pixel:
 *   1. Collect NxN neighborhood values
 *   2. Sort values
 *   3. Select the median (middle value)
 * 
 * @param imageData - Source ImageData
 * @param size - Kernel size (3, 5, or 7)
 * @returns Filtered ImageData with noise reduced
 */
export function applyMedian(imageData: ImageData, size: number = 3): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const halfSize = Math.floor(size / 2);
    const neighborhoodSize = size * size;
    const medianIndex = Math.floor(neighborhoodSize / 2);

    // Pre-allocate arrays for each channel
    const rValues: number[] = new Array(neighborhoodSize);
    const gValues: number[] = new Array(neighborhoodSize);
    const bValues: number[] = new Array(neighborhoodSize);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let count = 0;

            // Collect neighborhood values
            for (let ky = -halfSize; ky <= halfSize; ky++) {
                for (let kx = -halfSize; kx <= halfSize; kx++) {
                    const px = Math.max(0, Math.min(width - 1, x + kx));
                    const py = Math.max(0, Math.min(height - 1, y + ky));
                    const idx = (py * width + px) * 4;

                    rValues[count] = data[idx];
                    gValues[count] = data[idx + 1];
                    bValues[count] = data[idx + 2];
                    count++;
                }
            }

            // Sort and get median for each channel
            rValues.sort((a, b) => a - b);
            gValues.sort((a, b) => a - b);
            bValues.sort((a, b) => a - b);

            const outIdx = (y * width + x) * 4;
            result[outIdx] = rValues[medianIndex];
            result[outIdx + 1] = gValues[medianIndex];
            result[outIdx + 2] = bValues[medianIndex];
            result[outIdx + 3] = data[outIdx + 3];
        }
    }

    return new ImageData(result, width, height);
}
