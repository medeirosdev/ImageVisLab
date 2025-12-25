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
import { ImageCanvas, Sidebar, PixelInspector, FormulaPanel, LoadingSkeleton, ProcessingIndicator, StepByStepPanel } from './components';
import { useHistory, useImageWorker } from './hooks';
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
import {
  applyCustomFormula,
  applyCustomKernel,
} from './utils/customFilters';
import {
  applySobelX,
  applySobelY,
  applySobelMagnitude,
} from './utils/edgeDetection';
import { applyMedian } from './utils/noiseReduction';
import {
  applyGrayscale,
  applySepia,
  applySwapChannels,
} from './utils/colorFilters';
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
  customFormula: '255 - r',
  customKernel: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  customKernelSize: 3,
};

/**
 * Synchronous image processing fallback when worker is not available.
 */
function processImageSync(
  imageData: ImageData,
  filter: FilterType,
  params: FilterParams
): ImageData {
  switch (filter) {
    case 'negative':
      return applyNegative(imageData);
    case 'gamma':
      return applyGamma(imageData, params.gamma, params.gammaConstant);
    case 'log':
      return applyLog(imageData, params.logConstant);
    case 'quantization':
      return applyQuantization(imageData, params.quantizationLevels);
    case 'sampling':
      return applySampling(imageData, params.samplingFactor);
    case 'equalization':
      return applyEqualization(imageData);
    case 'boxBlur':
      return applyBoxBlur(imageData, params.kernelSize);
    case 'gaussianBlur':
      return applyGaussianBlur(imageData, params.kernelSize, params.gaussianSigma);
    case 'sharpen':
      return applySharpen(imageData);
    case 'laplacian':
      return applyLaplacian(imageData);
    case 'threshold':
      return applyThreshold(imageData, params.threshold);
    case 'erosion':
      return applyErosion(applyThreshold(imageData, params.threshold));
    case 'dilation':
      return applyDilation(applyThreshold(imageData, params.threshold));
    case 'opening':
      return applyOpening(applyThreshold(imageData, params.threshold));
    case 'closing':
      return applyClosing(applyThreshold(imageData, params.threshold));
    case 'customFormula':
      return applyCustomFormula(imageData, params.customFormula);
    case 'customKernel':
      return applyCustomKernel(imageData, params.customKernel);
    // Edge Detection
    case 'sobelX':
      return applySobelX(imageData);
    case 'sobelY':
      return applySobelY(imageData);
    case 'sobelMagnitude':
      return applySobelMagnitude(imageData);
    // Noise Reduction
    case 'median':
      return applyMedian(imageData, params.kernelSize);
    // Color Filters
    case 'grayscale':
      return applyGrayscale(imageData);
    case 'sepia':
      return applySepia(imageData);
    case 'swapChannels':
      return applySwapChannels(imageData);
    case 'none':
    default:
      return imageData;
  }
}

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
  // State: Step-by-Step Mode
  // ---------------------------------------------------------------------------
  const [stepByStepActive, setStepByStepActive] = useState(false);
  const [stepImage, setStepImage] = useState<ImageData | null>(null);

  // ---------------------------------------------------------------------------
  // State: Processing
  // ---------------------------------------------------------------------------
  const [isProcessing, setIsProcessing] = useState(false);

  // ---------------------------------------------------------------------------
  // State: Resize Modal
  // ---------------------------------------------------------------------------
  const [resizeModal, setResizeModal] = useState<{
    show: boolean;
    originalSize: { width: number; height: number };
    newSize: { width: number; height: number };
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
  }>({
    show: false,
    originalSize: { width: 0, height: 0 },
    newSize: { width: 0, height: 0 },
    onConfirm: null,
    onCancel: null,
  });

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Web Worker for Image Processing
  // ---------------------------------------------------------------------------
  const { processImage: workerProcess, isReady: workerReady } = useImageWorker();
  const [processedImage, setProcessedImage] = useState<ImageData | null>(null);
  const [, setProcessingTime] = useState<number | null>(null);


  /**
   * Applies the active filter to the original image using Web Worker.
   * Runs in a separate thread to keep UI responsive.
   */
  useEffect(() => {
    if (!originalImage) {
      setProcessedImage(null);
      return;
    }

    // For 'none' filter, just use original
    if (activeFilter === 'none') {
      setProcessedImage(originalImage);
      setIsProcessing(false);
      return;
    }

    // Start processing
    setIsProcessing(true);
    const startTime = performance.now();

    // Clone the image data since worker will transfer the buffer
    const clonedData = new Uint8ClampedArray(originalImage.data);
    const clonedImage = new ImageData(clonedData, originalImage.width, originalImage.height);

    if (workerReady) {
      // Use Web Worker for processing
      workerProcess(clonedImage, activeFilter, filterParams)
        .then((result) => {
          setProcessedImage(result);
          setProcessingTime(performance.now() - startTime);
          setIsProcessing(false);
        })
        .catch((error) => {
          console.error('Worker error, falling back to main thread:', error);
          // Fallback to synchronous processing
          const result = processImageSync(originalImage, activeFilter, filterParams);
          setProcessedImage(result);
          setProcessingTime(performance.now() - startTime);
          setIsProcessing(false);
        });
    } else {
      // Fallback: synchronous processing on main thread
      const result = processImageSync(originalImage, activeFilter, filterParams);
      setProcessedImage(result);
      setProcessingTime(performance.now() - startTime);
      setIsProcessing(false);
    }
  }, [originalImage, activeFilter, filterParams, workerReady, workerProcess]);

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
        const RECOMMENDED_MAX = 1024; // Recommended max dimension
        const ABSOLUTE_MAX = 2048;    // Hard limit
        const MAX_PIXELS = 4000000;   // 4 megapixels
        const totalPixels = img.width * img.height;
        const maxDimension = Math.max(img.width, img.height);

        // Hard limits - reject completely
        if (img.width > ABSOLUTE_MAX || img.height > ABSOLUTE_MAX || totalPixels > MAX_PIXELS) {
          setIsLoading(false);
          setLoadingMessage('');
          alert(`Image too large (${img.width}x${img.height}). Maximum is ${ABSOLUTE_MAX}px or ${MAX_PIXELS / 1000000}MP.`);
          return;
        }

        // Helper function to process image with optional resize
        const processImage = (sourceImg: HTMLImageElement, targetWidth: number, targetHeight: number) => {
          setLoadingMessage('Processing pixels...');

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const canvas = document.createElement('canvas');
              canvas.width = targetWidth;
              canvas.height = targetHeight;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                setIsLoading(false);
                return;
              }

              // Use high quality image smoothing for resize
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(sourceImg, 0, 0, targetWidth, targetHeight);

              const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

              setOriginalImage(imageData);
              setActiveFilter('none');
              setFilterParams(DEFAULT_FILTER_PARAMS);
              setPixelInfo(null);
              setNeighborhood([]);
              setIsLoading(false);
              setLoadingMessage('');
              handleResetAnimation();
            });
          });
        };

        // Check if resize is recommended
        if (maxDimension > RECOMMENDED_MAX) {
          const scale = RECOMMENDED_MAX / maxDimension;
          const newWidth = Math.round(img.width * scale);
          const newHeight = Math.round(img.height * scale);

          // Show custom modal instead of browser confirm
          setIsLoading(false);
          setResizeModal({
            show: true,
            originalSize: { width: img.width, height: img.height },
            newSize: { width: newWidth, height: newHeight },
            onConfirm: () => {
              setResizeModal(prev => ({ ...prev, show: false }));
              setIsLoading(true);
              setLoadingMessage(`Redimensionando para ${newWidth}x${newHeight}...`);
              processImage(img, newWidth, newHeight);
            },
            onCancel: () => {
              setResizeModal(prev => ({ ...prev, show: false }));
              setIsLoading(true);
              setLoadingMessage('Processando tamanho original...');
              processImage(img, img.width, img.height);
            },
          });
        } else {
          // Image is small enough, process normally
          processImage(img, img.width, img.height);
        }
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
  const handleParamChange = useCallback((param: keyof FilterParams, value: number | string | number[][]) => {
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
  const displayImage = stepImage || animatedImage || processedImage;

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

      {/* Resize Modal */}
      {resizeModal.show && (
        <div className="resize-modal-overlay">
          <div className="resize-modal">
            <div className="resize-modal-icon">⚠️</div>
            <h2 className="resize-modal-title">Imagem Grande Detectada</h2>
            <p className="resize-modal-size">
              <span className="size-original">{resizeModal.originalSize.width} × {resizeModal.originalSize.height}</span>
            </p>
            <p className="resize-modal-warning">
              Imagens grandes podem causar lentidão ou travamento do navegador.
            </p>
            <div className="resize-modal-recommend">
              <span className="recommend-label">Tamanho recomendado:</span>
              <span className="recommend-size">{resizeModal.newSize.width} × {resizeModal.newSize.height}</span>
            </div>
            <div className="resize-modal-buttons">
              <button
                className="resize-btn resize-btn-primary"
                onClick={resizeModal.onConfirm || undefined}
              >
                Redimensionar
              </button>
              <button
                className="resize-btn resize-btn-secondary"
                onClick={resizeModal.onCancel || undefined}
              >
                Manter Original
              </button>
            </div>
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

          {/* Step-by-Step Educational Mode */}
          <StepByStepPanel
            activeFilter={activeFilter}
            originalImage={originalImage}
            threshold={filterParams.threshold}
            onStepImageChange={setStepImage}
            isActive={stepByStepActive}
            onToggle={() => setStepByStepActive(!stepByStepActive)}
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
