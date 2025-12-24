# ImageVisLab v1.0

> Interactive Digital Image Processing Simulator for Education

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

ImageVisLab is a visual educational tool that helps students understand digital image processing algorithms through real-time visualization. Watch formulas come to life as you apply filters to images!

## Features

### Point Operations (6 filters)
| Filter | Formula | Description |
|--------|---------|-------------|
| Negative | `s = L - 1 - r` | Inverts intensity values |
| Gamma | `s = c * r^y` | Power-law transformation |
| Logarithmic | `s = c * log(1 + r)` | Expands dark tones |
| Quantization | `s = floor(r/k) * k` | Reduces gray levels |
| Subsampling | Block averaging | Reduces spatial resolution |
| Equalization | CDF transformation | Enhances contrast |

### Spatial Filters (4 filters)
| Filter | Kernel | Description |
|--------|--------|-------------|
| Box Blur | Mean kernel | Simple smoothing |
| Gaussian Blur | Gaussian kernel | Weighted smoothing (sigma adjustable) |
| Sharpen | Laplacian + original | Enhances edges |
| Laplacian | Nabla^2 f | Edge detection |

### Morphology Operations (5 filters)
| Filter | Formula | Description |
|--------|---------|-------------|
| Binarization | `s = r >= T ? 255 : 0` | Converts to black & white |
| Erosion | `A - B` | Shrinks white regions |
| Dilation | `A + B` | Expands white regions |
| Opening | `(A - B) + B` | Removes small white noise |
| Closing | `(A + B) - B` | Fills small black holes |

### Inspection Tools
- **Pixel Inspector** - RGB/Hex values with visual bars
- **Magnifier** - 11x11 neighborhood with color-coded zones
- **Distance Metrics** - D4 (Manhattan), D8 (Chebyshev), DE (Euclidean)
- **Histogram** - Real-time comparison (Original vs Processed)

### Visualization Features
- **Formula Panel** - Live LaTeX rendering with variable tracking
- **Animation Mode** - Scanline/Pixel-by-pixel filter visualization
- **Zoom/Pan** - Mouse wheel zoom, Alt+drag pan
- **Undo/Redo** - Ctrl+Z / Ctrl+Y

### UX Improvements
- **Error Boundaries** - Graceful error handling
- **Loading Skeleton** - Visual feedback during image loading
- **Processing Indicator** - Shows when applying slow filters
- **Sample Images** - Quick test with gradient/checkerboard/noise

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/medeirosdev/ImageVisLab.git
cd ImageVisLab

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Usage Guide

### Loading Images
1. Click **Load** button in sidebar
2. Select any image (JPEG, PNG, WebP, etc.)
3. Or use **Sample Images** for quick testing

### Applying Filters
1. Expand a category (Point Operations, Spatial, Morphology)
2. Click on a filter name
3. Adjust parameters with sliders
4. View the formula in the right panel

### Inspecting Pixels
1. Hover over the image
2. View pixel info in the **Inspector** tab
3. See neighborhood colors in the magnifier
4. Check distance metrics (D4, D8, DE)

### Viewing Histogram
1. Click the **Histogram** tab
2. Compare original (hollow) vs processed (filled)
3. Observe how transformations affect distribution

### Animation Mode
1. Click **Play** in the Formula Panel
2. Choose mode: Scanline or Pixel-by-pixel
3. Adjust speed with slider
4. Watch the filter being applied progressively

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` (hold) | View original image |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Alt+Drag` | Pan image |
| `Mouse Wheel` | Zoom in/out |

---

## Formula Reference

### Point Operations

**Negative Transform**
```
s = (L - 1) - r
```
Where `L = 256` for 8-bit images.

**Power-Law (Gamma)**
```
s = c * r^gamma
```
- `gamma < 1`: Brightens dark regions
- `gamma > 1`: Darkens bright regions

**Logarithmic**
```
s = c * log(1 + r)
```
Expands dynamic range of dark pixels.

**Histogram Equalization**
```
s_k = (L-1) * Sum(p_r(r_j))  for j = 0 to k
```
Maps intensities using cumulative distribution function.

### Convolution
```
g(x,y) = Sum Sum f(x+i, y+j) * h(i,j)
```
Where `h` is the kernel/mask.

### Morphological Operations
- **Erosion**: `A - B = { z | B_z subset A }`
- **Dilation**: `A + B = { z | B_z intersect A != empty }`
- **Opening**: `A o B = (A - B) + B`
- **Closing**: `A . B = (A + B) - B`

---

## Project Structure

```
src/
├── components/
│   ├── ErrorBoundary/    # Error handling
│   ├── FormulaPanel/     # LaTeX formula display
│   ├── Histogram/        # Bar chart visualization
│   ├── ImageCanvas/      # Main canvas with zoom/pan
│   ├── LaTeXFormula/     # KaTeX wrapper
│   ├── LoadingSkeleton/  # Loading states
│   ├── PixelInspector/   # Magnifier + RGB info
│   └── Sidebar/          # Filter controls
├── hooks/
│   └── useHistory.ts     # Undo/Redo logic
├── utils/
│   ├── imageFilters.ts   # Point operations
│   ├── convolution.ts    # Spatial filters
│   └── morphology.ts     # Binary operations
├── types/
│   └── index.ts          # TypeScript definitions
├── App.tsx               # Main application
└── index.css             # Design system
```

---

## Completed Features

- [x] **Sprint 1**: MVP with point operations
- [x] **Sprint 2**: Histogram + Distance metrics
- [x] **Sprint 3**: Convolution engine
- [x] **Sprint 4**: Morphological operations
- [x] **UX**: Zoom/Pan, Undo/Redo, Sample images
- [x] **Reliability**: Error boundaries, Loading states

---

## Tech Stack

- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite 6** - Build tool
- **KaTeX** - LaTeX rendering
- **CSS Variables** - Design tokens

---

## References

- *Digital Image Processing* - Gonzalez & Woods (4th Edition)
- *Computer Vision: Algorithms and Applications* - Szeliski

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Author

**ImageVisLab Contributors**

---

Made with care for PDI students
