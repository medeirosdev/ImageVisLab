/**
 * ImageVisLab - Image Processing Web Worker
 * 
 * Handles heavy image processing operations in a separate thread
 * to keep the UI responsive.
 * 
 * @module imageWorker
 * @author ImageVisLab Contributors
 * @license MIT
 */

// Import filter functions (will be bundled with worker)
import {
    applyNegative,
    applyGamma,
    applyLog,
    applyQuantization,
    applySampling,
    applyEqualization,
} from '../utils/imageFilters';

import {
    applyBoxBlur,
    applyGaussianBlur,
    applySharpen,
    applyLaplacian,
} from '../utils/convolution';

import {
    applyThreshold,
    applyErosion,
    applyDilation,
    applyOpening,
    applyClosing,
} from '../utils/morphology';

import {
    applyCustomFormula,
    applyCustomKernel,
} from '../utils/customFilters';

import {
    applySobelX,
    applySobelY,
    applySobelMagnitude,
} from '../utils/edgeDetection';

import { applyMedian } from '../utils/noiseReduction';

import {
    applyGrayscale,
    applySepia,
    applySwapChannels,
} from '../utils/colorFilters';

import { applyFFTSpectrum } from '../utils/fft';

import type { FilterType, FilterParams } from '../types';

// =============================================================================
// Worker Message Types
// =============================================================================

export interface WorkerRequest {
    type: 'process';
    imageData: ImageData;
    filter: FilterType;
    params: FilterParams;
    requestId: number;
}

export interface WorkerResponse {
    type: 'result' | 'error';
    imageData?: ImageData;
    error?: string;
    requestId: number;
    processingTime: number;
}

// =============================================================================
// Process Image Function
// =============================================================================

function processImage(
    imageData: ImageData,
    filter: FilterType,
    params: FilterParams
): ImageData {
    switch (filter) {
        // Point Operations
        case 'negative':
            return applyNegative(imageData);
        case 'gamma':
            return applyGamma(imageData, params.gamma, params.gammaConstant);
        case 'log':
            return applyLog(imageData, params.logConstant);
        case 'quantization':
            return applyQuantization(imageData, params.quantizationLevels);
        case 'sampling':
            return applySampling(imageData, params.samplingFactor);
        case 'equalization':
            return applyEqualization(imageData);

        // Spatial Filters
        case 'boxBlur':
            return applyBoxBlur(imageData, params.kernelSize);
        case 'gaussianBlur':
            return applyGaussianBlur(imageData, params.kernelSize, params.gaussianSigma);
        case 'sharpen':
            return applySharpen(imageData);
        case 'laplacian':
            return applyLaplacian(imageData);

        // Morphology Operations
        case 'threshold':
            return applyThreshold(imageData, params.threshold);
        case 'erosion':
            return applyErosion(applyThreshold(imageData, params.threshold));
        case 'dilation':
            return applyDilation(applyThreshold(imageData, params.threshold));
        case 'opening':
            return applyOpening(applyThreshold(imageData, params.threshold));
        case 'closing':
            return applyClosing(applyThreshold(imageData, params.threshold));

        // Custom Operations
        case 'customFormula':
            return applyCustomFormula(imageData, params.customFormula);
        case 'customKernel':
            return applyCustomKernel(imageData, params.customKernel);

        // Edge Detection
        case 'sobelX':
            return applySobelX(imageData);
        case 'sobelY':
            return applySobelY(imageData);
        case 'sobelMagnitude':
            return applySobelMagnitude(imageData);

        // Noise Reduction
        case 'median':
            return applyMedian(imageData, params.kernelSize);

        // Color Filters
        case 'grayscale':
            return applyGrayscale(imageData);
        case 'sepia':
            return applySepia(imageData);
        case 'swapChannels':
            return applySwapChannels(imageData);

        // Frequency Domain
        case 'fftSpectrum':
            return applyFFTSpectrum(imageData);

        // No filter
        case 'none':
        default:
            return imageData;
    }
}

// =============================================================================
// Worker Message Handler
// =============================================================================

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const { type, imageData, filter, params, requestId } = event.data;

    if (type !== 'process') {
        return;
    }

    const startTime = performance.now();

    try {
        const result = processImage(imageData, filter, params);
        const processingTime = performance.now() - startTime;

        const response: WorkerResponse = {
            type: 'result',
            imageData: result,
            requestId,
            processingTime,
        };

        self.postMessage(response, { transfer: [result.data.buffer] });
    } catch (error) {
        const processingTime = performance.now() - startTime;

        const response: WorkerResponse = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
            processingTime,
        };

        self.postMessage(response);
    }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
