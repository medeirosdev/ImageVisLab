/**
 * ImageVisLab - Edge Detection Filters
 * 
 * Sobel operator implementation for edge detection.
 * 
 * @module edgeDetection
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Sobel Kernels
// =============================================================================

/**
 * Sobel kernel for horizontal edges (detects vertical edges).
 */
const SOBEL_X = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
];

/**
 * Sobel kernel for vertical edges (detects horizontal edges).
 */
const SOBEL_Y = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts RGB to grayscale using luminance formula.
 */
function toGray(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Applies a 3x3 convolution at a specific pixel position.
 */
function convolve3x3(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    kernel: number[][]
): number {
    let sum = 0;

    for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx - 1));
            const py = Math.max(0, Math.min(height - 1, y + ky - 1));
            const idx = (py * width + px) * 4;

            const gray = toGray(data[idx], data[idx + 1], data[idx + 2]);
            sum += gray * kernel[ky][kx];
        }
    }

    return sum;
}

// =============================================================================
// Sobel Filter Functions
// =============================================================================

/**
 * Applies Sobel X filter (detects vertical edges).
 * 
 * @param imageData - Source ImageData
 * @returns Edge-detected ImageData showing vertical edges
 */
export function applySobelX(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const gx = convolve3x3(data, width, height, x, y, SOBEL_X);
            const value = Math.min(255, Math.abs(gx));

            const idx = (y * width + x) * 4;
            result[idx] = value;
            result[idx + 1] = value;
            result[idx + 2] = value;
            result[idx + 3] = data[idx + 3];
        }
    }

    return new ImageData(result, width, height);
}

/**
 * Applies Sobel Y filter (detects horizontal edges).
 * 
 * @param imageData - Source ImageData
 * @returns Edge-detected ImageData showing horizontal edges
 */
export function applySobelY(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const gy = convolve3x3(data, width, height, x, y, SOBEL_Y);
            const value = Math.min(255, Math.abs(gy));

            const idx = (y * width + x) * 4;
            result[idx] = value;
            result[idx + 1] = value;
            result[idx + 2] = value;
            result[idx + 3] = data[idx + 3];
        }
    }

    return new ImageData(result, width, height);
}

/**
 * Applies Sobel Magnitude filter (combines X and Y gradients).
 * Formula: magnitude = sqrt(Gx² + Gy²)
 * 
 * @param imageData - Source ImageData
 * @returns Edge-detected ImageData with full edge magnitude
 */
export function applySobelMagnitude(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const gx = convolve3x3(data, width, height, x, y, SOBEL_X);
            const gy = convolve3x3(data, width, height, x, y, SOBEL_Y);

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            const value = Math.min(255, magnitude);

            const idx = (y * width + x) * 4;
            result[idx] = value;
            result[idx + 1] = value;
            result[idx + 2] = value;
            result[idx + 3] = data[idx + 3];
        }
    }

    return new ImageData(result, width, height);
}
