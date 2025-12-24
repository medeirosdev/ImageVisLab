/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * Main application component that orchestrates all functionality.
 * Handles image loading, filter application, and user interactions.
 * 
 * @module App
 * @author ImageVisLab Contributors
 * @license MIT
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ImageCanvas, Sidebar, PixelInspector } from './components';
import type { FilterType, FilterParams } from './types';
import {
  applyNegative,
  applyGamma,
  applyLog,
  applyQuantization,
  applySampling,
  applyEqualization,
  getPixelInfo,
  getNeighborhood,
  calculateHistogram,
} from './utils/imageFilters';
import './App.css';

// =============================================================================
// Constants
// =============================================================================

/** Default filter parameters */
const DEFAULT_FILTER_PARAMS: FilterParams = {
  gamma: 1.0,
  gammaConstant: 1.0,
  logConstant: 1.0,
  quantizationLevels: 256,
  samplingFactor: 1,
};

// =============================================================================
// Main Application Component
// =============================================================================

function App() {
  // ---------------------------------------------------------------------------
  // State: Image
  // ---------------------------------------------------------------------------
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // ---------------------------------------------------------------------------
  // State: Filters
  // ---------------------------------------------------------------------------
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [filterParams, setFilterParams] = useState<FilterParams>(DEFAULT_FILTER_PARAMS);

  // ---------------------------------------------------------------------------
  // State: Pixel Inspector
  // ---------------------------------------------------------------------------
  const [pixelInfo, setPixelInfo] = useState<ReturnType<typeof getPixelInfo> | null>(null);
  const [neighborhood, setNeighborhood] = useState<ReturnType<typeof getNeighborhood>>([]);
  const [showOriginal, setShowOriginal] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Memoized: Processed Image
  // ---------------------------------------------------------------------------

  /**
   * Applies the active filter to the original image.
   * Recalculates only when the image, filter type, or parameters change.
   */
  const processedImage = useMemo(() => {
    if (!originalImage) return null;

    switch (activeFilter) {
      case 'negative':
        return applyNegative(originalImage);
      case 'gamma':
        return applyGamma(originalImage, filterParams.gamma, filterParams.gammaConstant);
      case 'log':
        return applyLog(originalImage, filterParams.logConstant);
      case 'quantization':
        return applyQuantization(originalImage, filterParams.quantizationLevels);
      case 'sampling':
        return applySampling(originalImage, filterParams.samplingFactor);
      case 'equalization':
        return applyEqualization(originalImage);
      case 'none':
      default:
        return originalImage;
    }
  }, [originalImage, activeFilter, filterParams]);

  /**
   * Calculates histogram data for the processed image.
   */
  const histogramData = useMemo(() => {
    if (!processedImage) return null;
    return calculateHistogram(processedImage);
  }, [processedImage]);

  /**
   * Calculates histogram data for the original image (for comparison).
   */
  const originalHistogramData = useMemo(() => {
    if (!originalImage) return null;
    return calculateHistogram(originalImage);
  }, [originalImage]);

  // ---------------------------------------------------------------------------
  // Handlers: Image Loading
  // ---------------------------------------------------------------------------

  /** Opens the file picker dialog */
  const handleLoadImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /** Processes the selected image file */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    setIsLoading(true);
    setLoadingMessage('Reading file...');

    const reader = new FileReader();
    reader.onload = (event) => {
      setLoadingMessage('Decoding image...');

      const img = new Image();
      img.onload = () => {
        // Check for very large images (> 4000px in any dimension)
        const MAX_DIMENSION = 4000;
        const MAX_PIXELS = 16000000; // 16 megapixels
        const totalPixels = img.width * img.height;

        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          setIsLoading(false);
          setLoadingMessage('');
          alert(`Image too large (${img.width}x${img.height}). Maximum dimension is ${MAX_DIMENSION}px.`);
          return;
        }

        if (totalPixels > MAX_PIXELS) {
          setIsLoading(false);
          setLoadingMessage('');
          alert(`Image has too many pixels (${(totalPixels / 1000000).toFixed(1)}MP). Maximum is ${MAX_PIXELS / 1000000}MP.`);
          return;
        }

        setLoadingMessage('Processing pixels...');

        // Use setTimeout to allow UI to update before heavy processing
        setTimeout(() => {
          // Create temporary canvas to extract ImageData
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsLoading(false);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);

          setOriginalImage(imageData);
          setActiveFilter('none');
          setFilterParams(DEFAULT_FILTER_PARAMS);
          setPixelInfo(null);
          setNeighborhood([]);
          setIsLoading(false);
          setLoadingMessage('');
        }, 50);
      };

      img.onerror = () => {
        setIsLoading(false);
        setLoadingMessage('');
        alert('Error loading image');
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setIsLoading(false);
      setLoadingMessage('');
      alert('Error reading file');
    };

    reader.readAsDataURL(file);

    // Reset input to allow reloading the same file
    e.target.value = '';
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers: Filter Controls
  // ---------------------------------------------------------------------------

  /** Changes the active filter type */
  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  /** Updates a specific filter parameter */
  const handleParamChange = useCallback((param: keyof FilterParams, value: number) => {
    setFilterParams(prev => ({ ...prev, [param]: value }));
  }, []);

  /** Resets all filters to default */
  const handleReset = useCallback(() => {
    setActiveFilter('none');
    setFilterParams(DEFAULT_FILTER_PARAMS);
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers: Pixel Inspector
  // ---------------------------------------------------------------------------

  /** Updates pixel info when mouse moves over the canvas */
  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!processedImage) return;

    const info = getPixelInfo(processedImage, x, y);
    setPixelInfo(info);

    const neighbors = getNeighborhood(processedImage, x, y, 5);
    setNeighborhood(neighbors);
  }, [processedImage]);

  /** Clears pixel info when mouse leaves the canvas */
  const handleMouseLeave = useCallback(() => {
    setPixelInfo(null);
    setNeighborhood([]);
  }, []);

  // ---------------------------------------------------------------------------
  // Effects: Keyboard Shortcuts
  // ---------------------------------------------------------------------------

  /** Toggle original image view with Space key */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && originalImage) {
        e.preventDefault();
        setShowOriginal(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setShowOriginal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [originalImage]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="app">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-message">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Sidebar: Filter Controls */}
      <Sidebar
        activeFilter={activeFilter}
        filterParams={filterParams}
        onFilterChange={handleFilterChange}
        onParamChange={handleParamChange}
        onLoadImage={handleLoadImage}
        onReset={handleReset}
        hasImage={!!originalImage}
      />

      {/* Main Area */}
      <main className="main-area">
        {/* Header: Image Info */}
        {originalImage && (
          <header className="main-header">
            <div className="image-info">
              <span className="filename">{imageFileName}</span>
              <span className="dimensions">
                {originalImage.width} x {originalImage.height} px
              </span>
            </div>
            <div className="header-hint">
              <kbd>Space</kbd> to view original
            </div>
          </header>
        )}

        {/* Canvas: Image Display */}
        <ImageCanvas
          imageData={processedImage}
          originalData={originalImage}
          showOriginal={showOriginal}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Pixel Inspector Panel */}
        <PixelInspector
          pixelInfo={pixelInfo}
          neighborhood={neighborhood}
          imageWidth={originalImage?.width}
          imageHeight={originalImage?.height}
          histogramData={histogramData}
          originalHistogramData={originalHistogramData}
          hasImage={!!originalImage}
        />
      </main>
    </div>
  );
}

export default App;
