/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * ImageCanvas component with zoom/pan functionality.
 * Handles mouse tracking for pixel inspection and image navigation.
 * 
 * @module ImageCanvas
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
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

    // Zoom and pan state
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

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

    // Reset zoom/pan when image changes
    useEffect(() => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    }, [imageData]);

    // ---------------------------------------------------------------------------
    // Handler: Mouse Movement (Pixel Tracking)
    // ---------------------------------------------------------------------------

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        // Handle panning
        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
            return;
        }

        // Calculate actual pixel position
        if (onMouseMove) {
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.floor((e.clientX - rect.left) * scaleX);
            const y = Math.floor((e.clientY - rect.top) * scaleY);
            onMouseMove(x, y);
        }
    }, [onMouseMove, isPanning, lastMousePos]);

    const handleMouseLeave = useCallback(() => {
        setIsPanning(false);
        onMouseLeave?.();
    }, [onMouseLeave]);

    // ---------------------------------------------------------------------------
    // Handler: Zoom (Mouse Wheel)
    // ---------------------------------------------------------------------------

    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.max(0.25, Math.min(5, prev * delta)));
    }, []);

    // ---------------------------------------------------------------------------
    // Handler: Pan (Middle Mouse or Space + Drag)
    // ---------------------------------------------------------------------------

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // ---------------------------------------------------------------------------
    // Handler: Reset Zoom
    // ---------------------------------------------------------------------------

    const handleReset = useCallback(() => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    const canvasStyle: React.CSSProperties = {
        transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
        cursor: isPanning ? 'grabbing' : (zoom > 1 ? 'grab' : 'crosshair'),
    };

    return (
        <div
            className="image-canvas-container"
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                className="image-canvas"
                style={canvasStyle}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />

            {/* Zoom Controls */}
            {imageData && (
                <div className="zoom-controls">
                    <button
                        className="zoom-btn"
                        onClick={() => setZoom(z => Math.min(5, z * 1.25))}
                        title="Zoom In"
                    >
                        +
                    </button>
                    <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                    <button
                        className="zoom-btn"
                        onClick={() => setZoom(z => Math.max(0.25, z / 1.25))}
                        title="Zoom Out"
                    >
                        −
                    </button>
                    <button
                        className="zoom-btn reset"
                        onClick={handleReset}
                        title="Reset Zoom"
                    >
                        ⟲
                    </button>
                </div>
            )}

            {/* Indicator when viewing original */}
            {showOriginal && imageData && (
                <div className="original-indicator">
                    <span>Viewing Original</span>
                </div>
            )}

            {/* Pan hint */}
            {zoom > 1 && (
                <div className="pan-hint">
                    Alt + Drag to pan
                </div>
            )}
        </div>
    );
};

export default ImageCanvas;
