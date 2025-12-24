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
import { ImageCanvas, Sidebar, PixelInspector, FormulaPanel, LoadingSkeleton, ProcessingIndicator } from './components';
import { useHistory } from './hooks';
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
import {
  applyBoxBlur,
  applyGaussianBlur,
  applySharpen,
  applyLaplacian,
} from './utils/convolution';
import {
  applyThreshold,
  applyErosion,
  applyDilation,
  applyOpening,
  applyClosing,
} from './utils/morphology';
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
  kernelSize: 3,
  gaussianSigma: 1.0,
  threshold: 128,
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
  // History (Undo/Redo)
  // ---------------------------------------------------------------------------
  const history = useHistory();
  const isRestoringRef = useRef(false);

  // ---------------------------------------------------------------------------
  // State: Pixel Inspector
  // ---------------------------------------------------------------------------
  const [pixelInfo, setPixelInfo] = useState<ReturnType<typeof getPixelInfo> | null>(null);
  const [neighborhood, setNeighborhood] = useState<ReturnType<typeof getNeighborhood>>([]);
  const [showOriginal, setShowOriginal] = useState(false);

  // ---------------------------------------------------------------------------
  // State: Animation
  // ---------------------------------------------------------------------------
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationMode, setAnimationMode] = useState<'scanline' | 'pixel'>('scanline');
  const [animationSpeed, setAnimationSpeed] = useState(5);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animatedImage, setAnimatedImage] = useState<ImageData | null>(null);
  const animationRef = useRef<number | null>(null);

  // ---------------------------------------------------------------------------
  // State: Processing
  // ---------------------------------------------------------------------------
  const [isProcessing, setIsProcessing] = useState(false);

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

    // Start processing indicator for potentially slow operations
    const slowFilters = ['gaussianBlur', 'boxBlur', 'erosion', 'dilation', 'opening', 'closing'];
    if (slowFilters.includes(activeFilter)) {
      setIsProcessing(true);
    }

    let result: ImageData;
    switch (activeFilter) {
      case 'negative':
        result = applyNegative(originalImage);
        break;
      case 'gamma':
        result = applyGamma(originalImage, filterParams.gamma, filterParams.gammaConstant);
        break;
      case 'log':
        result = applyLog(originalImage, filterParams.logConstant);
        break;
      case 'quantization':
        result = applyQuantization(originalImage, filterParams.quantizationLevels);
        break;
      case 'sampling':
        result = applySampling(originalImage, filterParams.samplingFactor);
        break;
      case 'equalization':
        result = applyEqualization(originalImage);
        break;
      // Spatial Filters (Convolution)
      case 'boxBlur':
        result = applyBoxBlur(originalImage, filterParams.kernelSize);
        break;
      case 'gaussianBlur':
        result = applyGaussianBlur(originalImage, filterParams.kernelSize, filterParams.gaussianSigma);
        break;
      case 'sharpen':
        result = applySharpen(originalImage);
        break;
      case 'laplacian':
        result = applyLaplacian(originalImage);
        break;
      // Morphology Operations
      case 'threshold':
        result = applyThreshold(originalImage, filterParams.threshold);
        break;
      case 'erosion':
        result = applyErosion(applyThreshold(originalImage, filterParams.threshold));
        break;
      case 'dilation':
        result = applyDilation(applyThreshold(originalImage, filterParams.threshold));
        break;
      case 'opening':
        result = applyOpening(applyThreshold(originalImage, filterParams.threshold));
        break;
      case 'closing':
        result = applyClosing(applyThreshold(originalImage, filterParams.threshold));
        break;
      case 'none':
      default:
        result = originalImage;
    }

    // End processing indicator
    setTimeout(() => setIsProcessing(false), 0);
    return result;
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
  // Animation Logic
  // ---------------------------------------------------------------------------

  /** Starts or pauses the animation */
  const handleToggleAnimation = useCallback(() => {
    if (isAnimating) {
      // Pause animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsAnimating(false);
    } else {
      // Start animation
      if (!originalImage || !processedImage || activeFilter === 'none') return;

      setIsAnimating(true);

      // If starting fresh, reset
      if (animationProgress === 0 || animationProgress >= 100) {
        setAnimationProgress(0);
        setAnimatedImage(new ImageData(
          new Uint8ClampedArray(originalImage.data),
          originalImage.width,
          originalImage.height
        ));
      }

      // Start animation loop
      const animate = () => {
        setAnimationProgress(prev => {
          const increment = animationSpeed * (animationMode === 'scanline' ? 0.5 : 0.1);
          const newProgress = Math.min(prev + increment, 100);

          if (newProgress >= 100) {
            setIsAnimating(false);
            setAnimatedImage(processedImage);
            return 100;
          }

          // Update animated image based on progress
          if (originalImage && processedImage) {
            const { width, height } = originalImage;
            const newData = new Uint8ClampedArray(originalImage.data);

            if (animationMode === 'scanline') {
              // Scanline mode: process row by row
              const processedRows = Math.floor((newProgress / 100) * height);
              for (let y = 0; y < processedRows; y++) {
                for (let x = 0; x < width; x++) {
                  const idx = (y * width + x) * 4;
                  newData[idx] = processedImage.data[idx];
                  newData[idx + 1] = processedImage.data[idx + 1];
                  newData[idx + 2] = processedImage.data[idx + 2];
                }
              }
            } else {
              // Pixel mode: process pixel by pixel
              const totalPixels = width * height;
              const processedPixels = Math.floor((newProgress / 100) * totalPixels);
              for (let i = 0; i < processedPixels; i++) {
                const idx = i * 4;
                newData[idx] = processedImage.data[idx];
                newData[idx + 1] = processedImage.data[idx + 1];
                newData[idx + 2] = processedImage.data[idx + 2];
              }
            }

            setAnimatedImage(new ImageData(newData, width, height));
          }

          animationRef.current = requestAnimationFrame(animate);
          return newProgress;
        });
      };

      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isAnimating, originalImage, processedImage, activeFilter, animationProgress, animationSpeed, animationMode]);

  /** Resets the animation */
  const handleResetAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
    setAnimationProgress(0);
    setAnimatedImage(null);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Reset animation when filter changes
  useEffect(() => {
    handleResetAnimation();
  }, [activeFilter, filterParams, handleResetAnimation]);

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
          handleResetAnimation();
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
  }, [handleResetAnimation]);

  // ---------------------------------------------------------------------------
  // Effect: Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          const state = history.undo();
          if (state) {
            isRestoringRef.current = true;
            setActiveFilter(state.activeFilter);
            setFilterParams(state.filterParams);
            isRestoringRef.current = false;
          }
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          const state = history.redo();
          if (state) {
            isRestoringRef.current = true;
            setActiveFilter(state.activeFilter);
            setFilterParams(state.filterParams);
            isRestoringRef.current = false;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  // ---------------------------------------------------------------------------
  // Handlers: Filter Controls
  // ---------------------------------------------------------------------------

  /** Changes the active filter type */
  const handleFilterChange = useCallback((filter: FilterType) => {
    if (!isRestoringRef.current) {
      history.push({ activeFilter: filter, filterParams });
    }
    setActiveFilter(filter);
  }, [history, filterParams]);

  /** Updates a specific filter parameter */
  const handleParamChange = useCallback((param: keyof FilterParams, value: number) => {
    setFilterParams(prev => {
      const newParams = { ...prev, [param]: value };
      if (!isRestoringRef.current) {
        history.push({ activeFilter, filterParams: newParams });
      }
      return newParams;
    });
  }, [history, activeFilter]);

  /** Resets all filters to default */
  const handleReset = useCallback(() => {
    if (!isRestoringRef.current) {
      history.push({ activeFilter: 'none', filterParams: DEFAULT_FILTER_PARAMS });
    }
    setActiveFilter('none');
    setFilterParams(DEFAULT_FILTER_PARAMS);
  }, [history]);

  /** Undo to previous state */
  const handleUndo = useCallback(() => {
    const state = history.undo();
    if (state) {
      isRestoringRef.current = true;
      setActiveFilter(state.activeFilter);
      setFilterParams(state.filterParams);
      isRestoringRef.current = false;
    }
  }, [history]);

  /** Redo to next state */
  const handleRedo = useCallback(() => {
    const state = history.redo();
    if (state) {
      isRestoringRef.current = true;
      setActiveFilter(state.activeFilter);
      setFilterParams(state.filterParams);
      isRestoringRef.current = false;
    }
  }, [history]);

  /** Downloads the processed image as PNG */
  const handleDownload = useCallback(() => {
    const imageToDownload = animatedImage || processedImage;
    if (!imageToDownload) return;

    // Create canvas with processed image
    const canvas = document.createElement('canvas');
    canvas.width = imageToDownload.width;
    canvas.height = imageToDownload.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(imageToDownload, 0, 0);

    // Create download link
    const link = document.createElement('a');
    link.download = `${imageFileName.replace(/\.[^/.]+$/, '')}_processed.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [animatedImage, processedImage, imageFileName]);

  /** Generates and loads a sample image */
  const handleLoadSample = useCallback((type: 'gradient' | 'checkerboard' | 'noise') => {
    const size = 256;
    const data = new Uint8ClampedArray(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        let value = 0;

        switch (type) {
          case 'gradient':
            // Horizontal gradient
            value = Math.floor((x / size) * 255);
            break;
          case 'checkerboard':
            // 16x16 checkerboard pattern
            value = ((Math.floor(x / 16) + Math.floor(y / 16)) % 2) * 255;
            break;
          case 'noise':
            // Random noise
            value = Math.floor(Math.random() * 256);
            break;
        }

        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
        data[idx + 3] = 255;
      }
    }

    const imageData = new ImageData(data, size, size);
    setOriginalImage(imageData);
    setImageFileName(`sample_${type}.png`);
    handleResetAnimation();
  }, [handleResetAnimation]);

  // ---------------------------------------------------------------------------
  // Handlers: Pixel Inspector
  // ---------------------------------------------------------------------------

  /** Updates pixel info when mouse moves over the canvas */
  const handleMouseMove = useCallback((x: number, y: number) => {
    const imageToInspect = animatedImage || processedImage;
    if (!imageToInspect) return;

    const info = getPixelInfo(imageToInspect, x, y);
    setPixelInfo(info);

    const neighbors = getNeighborhood(imageToInspect, x, y, 5);
    setNeighborhood(neighbors);
  }, [animatedImage, processedImage]);

  /** 
   * Handler for mouse leaving the canvas.
   * We intentionally do NOT clear pixel info here to allow users
   * to interact with the inspector controls while data persists.
   */
  const handleMouseLeave = useCallback(() => {
    // Intentionally empty - keep last pixel info for inspection
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
  // Determine which image to display
  // ---------------------------------------------------------------------------
  const displayImage = animatedImage || processedImage;

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
        onLoadSample={handleLoadSample}
        onDownload={handleDownload}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
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

        {/* Content Area: Canvas + FormulaPanel */}
        <div className="content-area">
          {/* Canvas: Image Display */}
          {isLoading ? (
            <LoadingSkeleton
              type="image"
              height="100%"
              message={loadingMessage || 'Loading image...'}
            />
          ) : (
            <>
              <ImageCanvas
                imageData={displayImage}
                originalData={originalImage}
                showOriginal={showOriginal}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
              <ProcessingIndicator
                isProcessing={isProcessing}
                filterName={activeFilter !== 'none' ? activeFilter : undefined}
              />
            </>
          )}

          {/* Formula Panel */}
          <FormulaPanel
            activeFilter={activeFilter}
            filterParams={filterParams}
            isAnimating={isAnimating}
            animationMode={animationMode}
            animationSpeed={animationSpeed}
            animationProgress={animationProgress}
            hasImage={!!originalImage}
            onToggleAnimation={handleToggleAnimation}
            onChangeMode={setAnimationMode}
            onChangeSpeed={setAnimationSpeed}
            onResetAnimation={handleResetAnimation}
          />
        </div>

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
