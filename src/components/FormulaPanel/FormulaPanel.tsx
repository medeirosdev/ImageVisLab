/**
 * ImageVisLab - FormulaPanel Component
 * 
 * Displays mathematical formulas in LaTeX and provides
 * controls for live transformation animation.
 * 
 * @module FormulaPanel
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { FilterType, FilterParams } from '../../types';
import './FormulaPanel.css';

// =============================================================================
// Types
// =============================================================================

interface FormulaPanelProps {
    /** Currently active filter */
    activeFilter: FilterType;
    /** Current filter parameters */
    filterParams: FilterParams;
    /** Whether animation is currently playing */
    isAnimating: boolean;
    /** Animation mode: 'scanline' or 'pixel' */
    animationMode: 'scanline' | 'pixel';
    /** Animation speed (1-10) */
    animationSpeed: number;
    /** Animation progress (0-100) */
    animationProgress: number;
    /** Whether an image is loaded */
    hasImage: boolean;
    /** Callback to toggle animation */
    onToggleAnimation: () => void;
    /** Callback to change animation mode */
    onChangeMode: (mode: 'scanline' | 'pixel') => void;
    /** Callback to change animation speed */
    onChangeSpeed: (speed: number) => void;
    /** Callback to reset/stop animation */
    onResetAnimation: () => void;
}

// =============================================================================
// Formula Definitions
// =============================================================================

interface FormulaInfo {
    name: string;
    latex: string;
    description: string;
    variables?: { symbol: string; meaning: string; value?: string | number }[];
}

const getFormulaInfo = (
    filter: FilterType,
    params: FilterParams
): FormulaInfo => {
    switch (filter) {
        case 'negative':
            return {
                name: 'Negative Transformation',
                latex: 's = L - 1 - r',
                description: 'Inverts intensity values. Dark becomes bright and vice versa.',
                variables: [
                    { symbol: 's', meaning: 'Output intensity' },
                    { symbol: 'r', meaning: 'Input intensity' },
                    { symbol: 'L', meaning: 'Intensity levels', value: 256 },
                ],
            };

        case 'gamma':
            return {
                name: 'Power-Law (Gamma)',
                latex: `s = c \\cdot r^{\\gamma}`,
                description: 'Adjusts brightness curve. gamma < 1 brightens, gamma > 1 darkens.',
                variables: [
                    { symbol: 's', meaning: 'Output intensity' },
                    { symbol: 'r', meaning: 'Input (normalized)' },
                    { symbol: '\\gamma', meaning: 'Gamma exponent', value: params.gamma },
                    { symbol: 'c', meaning: 'Constant', value: params.gammaConstant },
                ],
            };

        case 'log':
            return {
                name: 'Logarithmic Transformation',
                latex: 's = c \\cdot \\log(1 + r)',
                description: 'Expands dark values, compresses bright values. Good for high dynamic range.',
                variables: [
                    { symbol: 's', meaning: 'Output intensity' },
                    { symbol: 'r', meaning: 'Input intensity' },
                    { symbol: 'c', meaning: 'Constant', value: params.logConstant },
                ],
            };

        case 'quantization':
            return {
                name: 'Intensity Quantization',
                latex: 's = \\text{round}\\left(\\frac{r}{k}\\right) \\cdot k',
                description: 'Reduces number of intensity levels, creating posterization effect.',
                variables: [
                    { symbol: 's', meaning: 'Output intensity' },
                    { symbol: 'r', meaning: 'Input intensity' },
                    { symbol: 'k', meaning: 'Step size', value: Math.round(255 / (params.quantizationLevels - 1)) },
                    { symbol: 'levels', meaning: 'Number of levels', value: params.quantizationLevels },
                ],
            };

        case 'sampling':
            return {
                name: 'Spatial Subsampling',
                latex: 's_{x,y} = r_{n \\cdot \\lfloor x/n \\rfloor,\\, n \\cdot \\lfloor y/n \\rfloor}',
                description: 'Reduces spatial resolution by averaging blocks of pixels.',
                variables: [
                    { symbol: 'n', meaning: 'Block size', value: params.samplingFactor },
                ],
            };

        case 'equalization':
            return {
                name: 'Histogram Equalization',
                latex: 's_k = (L-1) \\sum_{j=0}^{k} p_r(r_j)',
                description: 'Redistributes intensities for uniform histogram, enhancing contrast.',
                variables: [
                    { symbol: 's_k', meaning: 'Output at level k' },
                    { symbol: 'p_r(r_j)', meaning: 'Probability of intensity j' },
                    { symbol: 'L', meaning: 'Intensity levels', value: 256 },
                ],
            };

        // Spatial Filters (Convolution)
        case 'boxBlur':
            return {
                name: 'Box Blur (Mean Filter)',
                latex: 'g(x,y) = \\frac{1}{n^2} \\sum_{i,j} f(x+i, y+j)',
                description: 'Averages all pixels in the neighborhood. Simple smoothing filter.',
                variables: [
                    { symbol: 'g', meaning: 'Output pixel' },
                    { symbol: 'f', meaning: 'Input pixel' },
                    { symbol: 'n', meaning: 'Kernel size', value: params.kernelSize },
                ],
            };

        case 'gaussianBlur':
            return {
                name: 'Gaussian Blur',
                latex: 'G(x,y) = \\frac{1}{2\\pi\\sigma^2} e^{-\\frac{x^2+y^2}{2\\sigma^2}}',
                description: 'Weighted smoothing using Gaussian distribution. Preserves edges better than box blur.',
                variables: [
                    { symbol: 'G', meaning: 'Gaussian weight' },
                    { symbol: '\\sigma', meaning: 'Standard deviation', value: params.gaussianSigma },
                    { symbol: 'n', meaning: 'Kernel size', value: params.kernelSize },
                ],
            };

        case 'sharpen':
            return {
                name: 'Sharpening Filter',
                latex: 's = f + k(f - \\bar{f})',
                description: 'Enhances edges and fine details by amplifying high-frequency components.',
                variables: [
                    { symbol: 's', meaning: 'Sharpened pixel' },
                    { symbol: 'f', meaning: 'Original pixel' },
                    { symbol: '\\bar{f}', meaning: 'Blurred pixel' },
                ],
            };

        case 'laplacian':
            return {
                name: 'Laplacian (Edge Detection)',
                latex: '\\nabla^2 f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2}',
                description: 'Second derivative operator. Detects edges by finding zero-crossings.',
                variables: [
                    { symbol: '\\nabla^2', meaning: 'Laplacian operator' },
                    { symbol: 'f', meaning: 'Input intensity' },
                ],
            };

        // Morphology Operations
        case 'threshold':
            return {
                name: 'Binarization (Thresholding)',
                latex: 's = \\begin{cases} 0 & r < T \\\\ 255 & r \\geq T \\end{cases}',
                description: 'Converts grayscale to binary image. Pixels below threshold become black, above become white.',
                variables: [
                    { symbol: 's', meaning: 'Output (0 or 255)' },
                    { symbol: 'T', meaning: 'Threshold', value: params.threshold },
                ],
            };

        case 'erosion':
            return {
                name: 'Morphological Erosion',
                latex: 'A \\ominus B = \\{ z | B_z \\subseteq A \\}',
                description: 'Shrinks white regions. Useful for removing small white noise.',
                variables: [
                    { symbol: 'A', meaning: 'Binary image' },
                    { symbol: 'B', meaning: 'Structuring element (3×3)' },
                    { symbol: 'T', meaning: 'Threshold', value: params.threshold },
                ],
            };

        case 'dilation':
            return {
                name: 'Morphological Dilation',
                latex: 'A \\oplus B = \\{ z | (\\hat{B})_z \\cap A \\neq \\emptyset \\}',
                description: 'Expands white regions. Useful for filling small black holes.',
                variables: [
                    { symbol: 'A', meaning: 'Binary image' },
                    { symbol: 'B', meaning: 'Structuring element (3×3)' },
                    { symbol: 'T', meaning: 'Threshold', value: params.threshold },
                ],
            };

        case 'opening':
            return {
                name: 'Morphological Opening',
                latex: 'A \\circ B = (A \\ominus B) \\oplus B',
                description: 'Erosion followed by dilation. Removes small white objects.',
                variables: [
                    { symbol: 'A', meaning: 'Binary image' },
                    { symbol: 'B', meaning: 'Structuring element' },
                    { symbol: 'T', meaning: 'Threshold', value: params.threshold },
                ],
            };

        case 'closing':
            return {
                name: 'Morphological Closing',
                latex: 'A \\bullet B = (A \\oplus B) \\ominus B',
                description: 'Dilation followed by erosion. Fills small black holes.',
                variables: [
                    { symbol: 'A', meaning: 'Binary image' },
                    { symbol: 'B', meaning: 'Structuring element' },
                    { symbol: 'T', meaning: 'Threshold', value: params.threshold },
                ],
            };

        // Edge Detection
        case 'sobelX':
            return {
                name: 'Sobel X (Vertical Edges)',
                latex: 'G_x = \\begin{bmatrix} -1 & 0 & 1 \\\\ -2 & 0 & 2 \\\\ -1 & 0 & 1 \\end{bmatrix} * f',
                description: 'Detects vertical edges using horizontal gradient. Highlights left-right transitions.',
                variables: [
                    { symbol: 'G_x', meaning: 'Horizontal gradient' },
                    { symbol: 'f', meaning: 'Input image' },
                ],
            };

        case 'sobelY':
            return {
                name: 'Sobel Y (Horizontal Edges)',
                latex: 'G_y = \\begin{bmatrix} -1 & -2 & -1 \\\\ 0 & 0 & 0 \\\\ 1 & 2 & 1 \\end{bmatrix} * f',
                description: 'Detects horizontal edges using vertical gradient. Highlights top-bottom transitions.',
                variables: [
                    { symbol: 'G_y', meaning: 'Vertical gradient' },
                    { symbol: 'f', meaning: 'Input image' },
                ],
            };

        case 'sobelMagnitude':
            return {
                name: 'Sobel Magnitude',
                latex: 'G = \\sqrt{G_x^2 + G_y^2}',
                description: 'Combines horizontal and vertical gradients to find all edges.',
                variables: [
                    { symbol: 'G', meaning: 'Edge magnitude' },
                    { symbol: 'G_x', meaning: 'Horizontal gradient' },
                    { symbol: 'G_y', meaning: 'Vertical gradient' },
                ],
            };

        // Noise Reduction
        case 'median':
            return {
                name: 'Median Filter',
                latex: 's = \\text{median}\\{f(x+i, y+j) | i,j \\in N\\}',
                description: 'Replaces each pixel with the median of its neighborhood. Excellent for salt-and-pepper noise.',
                variables: [
                    { symbol: 's', meaning: 'Output pixel' },
                    { symbol: 'N', meaning: 'Neighborhood', value: `${params.kernelSize}×${params.kernelSize}` },
                ],
            };

        // Color Filters
        case 'grayscale':
            return {
                name: 'Grayscale Conversion',
                latex: 'Y = 0.299R + 0.587G + 0.114B',
                description: 'Converts to grayscale using luminance formula (ITU-R BT.601). Weights reflect human eye sensitivity.',
                variables: [
                    { symbol: 'Y', meaning: 'Luminance output' },
                    { symbol: 'R, G, B', meaning: 'Color channels' },
                ],
            };

        case 'sepia':
            return {
                name: 'Sepia Tone',
                latex: '\\begin{bmatrix} R\' \\\\ G\' \\\\ B\' \\end{bmatrix} = \\begin{bmatrix} 0.393 & 0.769 & 0.189 \\\\ 0.349 & 0.686 & 0.168 \\\\ 0.272 & 0.534 & 0.131 \\end{bmatrix} \\begin{bmatrix} R \\\\ G \\\\ B \\end{bmatrix}',
                description: 'Applies a vintage brownish tone reminiscent of old photographs.',
                variables: [
                    { symbol: "R', G', B'", meaning: 'Output channels' },
                    { symbol: 'R, G, B', meaning: 'Input channels' },
                ],
            };

        case 'swapChannels':
            return {
                name: 'RGB Channel Swap',
                latex: 'R \\rightarrow G \\rightarrow B \\rightarrow R',
                description: 'Rotates color channels creating a psychedelic color shift effect.',
                variables: [
                    { symbol: 'R → G', meaning: 'Red becomes Green' },
                    { symbol: 'G → B', meaning: 'Green becomes Blue' },
                    { symbol: 'B → R', meaning: 'Blue becomes Red' },
                ],
            };

        case 'none':
        default:
            return {
                name: 'Original Image',
                latex: 's = r',
                description: 'No transformation applied. Output equals input.',
                variables: [
                    { symbol: 's', meaning: 'Output' },
                    { symbol: 'r', meaning: 'Input' },
                ],
            };
    }
};

// =============================================================================
// Component
// =============================================================================

export const FormulaPanel: React.FC<FormulaPanelProps> = ({
    activeFilter,
    filterParams,
    isAnimating,
    animationMode,
    animationSpeed,
    animationProgress,
    hasImage,
    onToggleAnimation,
    onChangeMode,
    onChangeSpeed,
    onResetAnimation,
}) => {
    const formulaRef = useRef<HTMLDivElement>(null);
    const formulaInfo = getFormulaInfo(activeFilter, filterParams);

    // ---------------------------------------------------------------------------
    // Effect: Render LaTeX
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (formulaRef.current) {
            try {
                katex.render(formulaInfo.latex, formulaRef.current, {
                    displayMode: true,
                    throwOnError: false,
                });
            } catch (e) {
                formulaRef.current.textContent = formulaInfo.latex;
            }
        }
    }, [formulaInfo.latex]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="formula-panel">
            {/* Header */}
            <div className="formula-header">
                <h3 className="formula-title">{formulaInfo.name}</h3>
            </div>

            {/* Formula Display */}
            <div className="formula-display">
                <div ref={formulaRef} className="latex-formula" />
            </div>

            {/* Description */}
            <p className="formula-description">{formulaInfo.description}</p>

            {/* Variables */}
            {formulaInfo.variables && formulaInfo.variables.length > 0 && (
                <div className="formula-variables">
                    <h4 className="variables-title">Variables</h4>
                    <div className="variables-list">
                        {formulaInfo.variables.map((v, i) => (
                            <div key={i} className="variable-item">
                                <span className="variable-symbol">{v.symbol}</span>
                                <span className="variable-meaning">{v.meaning}</span>
                                {v.value !== undefined && (
                                    <span className="variable-value">= {v.value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Animation Controls */}
            <div className="animation-controls">
                <h4 className="controls-title">Live Animation</h4>

                {/* Mode Selection */}
                <div className="control-group">
                    <label className="control-label">Mode</label>
                    <div className="mode-buttons">
                        <button
                            className={`mode-btn ${animationMode === 'scanline' ? 'active' : ''}`}
                            onClick={() => onChangeMode('scanline')}
                            disabled={isAnimating}
                        >
                            Scanline
                        </button>
                        <button
                            className={`mode-btn ${animationMode === 'pixel' ? 'active' : ''}`}
                            onClick={() => onChangeMode('pixel')}
                            disabled={isAnimating}
                        >
                            Pixel
                        </button>
                    </div>
                </div>

                {/* Speed Control */}
                <div className="control-group">
                    <label className="control-label">
                        Speed: <span className="speed-value">{animationSpeed}x</span>
                    </label>
                    <input
                        type="range"
                        className="speed-slider"
                        min={1}
                        max={10}
                        value={animationSpeed}
                        onChange={(e) => onChangeSpeed(parseInt(e.target.value))}
                        disabled={isAnimating}
                    />
                </div>

                {/* Progress Bar */}
                {isAnimating && (
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${animationProgress}%` }}
                            />
                        </div>
                        <span className="progress-text">{Math.round(animationProgress)}%</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        className={`action-btn ${isAnimating ? 'stop' : 'play'}`}
                        onClick={onToggleAnimation}
                        disabled={!hasImage || activeFilter === 'none'}
                    >
                        {isAnimating ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" />
                                    <rect x="14" y="4" width="4" height="16" />
                                </svg>
                                Pause
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                                Play
                            </>
                        )}
                    </button>
                    <button
                        className="action-btn reset"
                        onClick={onResetAnimation}
                        disabled={!isAnimating && animationProgress === 0}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormulaPanel;
