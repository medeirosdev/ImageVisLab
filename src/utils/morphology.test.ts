/**
 * ImageVisLab - Morphology Unit Tests
 * 
 * Tests for binary morphological operations.
 */

import { describe, it, expect } from 'vitest';
import {
    applyThreshold,
    applyErosion,
    applyDilation,
    applyOpening,
    applyClosing,
} from './morphology';

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

function createBinaryImage(width: number, height: number, pattern: number[][]): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const value = pattern[y]?.[x] === 1 ? 255 : 0;
            data[idx] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
            data[idx + 3] = 255;
        }
    }
    return new ImageData(data, width, height);
}

// =============================================================================
// Thresholding Tests
// =============================================================================

describe('applyThreshold', () => {
    it('should convert to binary (black)', () => {
        const input = createTestImage(1, 1, 100);
        const result = applyThreshold(input, 128);

        expect(result.data[0]).toBe(0);
    });

    it('should convert to binary (white)', () => {
        const input = createTestImage(1, 1, 200);
        const result = applyThreshold(input, 128);

        expect(result.data[0]).toBe(255);
    });

    it('should treat values at or above threshold as white', () => {
        const input = createTestImage(1, 1, 129); // Slightly above threshold
        const result = applyThreshold(input, 128);

        expect(result.data[0]).toBe(255);
    });

    it('should only produce 0 or 255', () => {
        const input = createTestImage(10, 10, 100);
        const result = applyThreshold(input, 128);

        for (let i = 0; i < result.data.length; i += 4) {
            expect([0, 255]).toContain(result.data[i]);
        }
    });

    it('should preserve alpha channel', () => {
        const input = createTestImage(1, 1, 100);
        input.data[3] = 128;
        const result = applyThreshold(input, 128);

        expect(result.data[3]).toBe(128);
    });
});

// =============================================================================
// Erosion Tests
// =============================================================================

describe('applyErosion', () => {
    it('should shrink white regions', () => {
        // 3x3 white square
        const input = createBinaryImage(3, 3, [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
        ]);
        const result = applyErosion(input);

        // After erosion with 3x3 element, only center remains white
        const centerIdx = (1 * 3 + 1) * 4;
        expect(result.data[centerIdx]).toBe(255);
    });

    it('should remove single white pixel', () => {
        // Single white pixel in center
        const input = createBinaryImage(3, 3, [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
        ]);
        const result = applyErosion(input);

        // Single pixel should be eroded
        const centerIdx = (1 * 3 + 1) * 4;
        expect(result.data[centerIdx]).toBe(0);
    });

    it('should not change all-black image', () => {
        const input = createTestImage(3, 3, 0);
        const result = applyErosion(input);

        for (let i = 0; i < result.data.length; i += 4) {
            expect(result.data[i]).toBe(0);
        }
    });

    it('should preserve dimensions', () => {
        const input = createTestImage(10, 15, 255);
        const result = applyErosion(input);

        expect(result.width).toBe(10);
        expect(result.height).toBe(15);
    });
});

// =============================================================================
// Dilation Tests
// =============================================================================

describe('applyDilation', () => {
    it('should expand white regions', () => {
        // Single white pixel in center
        const input = createBinaryImage(3, 3, [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
        ]);
        const result = applyDilation(input);

        // After dilation, center and its neighbors should be white
        const centerIdx = (1 * 3 + 1) * 4;
        expect(result.data[centerIdx]).toBe(255); // Center stays white
        expect(result.data[(0 * 3 + 1) * 4]).toBe(255); // Top neighbor
        expect(result.data[(1 * 3 + 0) * 4]).toBe(255); // Left neighbor
    });

    it('should fill small holes', () => {
        // 3x3 white with black center
        const input = createBinaryImage(3, 3, [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
        ]);
        const result = applyDilation(input);

        // Center should become white
        const centerIdx = (1 * 3 + 1) * 4;
        expect(result.data[centerIdx]).toBe(255);
    });

    it('should not change all-white image', () => {
        const input = createTestImage(3, 3, 255);
        const result = applyDilation(input);

        for (let i = 0; i < result.data.length; i += 4) {
            expect(result.data[i]).toBe(255);
        }
    });

    it('should not change all-black image', () => {
        const input = createTestImage(3, 3, 0);
        const result = applyDilation(input);

        for (let i = 0; i < result.data.length; i += 4) {
            expect(result.data[i]).toBe(0);
        }
    });
});

// =============================================================================
// Opening Tests
// =============================================================================

describe('applyOpening', () => {
    it('should remove small white noise', () => {
        // Large white area with isolated white pixel
        const input = createBinaryImage(5, 5, [
            [1, 1, 1, 0, 0],
            [1, 1, 1, 0, 0],
            [1, 1, 1, 0, 1], // Isolated pixel at (4, 2)
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ]);
        const result = applyOpening(input);

        // Isolated pixel should be removed
        const isolatedIdx = (2 * 5 + 4) * 4;
        expect(result.data[isolatedIdx]).toBe(0);
    });

    it('should preserve larger structures', () => {
        const input = createBinaryImage(5, 5, [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
        ]);
        const result = applyOpening(input);

        // Center should remain white
        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBe(255);
    });
});

// =============================================================================
// Closing Tests
// =============================================================================

describe('applyClosing', () => {
    it('should fill small black holes', () => {
        // White area with small black hole
        const input = createBinaryImage(5, 5, [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 0, 1, 1], // Hole at center
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
        ]);
        const result = applyClosing(input);

        // Hole should be filled
        const centerIdx = (2 * 5 + 2) * 4;
        expect(result.data[centerIdx]).toBe(255);
    });

    it('should preserve larger black regions', () => {
        const input = createBinaryImage(5, 5, [
            [1, 1, 0, 0, 0],
            [1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ]);
        const result = applyClosing(input);

        // Large black area should remain
        const blackIdx = (4 * 5 + 4) * 4;
        expect(result.data[blackIdx]).toBe(0);
    });
});
