/**
 * ImageVisLab - Loading Skeleton Component
 * 
 * Displays animated skeleton placeholders during loading states.
 * 
 * @module LoadingSkeleton
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React from 'react';
import './LoadingSkeleton.css';

// =============================================================================
// Types
// =============================================================================

interface LoadingSkeletonProps {
    /** Type of skeleton to display */
    type: 'image' | 'text' | 'card';
    /** Width of skeleton (CSS value) */
    width?: string;
    /** Height of skeleton (CSS value) */
    height?: string;
    /** Optional message to display */
    message?: string;
}

// =============================================================================
// Component
// =============================================================================

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    type,
    width = '100%',
    height = '200px',
    message,
}) => {
    if (type === 'image') {
        return (
            <div className="skeleton-container" style={{ width, height }}>
                <div className="skeleton skeleton-image">
                    <div className="skeleton-icon">🖼️</div>
                    {message && <div className="skeleton-message">{message}</div>}
                    <div className="skeleton-shimmer" />
                </div>
            </div>
        );
    }

    if (type === 'card') {
        return (
            <div className="skeleton-container" style={{ width }}>
                <div className="skeleton skeleton-card">
                    <div className="skeleton-shimmer" />
                </div>
            </div>
        );
    }

    // Default: text skeleton
    return (
        <div className="skeleton-container" style={{ width }}>
            <div className="skeleton skeleton-text" style={{ height: '1em' }}>
                <div className="skeleton-shimmer" />
            </div>
        </div>
    );
};

// =============================================================================
// Processing Indicator Component
// =============================================================================

interface ProcessingIndicatorProps {
    /** Whether processing is active */
    isProcessing: boolean;
    /** Current filter being processed */
    filterName?: string;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
    isProcessing,
    filterName,
}) => {
    if (!isProcessing) return null;

    return (
        <div className="processing-indicator">
            <div className="processing-spinner" />
            <span className="processing-text">
                Applying {filterName || 'filter'}...
            </span>
        </div>
    );
};

export default LoadingSkeleton;
