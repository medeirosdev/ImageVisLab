/**
 * ImageVisLab - Convolution Engine
 * 
 * Generic convolution implementation and pre-defined kernels
 * for spatial filtering operations.
 * 
 * @module convolution
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Pre-defined Kernels
// =============================================================================

/**
 * Collection of commonly used convolution kernels.
 * Only includes kernels that are actively used by the application.
 */
export const KERNELS = {
    /** Sharpening kernel */
    sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
    ],

    /** Laplacian (edge detection) */
    laplacian: [
        [0, 1, 0],
        [1, -4, 1],
        [0, 1, 0],
    ],
};


// =============================================================================
// Kernel Generation
// =============================================================================

/**
 * Generates a Gaussian kernel of specified size and sigma.
 * 
 * @param size - Kernel size (must be odd: 3, 5, 7, etc.)
 * @param sigma - Standard deviation of the Gaussian
 * @returns 2D kernel array
 */
export function generateGaussianKernel(size: number, sigma: number): number[][] {
    const kernel: number[][] = [];
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let y = 0; y < size; y++) {
        kernel[y] = [];
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
            kernel[y][x] = value;
            sum += value;
        }
    }

    // Normalize
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            kernel[y][x] /= sum;
        }
    }

    return kernel;
}

/**
 * Generates a box blur kernel of specified size.
 * 
 * @param size - Kernel size (must be odd)
 * @returns 2D kernel array with uniform weights
 */
export function generateBoxKernel(size: number): number[][] {
    const weight = 1 / (size * size);
    const kernel: number[][] = [];

    for (let y = 0; y < size; y++) {
        kernel[y] = [];
        for (let x = 0; x < size; x++) {
            kernel[y][x] = weight;
        }
    }

    return kernel;
}

// =============================================================================
// Convolution Engine
// =============================================================================

/**
 * Applies a convolution kernel to an image.
 * Uses zero-padding at borders.
 * 
 * @param imageData - Source ImageData
 * @param kernel - 2D convolution kernel
 * @returns New ImageData with convolution applied
 */
export function applyConvolution(
    imageData: ImageData,
    kernel: number[][]
): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    const kSize = kernel.length;
    const kCenter = Math.floor(kSize / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sumR = 0, sumG = 0, sumB = 0;

            // Apply kernel
            for (let ky = 0; ky < kSize; ky++) {
                for (let kx = 0; kx < kSize; kx++) {
                    const px = x + kx - kCenter;
                    const py = y + ky - kCenter;

                    // Border handling: clamp to edge
                    const clampedX = Math.max(0, Math.min(width - 1, px));
                    const clampedY = Math.max(0, Math.min(height - 1, py));

                    const idx = (clampedY * width + clampedX) * 4;
                    const weight = kernel[ky][kx];

                    sumR += data[idx] * weight;
                    sumG += data[idx + 1] * weight;
                    sumB += data[idx + 2] * weight;
                }
            }

            const outIdx = (y * width + x) * 4;
            result[outIdx] = Math.round(sumR);
            result[outIdx + 1] = Math.round(sumG);
            result[outIdx + 2] = Math.round(sumB);
            result[outIdx + 3] = data[outIdx + 3]; // Keep alpha
        }
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Filter Functions
// =============================================================================

/**
 * Applies box blur (mean filter) to an image.
 * 
 * @param imageData - Source ImageData
 * @param size - Kernel size (3, 5, or 7)
 * @returns Blurred ImageData
 */
export function applyBoxBlur(imageData: ImageData, size: number = 3): ImageData {
    const kernel = generateBoxKernel(size);
    return applyConvolution(imageData, kernel);
}

/**
 * Applies Gaussian blur to an image.
 * 
 * @param imageData - Source ImageData
 * @param size - Kernel size
 * @param sigma - Standard deviation
 * @returns Blurred ImageData
 */
export function applyGaussianBlur(
    imageData: ImageData,
    size: number = 3,
    sigma: number = 1.0
): ImageData {
    const kernel = generateGaussianKernel(size, sigma);
    return applyConvolution(imageData, kernel);
}

/**
 * Applies sharpening filter to an image.
 * 
 * @param imageData - Source ImageData
 * @returns Sharpened ImageData
 */
export function applySharpen(imageData: ImageData): ImageData {
    return applyConvolution(imageData, KERNELS.sharpen);
}

/**
 * Applies Laplacian edge detection to an image.
 * Result is normalized to [0, 255] range.
 * 
 * @param imageData - Source ImageData
 * @returns Edge-detected ImageData
 */
export function applyLaplacian(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const kernel = KERNELS.laplacian;
    const kCenter = 1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sumR = 0, sumG = 0, sumB = 0;

            for (let ky = 0; ky < 3; ky++) {
                for (let kx = 0; kx < 3; kx++) {
                    const px = x + kx - kCenter;
                    const py = y + ky - kCenter;
                    const clampedX = Math.max(0, Math.min(width - 1, px));
                    const clampedY = Math.max(0, Math.min(height - 1, py));
                    const idx = (clampedY * width + clampedX) * 4;
                    const weight = kernel[ky][kx];

                    sumR += data[idx] * weight;
                    sumG += data[idx + 1] * weight;
                    sumB += data[idx + 2] * weight;
                }
            }

            // Convert to absolute value and scale for visibility
            const outIdx = (y * width + x) * 4;
            result[outIdx] = Math.min(255, Math.abs(sumR));
            result[outIdx + 1] = Math.min(255, Math.abs(sumG));
            result[outIdx + 2] = Math.min(255, Math.abs(sumB));
            result[outIdx + 3] = data[outIdx + 3];
        }
    }

    return new ImageData(result, width, height);
}
