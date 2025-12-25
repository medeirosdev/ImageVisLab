/**
 * ImageVisLab - Filter Steps
 * 
 * Step-by-step definitions for educational mode.
 * Each filter can have multiple intermediate steps with descriptions.
 * 
 * @module filterSteps
 * @author ImageVisLab Contributors
 * @license MIT
 */

import type { FilterType, FilterStep, StepByStepInfo } from '../types';

// Import filter functions for intermediate processing
import { applyThreshold, applyErosion, applyDilation } from './morphology';

// =============================================================================
// Step-by-Step Info
// =============================================================================

/**
 * Get step-by-step information for a filter.
 */
export function getStepByStepInfo(filter: FilterType): StepByStepInfo {
    switch (filter) {
        case 'sobelMagnitude':
            return {
                filter,
                supported: true,
                totalSteps: 4,
                stepNames: ['Grayscale', 'Sobel X', 'Sobel Y', 'Magnitude'],
            };

        case 'equalization':
            return {
                filter,
                supported: true,
                totalSteps: 3,
                stepNames: ['Original Histogram', 'Calculate CDF', 'Apply Mapping'],
            };

        case 'opening':
            return {
                filter,
                supported: true,
                totalSteps: 3,
                stepNames: ['Binarization', 'Erosion', 'Dilation'],
            };

        case 'closing':
            return {
                filter,
                supported: true,
                totalSteps: 3,
                stepNames: ['Binarization', 'Dilation', 'Erosion'],
            };

        case 'laplacian':
            return {
                filter,
                supported: true,
                totalSteps: 2,
                stepNames: ['Grayscale', 'Laplacian'],
            };

        default:
            return {
                filter,
                supported: false,
                totalSteps: 1,
                stepNames: ['Full Processing'],
            };
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert image to grayscale.
 */
function toGrayscale(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        result[i] = gray;
        result[i + 1] = gray;
        result[i + 2] = gray;
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

/**
 * Apply Sobel X kernel.
 */
function applySobelXStep(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let ky = 0; ky < 3; ky++) {
                for (let kx = 0; kx < 3; kx++) {
                    const px = Math.max(0, Math.min(width - 1, x + kx - 1));
                    const py = Math.max(0, Math.min(height - 1, y + ky - 1));
                    const idx = (py * width + px) * 4;
                    sum += data[idx] * kernel[ky][kx];
                }
            }
            const value = Math.min(255, Math.abs(sum));
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
 * Apply Sobel Y kernel.
 */
function applySobelYStep(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const kernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let ky = 0; ky < 3; ky++) {
                for (let kx = 0; kx < 3; kx++) {
                    const px = Math.max(0, Math.min(width - 1, x + kx - 1));
                    const py = Math.max(0, Math.min(height - 1, y + ky - 1));
                    const idx = (py * width + px) * 4;
                    sum += data[idx] * kernel[ky][kx];
                }
            }
            const value = Math.min(255, Math.abs(sum));
            const idx = (y * width + x) * 4;
            result[idx] = value;
            result[idx + 1] = value;
            result[idx + 2] = value;
            result[idx + 3] = data[idx + 3];
        }
    }

    return new ImageData(result, width, height);
}

// =============================================================================
// Step Processing
// =============================================================================

/**
 * Process a filter up to a specific step and return the result with description.
 */
export function processFilterStep(
    imageData: ImageData,
    filter: FilterType,
    step: number,
    threshold: number = 128
): FilterStep {
    const info = getStepByStepInfo(filter);

    switch (filter) {
        case 'sobelMagnitude':
            return processSobelMagnitudeStep(imageData, step, info);

        case 'opening':
            return processOpeningStep(imageData, step, threshold, info);

        case 'closing':
            return processClosingStep(imageData, step, threshold, info);

        case 'laplacian':
            return processLaplacianStep(imageData, step, info);

        default:
            return {
                stepNumber: 1,
                totalSteps: 1,
                title: 'Processing',
                description: 'Applying filter...',
                imageData,
            };
    }
}

/**
 * Sobel Magnitude step-by-step processing.
 */
function processSobelMagnitudeStep(
    imageData: ImageData,
    step: number,
    info: StepByStepInfo
): FilterStep {
    const grayImage = toGrayscale(imageData);

    switch (step) {
        case 1:
            return {
                stepNumber: 1,
                totalSteps: info.totalSteps,
                title: 'Step 1: Grayscale Conversion',
                description: 'Converting image to grayscale using luminance formula: Y = 0.299R + 0.587G + 0.114B',
                formula: 'Y = 0.299R + 0.587G + 0.114B',
                imageData: grayImage,
            };

        case 2:
            return {
                stepNumber: 2,
                totalSteps: info.totalSteps,
                title: 'Step 2: Sobel X (Horizontal Gradient)',
                description: 'Applying Sobel X kernel to detect vertical edges. This highlights left-to-right intensity changes.',
                formula: 'G_x = \\begin{bmatrix} -1 & 0 & 1 \\\\ -2 & 0 & 2 \\\\ -1 & 0 & 1 \\end{bmatrix} * I',
                imageData: applySobelXStep(grayImage),
            };

        case 3:
            return {
                stepNumber: 3,
                totalSteps: info.totalSteps,
                title: 'Step 3: Sobel Y (Vertical Gradient)',
                description: 'Applying Sobel Y kernel to detect horizontal edges. This highlights top-to-bottom intensity changes.',
                formula: 'G_y = \\begin{bmatrix} -1 & -2 & -1 \\\\ 0 & 0 & 0 \\\\ 1 & 2 & 1 \\end{bmatrix} * I',
                imageData: applySobelYStep(grayImage),
            };

        case 4:
        default: {
            // Combine both gradients
            const gx = applySobelXStep(grayImage);
            const gy = applySobelYStep(grayImage);
            const { width, height } = imageData;
            const result = new Uint8ClampedArray(gx.data.length);

            for (let i = 0; i < gx.data.length; i += 4) {
                const magnitude = Math.sqrt(gx.data[i] ** 2 + gy.data[i] ** 2);
                const value = Math.min(255, magnitude);
                result[i] = value;
                result[i + 1] = value;
                result[i + 2] = value;
                result[i + 3] = 255;
            }

            return {
                stepNumber: 4,
                totalSteps: info.totalSteps,
                title: 'Step 4: Gradient Magnitude',
                description: 'Combining both gradients using the magnitude formula. This produces the final edge map.',
                formula: 'G = \\sqrt{G_x^2 + G_y^2}',
                imageData: new ImageData(result, width, height),
            };
        }
    }
}

/**
 * Opening step-by-step processing.
 */
function processOpeningStep(
    imageData: ImageData,
    step: number,
    threshold: number,
    info: StepByStepInfo
): FilterStep {
    const binary = applyThreshold(imageData, threshold);

    switch (step) {
        case 1:
            return {
                stepNumber: 1,
                totalSteps: info.totalSteps,
                title: 'Step 1: Binarization',
                description: `Converting to binary image using threshold T = ${threshold}. Pixels >= T become white, others become black.`,
                formula: 's = \\begin{cases} 255 & r \\geq T \\\\ 0 & r < T \\end{cases}',
                imageData: binary,
            };

        case 2:
            return {
                stepNumber: 2,
                totalSteps: info.totalSteps,
                title: 'Step 2: Erosion',
                description: 'Applying erosion with 3×3 structuring element. This shrinks white regions and removes small white noise.',
                formula: 'A \\ominus B',
                imageData: applyErosion(binary),
            };

        case 3:
        default:
            return {
                stepNumber: 3,
                totalSteps: info.totalSteps,
                title: 'Step 3: Dilation',
                description: 'Applying dilation to the eroded image. This restores object size while keeping noise removed.',
                formula: '(A \\ominus B) \\oplus B',
                imageData: applyDilation(applyErosion(binary)),
            };
    }
}

/**
 * Closing step-by-step processing.
 */
function processClosingStep(
    imageData: ImageData,
    step: number,
    threshold: number,
    info: StepByStepInfo
): FilterStep {
    const binary = applyThreshold(imageData, threshold);

    switch (step) {
        case 1:
            return {
                stepNumber: 1,
                totalSteps: info.totalSteps,
                title: 'Step 1: Binarization',
                description: `Converting to binary image using threshold T = ${threshold}. Pixels >= T become white, others become black.`,
                formula: 's = \\begin{cases} 255 & r \\geq T \\\\ 0 & r < T \\end{cases}',
                imageData: binary,
            };

        case 2:
            return {
                stepNumber: 2,
                totalSteps: info.totalSteps,
                title: 'Step 2: Dilation',
                description: 'Applying dilation with 3×3 structuring element. This expands white regions and fills small black holes.',
                formula: 'A \\oplus B',
                imageData: applyDilation(binary),
            };

        case 3:
        default:
            return {
                stepNumber: 3,
                totalSteps: info.totalSteps,
                title: 'Step 3: Erosion',
                description: 'Applying erosion to the dilated image. This restores object size while keeping holes filled.',
                formula: '(A \\oplus B) \\ominus B',
                imageData: applyErosion(applyDilation(binary)),
            };
    }
}

/**
 * Laplacian step-by-step processing.
 */
function processLaplacianStep(
    imageData: ImageData,
    step: number,
    info: StepByStepInfo
): FilterStep {
    const grayImage = toGrayscale(imageData);

    switch (step) {
        case 1:
            return {
                stepNumber: 1,
                totalSteps: info.totalSteps,
                title: 'Step 1: Grayscale Conversion',
                description: 'Converting image to grayscale for edge detection.',
                formula: 'Y = 0.299R + 0.587G + 0.114B',
                imageData: grayImage,
            };

        case 2:
        default: {
            // Apply Laplacian kernel
            const { width, height, data } = grayImage;
            const result = new Uint8ClampedArray(data.length);
            const kernel = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    for (let ky = 0; ky < 3; ky++) {
                        for (let kx = 0; kx < 3; kx++) {
                            const px = Math.max(0, Math.min(width - 1, x + kx - 1));
                            const py = Math.max(0, Math.min(height - 1, y + ky - 1));
                            const idx = (py * width + px) * 4;
                            sum += data[idx] * kernel[ky][kx];
                        }
                    }
                    const value = Math.min(255, Math.abs(sum));
                    const idx = (y * width + x) * 4;
                    result[idx] = value;
                    result[idx + 1] = value;
                    result[idx + 2] = value;
                    result[idx + 3] = 255;
                }
            }

            return {
                stepNumber: 2,
                totalSteps: info.totalSteps,
                title: 'Step 2: Laplacian Edge Detection',
                description: 'Applying Laplacian operator to find edges by detecting zero-crossings in second derivative.',
                formula: '\\nabla^2 f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2}',
                imageData: new ImageData(result, width, height),
            };
        }
    }
}
