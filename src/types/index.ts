/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * Type definitions for the application state, filters, and image data.
 * 
 * @module types
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Pixel and Position Types
// =============================================================================

/**
 * Represents a single pixel with RGBA values.
 */
export interface Pixel {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * Represents a 2D position coordinate.
 */
export interface Position {
    x: number;
    y: number;
}

// =============================================================================
// Image State Types
// =============================================================================

/**
 * Represents the complete state of an image in the application.
 */
export interface ImageState {
    original: ImageData | null;
    processed: ImageData | null;
    width: number;
    height: number;
    fileName: string;
}

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Parameters for all available image filters.
 * Each filter may use a subset of these parameters.
 */
export interface FilterParams {
    /** Gamma exponent for power-law transformation */
    gamma: number;
    /** Scaling constant for gamma transformation */
    gammaConstant: number;
    /** Scaling constant for logarithmic transformation */
    logConstant: number;
    /** Number of intensity levels for quantization (2-256) */
    quantizationLevels: number;
    /** Block size for spatial subsampling (1-32) */
    samplingFactor: number;
    /** Kernel size for convolution filters (3, 5, or 7) */
    kernelSize: number;
    /** Sigma for Gaussian blur */
    gaussianSigma: number;
    /** Threshold for binarization (0-255) */
    threshold: number;
    /** Custom formula string (e.g., "255 - r") */
    customFormula: string;
    /** Custom convolution kernel */
    customKernel: number[][];
    /** Custom kernel size (3, 5, or 7) */
    customKernelSize: number;
}

/**
 * Available filter types in the application.
 */
export type FilterType =
    // No filter
    | 'none'
    // Point Operations
    | 'negative'
    | 'gamma'
    | 'log'
    | 'quantization'
    | 'sampling'
    | 'equalization'
    // Spatial Filters (Convolution)
    | 'boxBlur'
    | 'gaussianBlur'
    | 'sharpen'
    | 'laplacian'
    // Edge Detection
    | 'sobelX'
    | 'sobelY'
    | 'sobelMagnitude'
    // Noise Reduction
    | 'median'
    // Color Filters
    | 'grayscale'
    | 'sepia'
    | 'swapChannels'
    // Morphology Operations
    | 'threshold'
    | 'erosion'
    | 'dilation'
    | 'opening'
    | 'closing'
    // Custom Operations
    | 'customFormula'
    | 'customKernel'
    // Frequency Domain
    | 'fftSpectrum';

// =============================================================================
// Application State Types
// =============================================================================

/**
 * Complete application state interface.
 */
export interface AppState {
    image: ImageState;
    activeFilter: FilterType;
    filterParams: FilterParams;
    mousePosition: Position | null;
    showOriginal: boolean;
}

// =============================================================================
// Histogram Types
// =============================================================================

/**
 * Histogram data for image analysis.
 * Contains frequency distribution for each color channel.
 */
export interface HistogramData {
    r: number[];
    g: number[];
    b: number[];
    gray: number[];
}

// =============================================================================
// Neighborhood and Distance Types
// =============================================================================

/**
 * Pixel neighborhood connectivity types.
 * - N4: 4-connected (horizontal and vertical neighbors)
 * - ND: Diagonal neighbors only
 * - N8: 8-connected (all surrounding pixels)
 */
export type NeighborType = 'N4' | 'ND' | 'N8';

/**
 * Distance metric types for pixel distance calculations.
 * - euclidean: sqrt((x1-x2)^2 + (y1-y2)^2)
 * - cityBlock: |x1-x2| + |y1-y2| (D4)
 * - chessboard: max(|x1-x2|, |y1-y2|) (D8)
 */
export type DistanceMetric = 'euclidean' | 'cityBlock' | 'chessboard';
