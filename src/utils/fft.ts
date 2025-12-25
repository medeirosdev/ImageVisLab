/**
 * ImageVisLab - Fast Fourier Transform (FFT)
 * 
 * Implementation of 2D FFT for image frequency analysis.
 * Uses Cooley-Tukey radix-2 algorithm with zero-padding.
 * 
 * @module fft
 * @author ImageVisLab Contributors
 * @license MIT
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Complex number representation.
 */
export interface Complex {
    re: number;
    im: number;
}

// =============================================================================
// Complex Number Operations
// =============================================================================

/**
 * Creates a complex number.
 */
function complex(re: number, im: number = 0): Complex {
    return { re, im };
}

/**
 * Adds two complex numbers.
 */
function add(a: Complex, b: Complex): Complex {
    return { re: a.re + b.re, im: a.im + b.im };
}

/**
 * Subtracts two complex numbers.
 */
function subtract(a: Complex, b: Complex): Complex {
    return { re: a.re - b.re, im: a.im - b.im };
}

/**
 * Multiplies two complex numbers.
 */
function multiply(a: Complex, b: Complex): Complex {
    return {
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re,
    };
}

/**
 * Calculates the magnitude of a complex number.
 */
function magnitude(c: Complex): number {
    return Math.sqrt(c.re * c.re + c.im * c.im);
}

// =============================================================================
// FFT Core Algorithm
// =============================================================================

/**
 * Computes the next power of 2 >= n.
 */
function nextPowerOf2(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * 1D FFT using Cooley-Tukey radix-2 algorithm.
 * Input length must be a power of 2.
 * 
 * @param data - Array of complex numbers
 * @returns FFT of the input data
 */
function fft1D(data: Complex[]): Complex[] {
    const n = data.length;

    // Base case
    if (n <= 1) return data;

    // Verify power of 2
    if (n & (n - 1)) {
        throw new Error('FFT length must be a power of 2');
    }

    // Split into even and odd
    const even: Complex[] = [];
    const odd: Complex[] = [];
    for (let i = 0; i < n; i += 2) {
        even.push(data[i]);
        odd.push(data[i + 1]);
    }

    // Recursive FFT
    const evenFFT = fft1D(even);
    const oddFFT = fft1D(odd);

    // Combine
    const result: Complex[] = new Array(n);
    for (let k = 0; k < n / 2; k++) {
        // Twiddle factor: e^(-2πik/n)
        const angle = -2 * Math.PI * k / n;
        const twiddle = complex(Math.cos(angle), Math.sin(angle));
        const t = multiply(twiddle, oddFFT[k]);

        result[k] = add(evenFFT[k], t);
        result[k + n / 2] = subtract(evenFFT[k], t);
    }

    return result;
}

/**
 * 2D FFT by applying 1D FFT to rows then columns.
 * 
 * @param matrix - 2D array of grayscale values (0-255)
 * @returns 2D array of complex FFT coefficients
 */
function fft2D(matrix: number[][]): Complex[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Pad to power of 2
    const paddedRows = nextPowerOf2(rows);
    const paddedCols = nextPowerOf2(cols);

    // Convert to complex and pad with zeros
    let complexMatrix: Complex[][] = [];
    for (let i = 0; i < paddedRows; i++) {
        complexMatrix[i] = [];
        for (let j = 0; j < paddedCols; j++) {
            if (i < rows && j < cols) {
                complexMatrix[i][j] = complex(matrix[i][j]);
            } else {
                complexMatrix[i][j] = complex(0);
            }
        }
    }

    // FFT on rows
    for (let i = 0; i < paddedRows; i++) {
        complexMatrix[i] = fft1D(complexMatrix[i]);
    }

    // FFT on columns
    for (let j = 0; j < paddedCols; j++) {
        const column: Complex[] = [];
        for (let i = 0; i < paddedRows; i++) {
            column.push(complexMatrix[i][j]);
        }
        const fftColumn = fft1D(column);
        for (let i = 0; i < paddedRows; i++) {
            complexMatrix[i][j] = fftColumn[i];
        }
    }

    return complexMatrix;
}

/**
 * Shifts the zero-frequency component to the center.
 * This makes the spectrum easier to interpret visually.
 * 
 * @param spectrum - 2D FFT result
 * @returns Shifted spectrum
 */
function fftShift(spectrum: Complex[][]): Complex[][] {
    const rows = spectrum.length;
    const cols = spectrum[0].length;
    const halfRows = Math.floor(rows / 2);
    const halfCols = Math.floor(cols / 2);

    const shifted: Complex[][] = [];
    for (let i = 0; i < rows; i++) {
        shifted[i] = [];
        for (let j = 0; j < cols; j++) {
            const srcI = (i + halfRows) % rows;
            const srcJ = (j + halfCols) % cols;
            shifted[i][j] = spectrum[srcI][srcJ];
        }
    }

    return shifted;
}

// =============================================================================
// Image Processing Functions
// =============================================================================

/**
 * Converts ImageData to grayscale matrix.
 */
function imageToGrayscale(imageData: ImageData): number[][] {
    const { data, width, height } = imageData;
    const matrix: number[][] = [];

    for (let y = 0; y < height; y++) {
        matrix[y] = [];
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            // Luminosity method
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            matrix[y][x] = gray;
        }
    }

    return matrix;
}

/**
 * Computes the magnitude spectrum from FFT result.
 * Applies log scaling for better visualization.
 * 
 * @param spectrum - 2D FFT coefficients
 * @returns ImageData with magnitude spectrum
 */
function spectrumToImageData(spectrum: Complex[][], originalWidth: number, originalHeight: number): ImageData {
    const rows = spectrum.length;
    const cols = spectrum[0].length;

    // Calculate magnitudes with log scaling
    const magnitudes: number[][] = [];
    let maxMag = 0;

    for (let i = 0; i < rows; i++) {
        magnitudes[i] = [];
        for (let j = 0; j < cols; j++) {
            // Log scaling: log(1 + |F(u,v)|)
            const mag = Math.log(1 + magnitude(spectrum[i][j]));
            magnitudes[i][j] = mag;
            if (mag > maxMag) maxMag = mag;
        }
    }

    // Normalize and create ImageData (crop to original size)
    const imageData = new ImageData(originalWidth, originalHeight);
    const { data } = imageData;

    // Calculate offsets to center the spectrum on the original image size
    const offsetY = Math.floor((rows - originalHeight) / 2);
    const offsetX = Math.floor((cols - originalWidth) / 2);

    for (let y = 0; y < originalHeight; y++) {
        for (let x = 0; x < originalWidth; x++) {
            const srcY = y + offsetY;
            const srcX = x + offsetX;

            let normalized = 0;
            if (srcY >= 0 && srcY < rows && srcX >= 0 && srcX < cols && maxMag > 0) {
                normalized = (magnitudes[srcY][srcX] / maxMag) * 255;
            }

            const idx = (y * originalWidth + x) * 4;
            data[idx] = normalized;     // R
            data[idx + 1] = normalized; // G
            data[idx + 2] = normalized; // B
            data[idx + 3] = 255;        // A
        }
    }

    return imageData;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Applies FFT to an image and returns the magnitude spectrum.
 * 
 * The spectrum is:
 * - Shifted so low frequencies are at the center
 * - Log-scaled for better visualization
 * - Normalized to 0-255 range
 * 
 * @param imageData - Input image
 * @returns Magnitude spectrum as ImageData
 */
export function applyFFTSpectrum(imageData: ImageData): ImageData {
    const { width, height } = imageData;

    // Convert to grayscale matrix
    const grayscale = imageToGrayscale(imageData);

    // Apply 2D FFT
    const spectrum = fft2D(grayscale);

    // Shift to center low frequencies
    const shifted = fftShift(spectrum);

    // Convert to displayable image
    return spectrumToImageData(shifted, width, height);
}

/**
 * Gets the formula description for FFT.
 */
export function getFFTFormula(): string {
    return 'F(u,v) = \\sum_{x=0}^{M-1} \\sum_{y=0}^{N-1} f(x,y) \\cdot e^{-j2\\pi(ux/M + vy/N)}';
}
