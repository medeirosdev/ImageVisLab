/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * PixelInspector component with tabbed interface.
 * Tab 1: Pixel Info - Magnifier with distance visualization, RGB values
 * Tab 2: Histogram - Original vs Processed comparison
 * 
 * @module PixelInspector
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useState, useMemo } from 'react';
import { Histogram } from '../Histogram';
import { isInNeighborhood, calculateDistance } from '../../utils/imageFilters';
import type { NeighborType, DistanceMetric } from '../../types';
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
    pixelInfo: PixelInfo | null;
    neighborhood?: Array<{ x: number; y: number; r: number; g: number; b: number }>;
    imageWidth?: number;
    imageHeight?: number;
    histogramData?: HistogramData | null;
    originalHistogramData?: HistogramData | null;
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
    const [neighborType, setNeighborType] = useState<NeighborType>('N8');
    const [distanceMetric, setDistanceMetric] = useState<DistanceMetric>('euclidean');
    const [showNeighborhood, setShowNeighborhood] = useState(true);
    const [showDistanceOverlay, setShowDistanceOverlay] = useState(true);

    // Memoized: Calculate distances for neighbors
    const neighborhoodWithDistance = useMemo(() => {
        const maxDistance = Math.sqrt(2 * 5 * 5); // Max distance for radius 5
        return neighborhood.map(pixel => {
            const distance = calculateDistance(0, 0, pixel.x, pixel.y, distanceMetric);
            return {
                ...pixel,
                distance,
                isNeighbor: isInNeighborhood(pixel.x, pixel.y, neighborType),
                // Normalize for color (0-1, inverted so closer = brighter)
                distanceNormalized: 1 - Math.min(distance / maxDistance, 1),
            };
        });
    }, [neighborhood, distanceMetric, neighborType]);

    // Get only immediate neighbors (N4/ND/N8 within 1 pixel)
    const immediateNeighbors = useMemo(() => {
        return neighborhoodWithDistance
            .filter(p => Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && !(p.x === 0 && p.y === 0))
            .sort((a, b) => a.distance - b.distance);
    }, [neighborhoodWithDistance]);

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
                {/* Magnifier with Controls */}
                <div className="info-section magnifier-section">
                    <div className="section-header">
                        <h4 className="section-title">Magnifier</h4>
                        <div className="toggle-group">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={showNeighborhood}
                                    onChange={(e) => setShowNeighborhood(e.target.checked)}
                                />
                                N
                            </label>
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={showDistanceOverlay}
                                    onChange={(e) => setShowDistanceOverlay(e.target.checked)}
                                />
                                D
                            </label>
                        </div>
                    </div>

                    {/* Neighborhood Type Selector */}
                    {showNeighborhood && (
                        <div className="neighbor-selector">
                            {(['N4', 'ND', 'N8'] as NeighborType[]).map((type) => (
                                <button
                                    key={type}
                                    className={`neighbor-btn ${neighborType === type ? 'active' : ''}`}
                                    onClick={() => setNeighborType(type)}
                                    title={type === 'N4' ? '4-connected' : type === 'ND' ? 'Diagonal' : '8-connected'}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Magnifier Grid */}
                    <div className="magnifier-grid">
                        {neighborhoodWithDistance.map((pixel, i) => {
                            const isCenter = pixel.x === 0 && pixel.y === 0;
                            const highlight = showNeighborhood && pixel.isNeighbor;
                            const showDist = showDistanceOverlay && !isCenter;

                            // Distance overlay opacity
                            const overlayOpacity = showDist ? 0.7 * pixel.distanceNormalized : 0;

                            return (
                                <div
                                    key={i}
                                    className={`magnifier-pixel ${isCenter ? 'center' : ''} ${highlight ? 'neighbor' : ''}`}
                                    style={{
                                        backgroundColor: `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`,
                                    }}
                                    title={`(${pixel.x}, ${pixel.y}) D=${pixel.distance.toFixed(2)}`}
                                >
                                    {/* Distance overlay */}
                                    {showDist && (
                                        <div
                                            className="distance-overlay"
                                            style={{
                                                opacity: overlayOpacity,
                                            }}
                                        />
                                    )}
                                    {/* Distance number */}
                                    {showDist && Math.abs(pixel.x) <= 2 && Math.abs(pixel.y) <= 2 && (
                                        <span className="distance-number">
                                            {pixel.distance.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Distance Metric Selector */}
                <div className="info-section distance-section">
                    <h4 className="section-title">Distance Metric</h4>
                    <div className="distance-selector">
                        {([
                            { id: 'euclidean', label: 'Euclidean', formula: '√(Δx² + Δy²)' },
                            { id: 'cityBlock', label: 'City-block (D4)', formula: '|Δx| + |Δy|' },
                            { id: 'chessboard', label: 'Chessboard (D8)', formula: 'max(|Δx|, |Δy|)' },
                        ] as { id: DistanceMetric; label: string; formula: string }[]).map((metric) => (
                            <button
                                key={metric.id}
                                className={`distance-btn ${distanceMetric === metric.id ? 'active' : ''}`}
                                onClick={() => setDistanceMetric(metric.id)}
                                title={metric.formula}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Neighbor Distances Panel */}
                <div className="info-section neighbor-distances-section">
                    <h4 className="section-title">Neighbor Distances</h4>
                    <div className="neighbor-distances-grid">
                        {immediateNeighbors.map((neighbor, i) => {
                            const isN4 = neighbor.x === 0 || neighbor.y === 0;
                            const isND = neighbor.x !== 0 && neighbor.y !== 0;
                            return (
                                <div
                                    key={i}
                                    className={`neighbor-distance-item ${isN4 ? 'n4' : ''} ${isND ? 'nd' : ''}`}
                                    style={{ backgroundColor: `rgb(${neighbor.r}, ${neighbor.g}, ${neighbor.b})` }}
                                >
                                    <span className="neighbor-pos">({neighbor.x},{neighbor.y})</span>
                                    <span className="neighbor-dist">{neighbor.distance.toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pixel Data */}
                <div className="info-section pixel-data-section">
                    <h4 className="section-title">Pixel Data</h4>

                    <div className="pixel-data-row">
                        <span className="data-label">Position:</span>
                        <span className="data-value mono">({pixelInfo.x}, {pixelInfo.y})</span>
                        <span className="data-label">Color:</span>
                        <div
                            className="color-swatch"
                            style={{ backgroundColor: pixelInfo.hex }}
                            title={pixelInfo.hex}
                        />
                    </div>

                    {/* RGB Channels */}
                    <div className="channels-compact">
                        <div className="channel-compact channel-r">
                            <span>R</span>
                            <div className="channel-bar-mini">
                                <div style={{ width: `${(pixelInfo.r / 255) * 100}%` }} />
                            </div>
                            <span>{pixelInfo.r}</span>
                        </div>
                        <div className="channel-compact channel-g">
                            <span>G</span>
                            <div className="channel-bar-mini">
                                <div style={{ width: `${(pixelInfo.g / 255) * 100}%` }} />
                            </div>
                            <span>{pixelInfo.g}</span>
                        </div>
                        <div className="channel-compact channel-b">
                            <span>B</span>
                            <div className="channel-bar-mini">
                                <div style={{ width: `${(pixelInfo.b / 255) * 100}%` }} />
                            </div>
                            <span>{pixelInfo.b}</span>
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
