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

import React, { useState } from 'react';
import type { FilterType, FilterParams } from '../../types';
import { LaTeXFormula } from '../LaTeXFormula';
import './Sidebar.css';

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
    activeFilter: FilterType;
    filterParams: FilterParams;
    onFilterChange: (filter: FilterType) => void;
    onParamChange: (param: keyof FilterParams, value: number | string | number[][]) => void;
    onLoadImage: () => void;
    onLoadSample: (type: 'gradient' | 'checkerboard' | 'noise') => void;
    onDownload: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
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

interface FilterCategory {
    id: string;
    name: string;
    filters: FilterOption[];
}

// =============================================================================
// Filter Definitions by Category
// =============================================================================

const FILTER_CATEGORIES: FilterCategory[] = [
    {
        id: 'point',
        name: 'Point Operations',
        filters: [
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
                name: 'Gamma',
                description: 'Adjusts brightness curve',
                formula: 's = c \\cdot r^{\\gamma}',
                params: [
                    { key: 'gamma', label: 'γ', min: 0.1, max: 5, step: 0.1 },
                    { key: 'gammaConstant', label: 'c', min: 0.1, max: 2, step: 0.1 },
                ],
            },
            {
                id: 'log',
                name: 'Logarithmic',
                description: 'Expands dark tones',
                formula: 's = c \\cdot \\log(1 + r)',
                params: [
                    { key: 'logConstant', label: 'c', min: 0.1, max: 3, step: 0.1 },
                ],
            },
            {
                id: 'quantization',
                name: 'Quantization',
                description: 'Reduces gray levels',
                formula: '2^k \\text{ levels}',
                params: [
                    { key: 'quantizationLevels', label: 'Levels', min: 2, max: 256, step: 1 },
                ],
            },
            {
                id: 'sampling',
                name: 'Subsampling',
                description: 'Reduces spatial resolution',
                formula: 'n \\times n',
                params: [
                    { key: 'samplingFactor', label: 'N', min: 1, max: 32, step: 1 },
                ],
            },
            {
                id: 'equalization',
                name: 'Equalization',
                description: 'Equalizes histogram',
                formula: 's_k = (L-1) \\cdot \\text{CDF}',
            },
        ],
    },
    {
        id: 'spatial',
        name: 'Spatial Filters',
        filters: [
            {
                id: 'boxBlur',
                name: 'Box Blur',
                description: 'Mean filter (smoothing)',
                formula: '\\frac{1}{n^2} \\sum f',
                params: [
                    { key: 'kernelSize', label: 'Size', min: 3, max: 7, step: 2 },
                ],
            },
            {
                id: 'gaussianBlur',
                name: 'Gaussian Blur',
                description: 'Weighted smoothing',
                formula: 'G(x,y) = e^{-\\frac{x^2+y^2}{2\\sigma^2}}',
                params: [
                    { key: 'kernelSize', label: 'Size', min: 3, max: 7, step: 2 },
                    { key: 'gaussianSigma', label: 'σ', min: 0.5, max: 3, step: 0.1 },
                ],
            },
            {
                id: 'sharpen',
                name: 'Sharpen',
                description: 'Enhances edges',
                formula: 'f + k(f - \\bar{f})',
            },
            {
                id: 'laplacian',
                name: 'Laplacian',
                description: 'Edge detection',
                formula: '\\nabla^2 f',
            },
        ],
    },
    {
        id: 'morphology',
        name: 'Morphology',
        filters: [
            {
                id: 'threshold',
                name: 'Binarization',
                description: 'Converts to black & white',
                formula: 's = \\begin{cases} 0 & r < T \\\\ 255 & r \\geq T \\end{cases}',
                params: [
                    { key: 'threshold', label: 'T', min: 0, max: 255, step: 1 },
                ],
            },
            {
                id: 'erosion',
                name: 'Erosion',
                description: 'Shrinks white regions',
                formula: 'A \\ominus B',
                params: [
                    { key: 'threshold', label: 'T', min: 0, max: 255, step: 1 },
                ],
            },
            {
                id: 'dilation',
                name: 'Dilation',
                description: 'Expands white regions',
                formula: 'A \\oplus B',
                params: [
                    { key: 'threshold', label: 'T', min: 0, max: 255, step: 1 },
                ],
            },
            {
                id: 'opening',
                name: 'Opening',
                description: 'Removes small white noise',
                formula: 'A \\circ B = (A \\ominus B) \\oplus B',
                params: [
                    { key: 'threshold', label: 'T', min: 0, max: 255, step: 1 },
                ],
            },
            {
                id: 'closing',
                name: 'Closing',
                description: 'Fills small black holes',
                formula: 'A \\bullet B = (A \\oplus B) \\ominus B',
                params: [
                    { key: 'threshold', label: 'T', min: 0, max: 255, step: 1 },
                ],
            },
        ],
    },
    {
        id: 'custom',
        name: 'Custom Operations',
        filters: [
            {
                id: 'customFormula',
                name: 'Custom Formula',
                description: 'Apply your own formula',
                formula: 's = f(r, g, b, x, y)',
            },
            {
                id: 'customKernel',
                name: 'Custom Kernel',
                description: 'Apply your own convolution matrix',
                formula: 'g = f * h',
            },
        ],
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
    onLoadSample,
    onDownload,
    onReset,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    hasImage,
}) => {
    // Track which categories are expanded
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['point', 'spatial'])
    );

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <h1 className="sidebar-title">
                    <span className="gradient-text">ImageVisLab</span> v1.0
                </h1>
                <p className="sidebar-subtitle">PDI Simulator</p>
            </div>

            {/* Image Actions */}
            <div className="sidebar-section">
                <h3 className="section-title">Image</h3>
                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={onLoadImage}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17,8 12,3 7,8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Load
                    </button>
                    <button className="btn btn-secondary" onClick={onReset} disabled={!hasImage}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        Reset
                    </button>
                    <button className="btn btn-secondary" onClick={onDownload} disabled={!hasImage} title="Download processed image">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Save
                    </button>
                </div>

                {/* Undo/Redo */}
                <div className="undo-redo-buttons">
                    <button
                        className="btn btn-icon"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        ↶
                    </button>
                    <button
                        className="btn btn-icon"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                    >
                        ↷
                    </button>
                </div>

                {/* Sample Images */}
                <div className="sample-images">
                    <span className="sample-label">Samples:</span>
                    <button className="sample-btn" onClick={() => onLoadSample('gradient')} title="Gradient">
                        🌓
                    </button>
                    <button className="sample-btn" onClick={() => onLoadSample('checkerboard')} title="Checkerboard">
                        ▦
                    </button>
                    <button className="sample-btn" onClick={() => onLoadSample('noise')} title="Noise">
                        ◻
                    </button>
                </div>
            </div>

            {/* Filter Categories */}
            <div className="sidebar-section filters-section">
                <h3 className="section-title">Transformations</h3>

                {FILTER_CATEGORIES.map((category) => (
                    <div key={category.id} className="filter-category">
                        {/* Category Header */}
                        <button
                            className={`category-header ${expandedCategories.has(category.id) ? 'expanded' : ''}`}
                            onClick={() => toggleCategory(category.id)}
                        >
                            <span className="category-name">{category.name}</span>
                            <svg
                                className="category-chevron"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="6,9 12,15 18,9" />
                            </svg>
                        </button>

                        {/* Category Filters */}
                        {expandedCategories.has(category.id) && (
                            <div className="category-filters">
                                {category.filters.map((filter) => (
                                    <div
                                        key={filter.id}
                                        className={`filter-card ${activeFilter === filter.id ? 'active' : ''} ${!hasImage && filter.id !== 'none' ? 'disabled' : ''}`}
                                        onClick={() => hasImage && onFilterChange(filter.id)}
                                    >
                                        <div className="filter-header">
                                            <span className="filter-name">{filter.name}</span>
                                            {activeFilter === filter.id && (
                                                <span className="filter-active-badge">✓</span>
                                            )}
                                        </div>

                                        {filter.formula && (
                                            <div className="filter-formula">
                                                <LaTeXFormula formula={filter.formula} />
                                            </div>
                                        )}

                                        {/* Parameters */}
                                        {filter.params && activeFilter === filter.id && (
                                            <div className="filter-params">
                                                {filter.params.map((param) => {
                                                    const value = filterParams[param.key];
                                                    // Only render slider for numeric values
                                                    if (typeof value !== 'number') return null;
                                                    return (
                                                        <div key={param.key} className="param-control">
                                                            <label className="param-label">
                                                                {param.label}: <span className="param-value">{value}</span>
                                                            </label>
                                                            <input
                                                                type="range"
                                                                className="param-slider"
                                                                min={param.min}
                                                                max={param.max}
                                                                step={param.step}
                                                                value={value}
                                                                onChange={(e) => onParamChange(param.key, parseFloat(e.target.value))}
                                                                title={`${param.label}: ${value}`}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Custom Formula Editor */}
                                        {filter.id === 'customFormula' && activeFilter === 'customFormula' && (
                                            <div className="custom-editor">
                                                <label className="editor-label">Formula:</label>
                                                <input
                                                    type="text"
                                                    className="formula-input"
                                                    value={filterParams.customFormula}
                                                    onChange={(e) => onParamChange('customFormula', e.target.value)}
                                                    placeholder="255 - r"
                                                />
                                                <div className="formula-help">
                                                    <small>Variables: r, g, b (pixel values), x, y (position), w, h (size)</small>
                                                    <small>Functions: sin, cos, sqrt, abs, min, max, floor, ceil</small>
                                                </div>
                                                <div className="formula-presets">
                                                    <button onClick={() => onParamChange('customFormula', '255 - r')}>Negative</button>
                                                    <button onClick={() => onParamChange('customFormula', '(r + g + b) / 3')}>Grayscale</button>
                                                    <button onClick={() => onParamChange('customFormula', 'r > 128 ? 255 : 0')}>Threshold</button>
                                                    <button onClick={() => onParamChange('customFormula', 'r * 1.5')}>Brighten</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Custom Kernel Editor */}
                                        {filter.id === 'customKernel' && activeFilter === 'customKernel' && (
                                            <div className="custom-editor">
                                                <label className="editor-label">Kernel (3x3):</label>
                                                <div className="kernel-grid">
                                                    {filterParams.customKernel.map((row, y) => (
                                                        <div key={y} className="kernel-row">
                                                            {row.map((val, x) => (
                                                                <input
                                                                    key={x}
                                                                    type="number"
                                                                    className="kernel-cell"
                                                                    value={val}
                                                                    onChange={(e) => {
                                                                        const newKernel = filterParams.customKernel.map((r, ry) =>
                                                                            r.map((v, rx) => (ry === y && rx === x ? parseFloat(e.target.value) || 0 : v))
                                                                        );
                                                                        onParamChange('customKernel', newKernel);
                                                                    }}
                                                                    step="0.1"
                                                                />
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="kernel-presets">
                                                    <button onClick={() => onParamChange('customKernel', [[0, 0, 0], [0, 1, 0], [0, 0, 0]])}>Identity</button>
                                                    <button onClick={() => onParamChange('customKernel', [[0, -1, 0], [-1, 5, -1], [0, -1, 0]])}>Sharpen</button>
                                                    <button onClick={() => onParamChange('customKernel', [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])}>Edge</button>
                                                    <button onClick={() => onParamChange('customKernel', [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]])}>Blur</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <p className="mono">ImageVisLab v1.0</p>
            </div>
        </aside>
    );
};

export default Sidebar;
