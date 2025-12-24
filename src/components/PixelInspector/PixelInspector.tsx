/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * PixelInspector component with tabbed interface.
 * Tab 1: Pixel Info - Magnifier, RGB values, position
 * Tab 2: Histogram - Original vs Processed comparison
 * 
 * @module PixelInspector
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useState } from 'react';
import { Histogram } from '../Histogram';
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

interface HistogramData {
    r: number[];
    g: number[];
    b: number[];
    gray: number[];
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
    /** Histogram data for the processed image */
    histogramData?: HistogramData | null;
    /** Histogram data for the original image */
    originalHistogramData?: HistogramData | null;
    /** Whether an image is loaded */
    hasImage?: boolean;
}

type InspectorTab = 'info' | 'histogram';
type HistogramChannel = 'gray' | 'r' | 'g' | 'b' | 'all';

// =============================================================================
// Component
// =============================================================================

export const PixelInspector: React.FC<PixelInspectorProps> = ({
    pixelInfo,
    neighborhood = [],
    imageWidth = 0,
    imageHeight = 0,
    histogramData = null,
    originalHistogramData = null,
    hasImage = false,
}) => {
    const [activeTab, setActiveTab] = useState<InspectorTab>('info');
    const [histogramChannel, setHistogramChannel] = useState<HistogramChannel>('gray');

    // ---------------------------------------------------------------------------
    // Render: Tab Navigation
    // ---------------------------------------------------------------------------

    const renderTabNav = () => (
        <div className="inspector-tabs">
            <button
                className={`inspector-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
                Pixel Info
            </button>
            <button
                className={`inspector-tab ${activeTab === 'histogram' ? 'active' : ''}`}
                onClick={() => setActiveTab('histogram')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                </svg>
                Histogram
            </button>
        </div>
    );

    // ---------------------------------------------------------------------------
    // Render: Pixel Info Tab
    // ---------------------------------------------------------------------------

    const renderInfoTab = () => {
        if (!hasImage) {
            return (
                <div className="tab-content-empty">
                    <p>Load an image to see pixel information</p>
                </div>
            );
        }

        if (!pixelInfo) {
            return (
                <div className="tab-content info-tab">
                    <div className="info-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <p>Hover over the image to inspect pixels</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="tab-content info-tab">
                {/* Magnifier */}
                <div className="info-section magnifier-section">
                    <h4 className="section-title">Magnifier (11x11)</h4>
                    <div className="magnifier-grid">
                        {neighborhood.map((pixel, i) => (
                            <div
                                key={i}
                                className={`magnifier-pixel ${pixel.x === 0 && pixel.y === 0 ? 'center' : ''}`}
                                style={{ backgroundColor: `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})` }}
                                title={`(${pixel.x}, ${pixel.y}): RGB(${pixel.r}, ${pixel.g}, ${pixel.b})`}
                            />
                        ))}
                    </div>
                </div>

                {/* Pixel Data */}
                <div className="info-section pixel-data-section">
                    <h4 className="section-title">Pixel Data</h4>

                    <div className="pixel-data-grid">
                        <div className="data-item">
                            <span className="data-label">Position</span>
                            <span className="data-value mono">({pixelInfo.x}, {pixelInfo.y})</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Image Size</span>
                            <span className="data-value mono">{imageWidth} x {imageHeight}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Hex Color</span>
                            <span className="data-value mono">{pixelInfo.hex}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Grayscale</span>
                            <span className="data-value mono">{pixelInfo.gray}</span>
                        </div>
                    </div>

                    {/* Color Preview */}
                    <div className="color-preview-large" style={{ backgroundColor: pixelInfo.hex }}>
                        <span className="color-label">{pixelInfo.hex}</span>
                    </div>

                    {/* RGB Channels */}
                    <div className="channels-grid">
                        <div className="channel-item channel-r">
                            <span className="channel-name">R</span>
                            <div className="channel-bar-container">
                                <div className="channel-bar-fill" style={{ width: `${(pixelInfo.r / 255) * 100}%` }} />
                            </div>
                            <span className="channel-value">{pixelInfo.r}</span>
                        </div>
                        <div className="channel-item channel-g">
                            <span className="channel-name">G</span>
                            <div className="channel-bar-container">
                                <div className="channel-bar-fill" style={{ width: `${(pixelInfo.g / 255) * 100}%` }} />
                            </div>
                            <span className="channel-value">{pixelInfo.g}</span>
                        </div>
                        <div className="channel-item channel-b">
                            <span className="channel-name">B</span>
                            <div className="channel-bar-container">
                                <div className="channel-bar-fill" style={{ width: `${(pixelInfo.b / 255) * 100}%` }} />
                            </div>
                            <span className="channel-value">{pixelInfo.b}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ---------------------------------------------------------------------------
    // Render: Histogram Tab
    // ---------------------------------------------------------------------------

    const renderHistogramTab = () => {
        if (!hasImage || !histogramData) {
            return (
                <div className="tab-content-empty">
                    <p>Load an image to see histogram</p>
                </div>
            );
        }

        return (
            <div className="tab-content histogram-tab">
                {/* Channel Selector */}
                <div className="histogram-channel-selector">
                    {(['gray', 'r', 'g', 'b', 'all'] as HistogramChannel[]).map((ch) => (
                        <button
                            key={ch}
                            className={`channel-btn ${histogramChannel === ch ? 'active' : ''} channel-${ch}`}
                            onClick={() => setHistogramChannel(ch)}
                        >
                            {ch === 'all' ? 'RGB' : ch.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Histogram Comparison */}
                <div className="histogram-comparison">
                    {/* Original Histogram */}
                    {originalHistogramData && (
                        <div className="histogram-panel">
                            <h4 className="histogram-label">Original</h4>
                            <Histogram
                                data={originalHistogramData}
                                channel={histogramChannel}
                                height={120}
                            />
                        </div>
                    )}

                    {/* Processed Histogram */}
                    <div className="histogram-panel">
                        <h4 className="histogram-label">
                            {originalHistogramData ? 'Processed' : 'Current'}
                        </h4>
                        <Histogram
                            data={histogramData}
                            channel={histogramChannel}
                            height={120}
                        />
                    </div>
                </div>
            </div>
        );
    };

    // ---------------------------------------------------------------------------
    // Main Render
    // ---------------------------------------------------------------------------

    return (
        <div className="pixel-inspector">
            {renderTabNav()}
            {activeTab === 'info' ? renderInfoTab() : renderHistogramTab()}
        </div>
    );
};

export default PixelInspector;
