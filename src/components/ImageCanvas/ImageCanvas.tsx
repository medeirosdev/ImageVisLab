/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * ImageCanvas component for rendering and interacting with images.
 * Handles mouse tracking for pixel inspection.
 * 
 * @module ImageCanvas
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useRef, useEffect, useCallback } from 'react';
import './ImageCanvas.css';

// =============================================================================
// Types
// =============================================================================

interface ImageCanvasProps {
    /** The processed image data to display */
    imageData: ImageData | null;
    /** The original unprocessed image data */
    originalData: ImageData | null;
    /** Whether to show the original instead of processed */
    showOriginal: boolean;
    /** Callback when mouse moves over the canvas */
    onMouseMove?: (x: number, y: number) => void;
    /** Callback when mouse leaves the canvas */
    onMouseLeave?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
    imageData,
    originalData,
    showOriginal,
    onMouseMove,
    onMouseLeave,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ---------------------------------------------------------------------------
    // Effect: Render Image to Canvas
    // ---------------------------------------------------------------------------

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dataToRender = showOriginal ? originalData : imageData;

        if (dataToRender) {
            canvas.width = dataToRender.width;
            canvas.height = dataToRender.height;
            ctx.putImageData(dataToRender, 0, 0);
        } else {
            // Empty canvas state
            canvas.width = 800;
            canvas.height = 600;
            ctx.fillStyle = '#1e1e28';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Instruction message
            ctx.fillStyle = '#64748b';
            ctx.font = '18px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Load an image to begin', canvas.width / 2, canvas.height / 2);
        }
    }, [imageData, originalData, showOriginal]);

    // ---------------------------------------------------------------------------
    // Handler: Mouse Movement
    // ---------------------------------------------------------------------------

    /**
     * Calculates the actual pixel coordinates considering canvas scaling.
     */
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onMouseMove || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Calculate actual pixel position considering canvas scale
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        onMouseMove(x, y);
    }, [onMouseMove]);

    const handleMouseLeave = useCallback(() => {
        onMouseLeave?.();
    }, [onMouseLeave]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="image-canvas-container" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="image-canvas"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />

            {/* Indicator when viewing original */}
            {showOriginal && imageData && (
                <div className="original-indicator">
                    <span>Viewing Original</span>
                </div>
            )}
        </div>
    );
};

export default ImageCanvas;
