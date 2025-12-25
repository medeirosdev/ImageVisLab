/**
 * StatusBar - Image Statistics Display
 * 
 * Displays real-time statistics about the current image
 * in a compact bar at the bottom of the application.
 * 
 * @module StatusBar
 * @author ImageVisLab Contributors
 * @license MIT
 */

import { useMemo } from 'react';
import { calculateImageStatistics, formatPixelCount, type ImageStatistics } from '../../utils/imageStatistics';
import './StatusBar.css';

// =============================================================================
// Types
// =============================================================================

interface StatusBarProps {
    /** The image data to calculate statistics from */
    imageData: ImageData | null;
    /** Whether to show original image stats (when Space is held) */
    originalData?: ImageData | null;
    /** Whether currently showing original */
    showOriginal?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * StatusBar displays image statistics in a compact horizontal bar.
 * 
 * Statistics shown:
 * - μ (Mean): Average intensity
 * - σ (Std Dev): Intensity spread
 * - H (Entropy): Information content in bits
 * - Min/Max: Intensity range
 * - Pixel count: Total pixels
 */
export function StatusBar({ imageData, originalData, showOriginal }: StatusBarProps) {
    // Calculate statistics (memoized for performance)
    const stats = useMemo<ImageStatistics | null>(() => {
        const data = showOriginal && originalData ? originalData : imageData;
        if (!data) return null;
        return calculateImageStatistics(data);
    }, [imageData, originalData, showOriginal]);

    // Don't render if no image
    if (!stats) {
        return (
            <div className="status-bar status-bar--empty">
                <span className="status-bar__placeholder">
                    Carregue uma imagem para ver estatísticas
                </span>
            </div>
        );
    }

    return (
        <div className="status-bar" role="status" aria-label="Estatísticas da imagem">
            {/* Mean */}
            <div className="status-bar__item" title="Média (Mean): Brilho médio da imagem">
                <span className="status-bar__label">μ</span>
                <span className="status-bar__value">{stats.mean.toFixed(1)}</span>
            </div>

            <div className="status-bar__divider" />

            {/* Standard Deviation */}
            <div className="status-bar__item" title="Desvio Padrão: Medida de contraste da imagem">
                <span className="status-bar__label">σ</span>
                <span className="status-bar__value">{stats.stdDev.toFixed(1)}</span>
            </div>

            <div className="status-bar__divider" />

            {/* Entropy */}
            <div className="status-bar__item status-bar__item--entropy" title="Entropia: Quantidade de informação (0-8 bits)">
                <span className="status-bar__label">H</span>
                <span className="status-bar__value">{stats.entropy.toFixed(2)}</span>
                <span className="status-bar__unit">bits</span>
            </div>

            <div className="status-bar__divider" />

            {/* Min/Max */}
            <div className="status-bar__item status-bar__item--range" title="Faixa de intensidade (mínimo/máximo)">
                <span className="status-bar__label">Range</span>
                <span className="status-bar__value">{stats.min}–{stats.max}</span>
            </div>

            <div className="status-bar__divider" />

            {/* Variance (more compact) */}
            <div className="status-bar__item" title="Variância: σ² - Dispersão dos valores de intensidade">
                <span className="status-bar__label">σ²</span>
                <span className="status-bar__value">{stats.variance.toFixed(0)}</span>
            </div>

            <div className="status-bar__divider" />

            {/* Pixel Count */}
            <div className="status-bar__item status-bar__item--pixels" title={`Total de pixels: ${stats.pixelCount.toLocaleString()}`}>
                <span className="status-bar__label">Pixels</span>
                <span className="status-bar__value">{formatPixelCount(stats.pixelCount)}</span>
            </div>

            {/* Original indicator */}
            {showOriginal && (
                <div className="status-bar__original-indicator">
                    ORIGINAL
                </div>
            )}
        </div>
    );
}

export default StatusBar;
