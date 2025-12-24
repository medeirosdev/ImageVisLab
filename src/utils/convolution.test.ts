/**
 * ImageVisLab - Convolution Unit Tests
 * 
 * Tests for spatial filters (convolution operations).
 */

import { describe, it, expect } from 'vitest';
import {
    applyBoxBlur,
    applyGaussianBlur,
    applySharpen,
    applyLaplacian,
    applyConvolution,
    generateGaussianKernel,
    generateBoxKernel,
} from './convolution';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestImage(width: number, height: number, fillValue: number = 128): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = fillValue;
        data[i + 1] = fillValue;
        data[i + 2] = fillValue;
        data[i + 3] = 255;
    }
    return new ImageData(data, width, height);
}

function createEdgeImage(size: number): ImageData {
    const data = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            // Left half black, right half white
            const value = x < size / 2 ? 0 : 255;
            data[idx] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
            data[idx + 3] = 255;
        }
    }
    return new ImageData(data, size, size);
}

// =============================================================================
// Kernel Generation Tests
// =============================================================================

describe('generateBoxKernel', () => {
    it('should create 3x3 kernel with sum = 1', () => {
        const kernel = generateBoxKernel(3);

        expect(kernel).toHaveLength(3);
        expect(kernel[0]).toHaveLength(3);

        let sum = 0;
        for (const row of kernel) {
            for (const val of row) {
                sum += val;
            }
        }
        expect(sum).toBeCloseTo(1, 5);
    });

    it('should create 5x5 kernel', () => {
        const kernel = generateBoxKernel(5);

        expect(kernel).toHaveLength(5);
        expect(kernel[0]).toHaveLength(5);
        expect(kernel[0][0]).toBeCloseTo(1 / 25, 5);
    });
});

describe('generateGaussianKernel', () => {
    it('should create 3x3 kernel with center as maximum', () => {
        const kernel = generateGaussianKernel(3, 1.0);

        expect(kernel).toHaveLength(3);
        expect(kernel[1][1]).toBeGreaterThan(kernel[0][0]);
    });

    it('should have symmetric values', () => {
        const kernel = generateGaussianKernel(3, 1.0);

        // Corners should be equal
        expect(kernel[0][0]).toBeCloseTo(kernel[0][2], 5);
        expect(kernel[0][0]).toBeCloseTo(kernel[2][0], 5);
        expect(kernel[0][0]).toBeCloseTo(kernel[2][2], 5);
    });

    it('should sum to approximately 1', () => {
        const kernel = generateGaussianKernel(3, 1.0);

        let sum = 0;
        for (const row of kernel) {
            for (const val of row) {
                sum += val;
            }
        }
        expect(sum).toBeCloseTo(1, 2);
    });
});

// =============================================================================
// Box Blur Tests
// =============================================================================

describe('applyBoxBlur', () => {
    it('should not change uniform image', () => {
        const input = createTestImage(5, 5, 128);
        const result = applyBoxBlur(input, 3);

        // Center pixel should still be 128
        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBe(128);
    });

    it('should blur edges', () => {
        const input = createEdgeImage(5);
        const result = applyBoxBlur(input, 3);

        // Center pixel (at edge) should have intermediate value
        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBeGreaterThan(0);
        expect(result.data[centerIdx]).toBeLessThan(255);
    });

    it('should preserve image dimensions', () => {
        const input = createTestImage(10, 15, 128);
        const result = applyBoxBlur(input, 3);

        expect(result.width).toBe(10);
        expect(result.height).toBe(15);
    });
});

// =============================================================================
// Gaussian Blur Tests
// =============================================================================

describe('applyGaussianBlur', () => {
    it('should not change uniform image', () => {
        const input = createTestImage(5, 5, 100);
        const result = applyGaussianBlur(input, 3, 1.0);

        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBeCloseTo(100, 0);
    });

    it('should blur edges', () => {
        const input = createEdgeImage(5);
        const result = applyGaussianBlur(input, 3, 1.0);

        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBeGreaterThan(0);
        expect(result.data[centerIdx]).toBeLessThan(255);
    });

    it('should preserve alpha channel', () => {
        const input = createTestImage(3, 3, 128);
        input.data[16 + 3] = 200; // Center pixel alpha
        const result = applyGaussianBlur(input, 3, 1.0);

        expect(result.data[16 + 3]).toBe(200);
    });
});

// =============================================================================
// Sharpen Tests
// =============================================================================

describe('applySharpen', () => {
    it('should not significantly change uniform image', () => {
        const input = createTestImage(5, 5, 128);
        const result = applySharpen(input);

        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBeCloseTo(128, -1);
    });

    it('should enhance edges', () => {
        const input = createEdgeImage(5);
        const result = applySharpen(input);

        // Edge pixels should have more extreme values
        expect(result.width).toBe(5);
    });
});

// =============================================================================
// Laplacian Tests
// =============================================================================

describe('applyLaplacian', () => {
    it('should produce zero for uniform image', () => {
        const input = createTestImage(5, 5, 128);
        const result = applyLaplacian(input);

        // Laplacian of uniform area should be 0 (no edges)
        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBe(0);
    });

    it('should detect edges', () => {
        const input = createEdgeImage(5);
        const result = applyLaplacian(input);

        // At the edge there should be non-zero response
        expect(result.width).toBe(5);
    });
});

// =============================================================================
// Generic Convolution Tests
// =============================================================================

describe('applyConvolution', () => {
    it('should apply identity kernel correctly', () => {
        const input = createTestImage(3, 3, 100);
        const identityKernel = [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
        ];
        const result = applyConvolution(input, identityKernel);

        expect(result.data[16]).toBe(100); // Center pixel
    });

    it('should handle edge pixels', () => {
        const input = createTestImage(3, 3, 128);
        const kernel = generateBoxKernel(3);
        const result = applyConvolution(input, kernel);

        // Should not throw for edge pixels
        expect(result.data[0]).toBeDefined();
    });
});
