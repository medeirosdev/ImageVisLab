/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * PixelInspector component for displaying pixel information and magnification.
 * Shows pixel neighborhood, RGB channel values, and position data.
 * 
 * @module PixelInspector
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React from 'react';
import './PixelInspector.css';

// =============================================================================
// Types
// =============================================================================

interface PixelInfo {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    a: number;
    gray: number;
    hex: string;
}

interface PixelInspectorProps {
    /** Current pixel information under the cursor */
    pixelInfo: PixelInfo | null;
    /** Array of neighboring pixel data for magnifier */
    neighborhood?: Array<{ x: number; y: number; r: number; g: number; b: number }>;
    /** Width of the current image */
    imageWidth?: number;
    /** Height of the current image */
    imageHeight?: number;
}

// =============================================================================
// Component
// =============================================================================

export const PixelInspector: React.FC<PixelInspectorProps> = ({
    pixelInfo,
    neighborhood = [],
    imageWidth = 0,
    imageHeight = 0,
}) => {
    // ---------------------------------------------------------------------------
    // Empty State
    // ---------------------------------------------------------------------------

    if (!pixelInfo) {
        return (
            <div className="pixel-inspector empty">
                <div className="inspector-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <p>Hover over the image to inspect pixels</p>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="pixel-inspector">
            {/* Magnifier: Neighborhood Visualization */}
            <div className="inspector-magnifier">
                <h4 className="inspector-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Magnifier (Neighborhood)
                </h4>
                <div className="magnifier-grid">
                    {neighborhood.length > 0 ? (
                        neighborhood.map((pixel, i) => (
                            <div
                                key={i}
                                className={`magnifier-pixel ${pixel.x === 0 && pixel.y === 0 ? 'center' : ''}`}
                                style={{ backgroundColor: `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})` }}
                                title={`(${pixel.x}, ${pixel.y}): RGB(${pixel.r}, ${pixel.g}, ${pixel.b})`}
                            />
                        ))
                    ) : (
                        <div className="magnifier-loading">Loading...</div>
                    )}
                </div>
            </div>

            {/* Pixel Information Panel */}
            <div className="inspector-info">
                <h4 className="inspector-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                    </svg>
                    Pixel Info
                </h4>

                <div className="info-grid">
                    {/* Position */}
                    <div className="info-item">
                        <span className="info-label">Position</span>
                        <span className="info-value mono">
                            ({pixelInfo.x}, {pixelInfo.y})
                        </span>
                    </div>

                    {/* Image Dimensions */}
                    <div className="info-item">
                        <span className="info-label">Image</span>
                        <span className="info-value mono">
                            {imageWidth} x {imageHeight}
                        </span>
                    </div>

                    {/* Color Preview */}
                    <div className="info-item color-preview-container">
                        <span className="info-label">Color</span>
                        <div className="color-preview" style={{ backgroundColor: pixelInfo.hex }}>
                            <span className="hex-value">{pixelInfo.hex}</span>
                        </div>
                    </div>
                </div>

                {/* RGB Channel Bars */}
                <div className="channels-section">
                    <div className="channel channel-r">
                        <span className="channel-label">R</span>
                        <div className="channel-bar">
                            <div
                                className="channel-fill"
                                style={{ width: `${(pixelInfo.r / 255) * 100}%` }}
                            />
                        </div>
                        <span className="channel-value mono">{pixelInfo.r}</span>
                    </div>

                    <div className="channel channel-g">
                        <span className="channel-label">G</span>
                        <div className="channel-bar">
                            <div
                                className="channel-fill"
                                style={{ width: `${(pixelInfo.g / 255) * 100}%` }}
                            />
                        </div>
                        <span className="channel-value mono">{pixelInfo.g}</span>
                    </div>

                    <div className="channel channel-b">
                        <span className="channel-label">B</span>
                        <div className="channel-bar">
                            <div
                                className="channel-fill"
                                style={{ width: `${(pixelInfo.b / 255) * 100}%` }}
                            />
                        </div>
                        <span className="channel-value mono">{pixelInfo.b}</span>
                    </div>

                    <div className="channel channel-gray">
                        <span className="channel-label">Gray</span>
                        <div className="channel-bar">
                            <div
                                className="channel-fill"
                                style={{ width: `${(pixelInfo.gray / 255) * 100}%` }}
                            />
                        </div>
                        <span className="channel-value mono">{pixelInfo.gray}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PixelInspector;
