/**
 * ImageVisLab - useImageWorker Hook
 * 
 * React hook for managing image processing Web Worker.
 * Handles worker lifecycle, request queuing, and cleanup.
 * 
 * @module useImageWorker
 * @author ImageVisLab Contributors
 * @license MIT
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FilterType, FilterParams } from '../types';
import type { WorkerRequest, WorkerResponse } from '../workers/imageWorker';

// =============================================================================
// Types
// =============================================================================

interface UseImageWorkerOptions {
    /** Whether to use the worker (can disable for debugging) */
    enabled?: boolean;
}

interface UseImageWorkerResult {
    /** Process an image with a filter */
    processImage: (
        imageData: ImageData,
        filter: FilterType,
        params: FilterParams
    ) => Promise<ImageData>;
    /** Whether processing is in progress */
    isProcessing: boolean;
    /** Last processing time in ms */
    lastProcessingTime: number | null;
    /** Whether worker is ready */
    isReady: boolean;
    /** Any error that occurred */
    error: string | null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useImageWorker(
    options: UseImageWorkerOptions = {}
): UseImageWorkerResult {
    const { enabled = true } = options;

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const pendingRequestsRef = useRef<Map<number, {
        resolve: (value: ImageData) => void;
        reject: (error: Error) => void;
    }>>(new Map());

    const [isProcessing, setIsProcessing] = useState(false);
    const [lastProcessingTime, setLastProcessingTime] = useState<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize worker
    useEffect(() => {
        if (!enabled) {
            setIsReady(true);
            return;
        }

        try {
            // Create worker with Vite's worker syntax
            workerRef.current = new Worker(
                new URL('../workers/imageWorker.ts', import.meta.url),
                { type: 'module' }
            );

            workerRef.current.onmessage = (event: MessageEvent<WorkerResponse | { type: 'ready' }>) => {
                const data = event.data;

                if (data.type === 'ready') {
                    setIsReady(true);
                    return;
                }

                const pending = pendingRequestsRef.current.get(data.requestId);
                if (!pending) return;

                pendingRequestsRef.current.delete(data.requestId);

                if (data.type === 'result' && data.imageData) {
                    setLastProcessingTime(data.processingTime);
                    setIsProcessing(pendingRequestsRef.current.size > 0);
                    pending.resolve(data.imageData);
                } else if (data.type === 'error') {
                    setError(data.error || 'Unknown error');
                    setIsProcessing(pendingRequestsRef.current.size > 0);
                    pending.reject(new Error(data.error || 'Worker error'));
                }
            };

            workerRef.current.onerror = (err) => {
                console.error('Worker error:', err);
                setError(err.message);
                setIsReady(false);
            };
        } catch (err) {
            console.error('Failed to create worker:', err);
            setError(err instanceof Error ? err.message : 'Failed to create worker');
            setIsReady(true); // Allow fallback to main thread
        }

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
            pendingRequestsRef.current.clear();
        };
    }, [enabled]);

    // Process image function
    const processImage = useCallback(
        async (
            imageData: ImageData,
            filter: FilterType,
            params: FilterParams
        ): Promise<ImageData> => {
            setError(null);

            // If worker not available, we could fall back to main thread
            // but for now just return original
            if (!enabled || !workerRef.current) {
                return imageData;
            }

            const requestId = ++requestIdRef.current;

            return new Promise((resolve, reject) => {
                pendingRequestsRef.current.set(requestId, { resolve, reject });
                setIsProcessing(true);

                const request: WorkerRequest = {
                    type: 'process',
                    imageData,
                    filter,
                    params,
                    requestId,
                };

                // Transfer the buffer for better performance
                workerRef.current!.postMessage(request, [imageData.data.buffer]);
            });
        },
        [enabled]
    );

    return {
        processImage,
        isProcessing,
        lastProcessingTime,
        isReady,
        error,
    };
}

export default useImageWorker;
