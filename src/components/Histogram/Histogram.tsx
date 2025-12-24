/**
 * ImageVisLab - Histogram Component
 * 
 * Visual histogram display showing frequency distribution
 * for R, G, B channels and grayscale.
 * 
 * @module Histogram
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useMemo } from 'react';
import './Histogram.css';

// =============================================================================
// Types
// =============================================================================

interface HistogramData {
    r: number[];
    g: number[];
    b: number[];
    gray: number[];
}

interface HistogramProps {
    /** Histogram data for all channels */
    data: HistogramData | null;
    /** Which channel to display: 'r', 'g', 'b', 'gray', or 'all' */
    channel?: 'r' | 'g' | 'b' | 'gray' | 'all';
    /** Height of the histogram in pixels */
    height?: number;
}

// =============================================================================
// Component
// =============================================================================

export const Histogram: React.FC<HistogramProps> = ({
    data,
    channel = 'gray',
    height = 100,
}) => {
    // ---------------------------------------------------------------------------
    // Memoized: Normalized Data
    // ---------------------------------------------------------------------------

    const normalizedData = useMemo(() => {
        if (!data) return null;

        const normalize = (arr: number[]) => {
            const max = Math.max(...arr);
            if (max === 0) return arr.map(() => 0);
            return arr.map(v => v / max);
        };

        return {
            r: normalize(data.r),
            g: normalize(data.g),
            b: normalize(data.b),
            gray: normalize(data.gray),
        };
    }, [data]);

    // ---------------------------------------------------------------------------
    // Empty State
    // ---------------------------------------------------------------------------

    if (!normalizedData) {
        return (
            <div className="histogram empty" style={{ height }}>
                <p>No image loaded</p>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Render Single Channel
    // ---------------------------------------------------------------------------

    const renderChannel = (
        channelData: number[],
        channelName: 'r' | 'g' | 'b' | 'gray',
        showLabel: boolean = true
    ) => (
        <div className={`histogram-channel histogram-${channelName}`}>
            {showLabel && <span className="channel-label">{channelName.toUpperCase()}</span>}
            <div className="histogram-bars" style={{ height }}>
                {channelData.map((value, i) => (
                    <div
                        key={i}
                        className="histogram-bar"
                        style={{ height: `${value * 100}%` }}
                        title={`${i}: ${data?.[channelName]?.[i] || 0}`}
                    />
                ))}
            </div>
        </div>
    );

    // ---------------------------------------------------------------------------
    // Render All Channels (Overlay)
    // ---------------------------------------------------------------------------

    if (channel === 'all') {
        return (
            <div className="histogram histogram-overlay">
                <div className="histogram-bars overlay" style={{ height }}>
                    {normalizedData.r.map((_, i) => (
                        <div key={i} className="histogram-bar-group">
                            <div
                                className="histogram-bar bar-r"
                                style={{ height: `${normalizedData.r[i] * 100}%` }}
                            />
                            <div
                                className="histogram-bar bar-g"
                                style={{ height: `${normalizedData.g[i] * 100}%` }}
                            />
                            <div
                                className="histogram-bar bar-b"
                                style={{ height: `${normalizedData.b[i] * 100}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Render Single Channel
    // ---------------------------------------------------------------------------

    return (
        <div className="histogram">
            {renderChannel(normalizedData[channel], channel, false)}
        </div>
    );
};

export default Histogram;
