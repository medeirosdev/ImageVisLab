/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * Sidebar component containing filter controls and navigation.
 * Displays available transformations with their mathematical formulas.
 * 
 * @module Sidebar
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React from 'react';
import type { FilterType, FilterParams } from '../../types';
import './Sidebar.css';

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
    /** Currently active filter */
    activeFilter: FilterType;
    /** Current filter parameters */
    filterParams: FilterParams;
    /** Callback when filter selection changes */
    onFilterChange: (filter: FilterType) => void;
    /** Callback when a filter parameter changes */
    onParamChange: (param: keyof FilterParams, value: number) => void;
    /** Callback to trigger image loading */
    onLoadImage: () => void;
    /** Callback to reset all filters */
    onReset: () => void;
    /** Whether an image is currently loaded */
    hasImage: boolean;
}

interface FilterOption {
    id: FilterType;
    name: string;
    description: string;
    formula?: string;
    params?: {
        key: keyof FilterParams;
        label: string;
        min: number;
        max: number;
        step: number;
    }[];
}

// =============================================================================
// Filter Definitions
// =============================================================================

/**
 * Configuration for all available filters.
 * Each filter has a name, description, optional formula, and optional parameters.
 */
const FILTERS: FilterOption[] = [
    {
        id: 'none',
        name: 'Original',
        description: 'No processing applied',
    },
    {
        id: 'negative',
        name: 'Negative',
        description: 'Inverts intensity values',
        formula: 's = L - 1 - r',
    },
    {
        id: 'gamma',
        name: 'Gamma Correction',
        description: 'Adjusts brightness curve',
        formula: 's = c * r^g',
        params: [
            { key: 'gamma', label: 'g (Gamma)', min: 0.1, max: 5, step: 0.1 },
            { key: 'gammaConstant', label: 'c (Constant)', min: 0.1, max: 2, step: 0.1 },
        ],
    },
    {
        id: 'log',
        name: 'Logarithmic',
        description: 'Expands dark tones',
        formula: 's = c * log(1 + r)',
        params: [
            { key: 'logConstant', label: 'c (Constant)', min: 0.1, max: 3, step: 0.1 },
        ],
    },
    {
        id: 'quantization',
        name: 'Quantization',
        description: 'Reduces gray levels',
        formula: 'k bits = 2^k levels',
        params: [
            { key: 'quantizationLevels', label: 'Levels', min: 2, max: 256, step: 1 },
        ],
    },
    {
        id: 'sampling',
        name: 'Subsampling',
        description: 'Reduces spatial resolution',
        formula: 'Pixelation NxN',
        params: [
            { key: 'samplingFactor', label: 'Factor', min: 1, max: 32, step: 1 },
        ],
    },
    {
        id: 'equalization',
        name: 'Equalization',
        description: 'Equalizes histogram',
        formula: 's_k = (L-1) * CDF(r_k)',
    },
];

// =============================================================================
// Component
// =============================================================================

export const Sidebar: React.FC<SidebarProps> = ({
    activeFilter,
    filterParams,
    onFilterChange,
    onParamChange,
    onLoadImage,
    onReset,
    hasImage,
}) => {
    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <h1 className="sidebar-title">
                    <span className="gradient-text">PDI</span> Simulator
                </h1>
                <p className="sidebar-subtitle">Digital Image Processing</p>
            </div>

            {/* Image Actions Section */}
            <div className="sidebar-section">
                <h3 className="section-title">Image</h3>
                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={onLoadImage}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17,8 12,3 7,8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Load Image
                    </button>
                    {hasImage && (
                        <button className="btn btn-secondary" onClick={onReset}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Section */}
            <div className="sidebar-section filters-section">
                <h3 className="section-title">Transformations</h3>
                <div className="filters-list">
                    {FILTERS.map((filter) => (
                        <div
                            key={filter.id}
                            className={`filter-card ${activeFilter === filter.id ? 'active' : ''} ${!hasImage && filter.id !== 'none' ? 'disabled' : ''}`}
                            onClick={() => hasImage && onFilterChange(filter.id)}
                        >
                            <div className="filter-header">
                                <span className="filter-name">{filter.name}</span>
                                {activeFilter === filter.id && (
                                    <span className="filter-active-badge">Active</span>
                                )}
                            </div>
                            <p className="filter-description">{filter.description}</p>

                            {filter.formula && (
                                <code className="filter-formula">{filter.formula}</code>
                            )}

                            {/* Filter Parameters (sliders) */}
                            {filter.params && activeFilter === filter.id && (
                                <div className="filter-params">
                                    {filter.params.map((param) => (
                                        <div key={param.key} className="param-control">
                                            <label className="param-label">
                                                {param.label}: <span className="param-value">{filterParams[param.key]}</span>
                                            </label>
                                            <input
                                                type="range"
                                                className="param-slider"
                                                min={param.min}
                                                max={param.max}
                                                step={param.step}
                                                value={filterParams[param.key]}
                                                onChange={(e) => onParamChange(param.key, parseFloat(e.target.value))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <p className="mono">ImageVisLab v1.0</p>
            </div>
        </aside>
    );
};

export default Sidebar;
