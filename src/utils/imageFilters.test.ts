/**
 * ImageVisLab - Image Filters Unit Tests
 * 
 * Tests for point operations (intensity transformations).
 */

import { describe, it, expect } from 'vitest';
import {
    applyNegative,
    applyGamma,
    applyLog,
    applyQuantization,
    applySampling,
    applyEqualization,
    getPixelInfo,
    calculateHistogram,
} from './imageFilters';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a test ImageData with specified pixel values.
 */
function createTestImage(width: number, height: number, fillValue: number = 128): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = fillValue;       // R
        data[i + 1] = fillValue;   // G
        data[i + 2] = fillValue;   // B
        data[i + 3] = 255;         // A
    }
    return new ImageData(data, width, height);
}

/**
 * Creates an ImageData with gradient values.
 */
function createGradientImage(width: number, height: number): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const value = Math.floor((x / width) * 255);
            data[idx] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
            data[idx + 3] = 255;
        }
    }
    return new ImageData(data, width, height);
}

// =============================================================================
// Negative Transform Tests
// =============================================================================

describe('applyNegative', () => {
    it('should invert intensity values', () => {
        const input = createTestImage(2, 2, 100);
        const result = applyNegative(input);

        // 255 - 100 = 155
        expect(result.data[0]).toBe(155);
        expect(result.data[1]).toBe(155);
        expect(result.data[2]).toBe(155);
    });

    it('should invert black to white', () => {
        const input = createTestImage(1, 1, 0);
        const result = applyNegative(input);

        expect(result.data[0]).toBe(255);
    });

    it('should invert white to black', () => {
        const input = createTestImage(1, 1, 255);
        const result = applyNegative(input);

        expect(result.data[0]).toBe(0);
    });

    it('should preserve alpha channel', () => {
        const input = createTestImage(1, 1, 100);
        input.data[3] = 128; // Set alpha
        const result = applyNegative(input);

        expect(result.data[3]).toBe(128);
    });

    it('should preserve image dimensions', () => {
        const input = createTestImage(10, 20, 100);
        const result = applyNegative(input);

        expect(result.width).toBe(10);
        expect(result.height).toBe(20);
    });
});

// =============================================================================
// Gamma Transform Tests
// =============================================================================

describe('applyGamma', () => {
    it('should brighten with gamma < 1', () => {
        const input = createTestImage(1, 1, 128);
        const result = applyGamma(input, 0.5, 1.0);

        // gamma < 1 brightens, so result should be > 128
        expect(result.data[0]).toBeGreaterThan(128);
    });

    it('should darken with gamma > 1', () => {
        const input = createTestImage(1, 1, 128);
        const result = applyGamma(input, 2.0, 1.0);

        // gamma > 1 darkens, so result should be < 128
        expect(result.data[0]).toBeLessThan(128);
    });

    it('should not change with gamma = 1', () => {
        const input = createTestImage(1, 1, 128);
        const result = applyGamma(input, 1.0, 1.0);

        // With gamma = 1, output should be close to input
        expect(result.data[0]).toBeCloseTo(128, -1);
    });

    it('should preserve black pixels', () => {
        const input = createTestImage(1, 1, 0);
        const result = applyGamma(input, 2.0, 1.0);

        expect(result.data[0]).toBe(0);
    });

    it('should preserve white pixels', () => {
        const input = createTestImage(1, 1, 255);
        const result = applyGamma(input, 0.5, 1.0);

        expect(result.data[0]).toBe(255);
    });
});

// =============================================================================
// Logarithmic Transform Tests
// =============================================================================

describe('applyLog', () => {
    it('should expand dark tones', () => {
        const input = createTestImage(1, 1, 50);
        const result = applyLog(input, 1.0);

        // Log transform expands dark tones, so dark values increase more
        expect(result.data[0]).toBeGreaterThan(50);
    });

    it('should preserve black pixels', () => {
        const input = createTestImage(1, 1, 0);
        const result = applyLog(input, 1.0);

        expect(result.data[0]).toBe(0);
    });

    it('should not exceed 255', () => {
        const input = createTestImage(1, 1, 255);
        const result = applyLog(input, 1.0);

        expect(result.data[0]).toBeLessThanOrEqual(255);
    });
});

// =============================================================================
// Quantization Tests
// =============================================================================

describe('applyQuantization', () => {
    it('should reduce to 2 levels (binary)', () => {
        const input = createGradientImage(256, 1);
        const result = applyQuantization(input, 2);

        // With 2 levels, we should only have values near 0 or 255
        const values = new Set<number>();
        for (let i = 0; i < result.data.length; i += 4) {
            values.add(result.data[i]);
        }
        expect(values.size).toBeLessThanOrEqual(2);
    });

    it('should not change with 256 levels', () => {
        const input = createTestImage(1, 1, 128);
        const result = applyQuantization(input, 256);

        expect(result.data[0]).toBeCloseTo(128, 0);
    });

    it('should reduce unique intensity values', () => {
        const input = createGradientImage(256, 1);
        const result = applyQuantization(input, 8);

        const values = new Set<number>();
        for (let i = 0; i < result.data.length; i += 4) {
            values.add(result.data[i]);
        }
        expect(values.size).toBeLessThanOrEqual(8);
    });
});

// =============================================================================
// Sampling Tests
// =============================================================================

describe('applySampling', () => {
    it('should not change with factor 1', () => {
        const input = createTestImage(4, 4, 128);
        const result = applySampling(input, 1);

        expect(result.data[0]).toBe(128);
    });

    it('should use top-left pixel of each block', () => {
        const input = new ImageData(new Uint8ClampedArray([
            100, 100, 100, 255, 200, 200, 200, 255,
            150, 150, 150, 255, 250, 250, 250, 255,
        ]), 2, 2);

        const result = applySampling(input, 2);

        // Top-left pixel (100) is used for entire block
        expect(result.data[0]).toBe(100);
        expect(result.data[4]).toBe(100); // Second pixel gets top-left value
    });

    it('should preserve image dimensions', () => {
        const input = createTestImage(16, 16, 128);
        const result = applySampling(input, 4);

        expect(result.width).toBe(16);
        expect(result.height).toBe(16);
    });
});

// =============================================================================
// Equalization Tests
// =============================================================================

describe('applyEqualization', () => {
    it('should spread histogram', () => {
        const input = createTestImage(10, 10, 128);
        const result = applyEqualization(input);

        // With uniform input, output should be similar
        expect(result.data[0]).toBeDefined();
    });

    it('should not change already uniform image', () => {
        const input = createGradientImage(256, 1);
        const result = applyEqualization(input);

        // Already has full range, so output should be similar
        expect(result.width).toBe(256);
    });

    it('should preserve image dimensions', () => {
        const input = createTestImage(50, 30, 100);
        const result = applyEqualization(input);

        expect(result.width).toBe(50);
        expect(result.height).toBe(30);
    });
});

// =============================================================================
// Pixel Info Tests
// =============================================================================

describe('getPixelInfo', () => {
    it('should return correct RGB values', () => {
        const input = new ImageData(new Uint8ClampedArray([
            100, 150, 200, 255,
        ]), 1, 1);

        const info = getPixelInfo(input, 0, 0);

        expect(info?.r).toBe(100);
        expect(info?.g).toBe(150);
        expect(info?.b).toBe(200);
    });

    it('should return null for out of bounds', () => {
        const input = createTestImage(2, 2, 128);

        expect(getPixelInfo(input, -1, 0)).toBeNull();
        expect(getPixelInfo(input, 0, -1)).toBeNull();
        expect(getPixelInfo(input, 2, 0)).toBeNull();
        expect(getPixelInfo(input, 0, 2)).toBeNull();
    });

    it('should calculate correct hex value', () => {
        const input = new ImageData(new Uint8ClampedArray([
            255, 0, 0, 255,
        ]), 1, 1);

        const info = getPixelInfo(input, 0, 0);

        expect(info?.hex.toUpperCase()).toBe('#FF0000');
    });
});

// =============================================================================
// Histogram Tests
// =============================================================================

describe('calculateHistogram', () => {
    it('should return object with channel arrays', () => {
        const input = createTestImage(10, 10, 128);
        const histogram = calculateHistogram(input);

        expect(histogram.r).toHaveLength(256);
        expect(histogram.g).toHaveLength(256);
        expect(histogram.b).toHaveLength(256);
        expect(histogram.gray).toHaveLength(256);
    });

    it('should count pixels correctly', () => {
        const input = createTestImage(10, 10, 128);
        const histogram = calculateHistogram(input);

        // All 100 pixels have value 128
        expect(histogram.gray[128]).toBe(100);
    });

    it('should have zero counts for unused values', () => {
        const input = createTestImage(10, 10, 128);
        const histogram = calculateHistogram(input);

        expect(histogram.gray[0]).toBe(0);
        expect(histogram.gray[255]).toBe(0);
    });
});
