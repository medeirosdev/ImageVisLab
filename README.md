# ImageVisLab

A visual educational tool for understanding digital image processing algorithms.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

ImageVisLab is an interactive PDI (Digital Image Processing) simulator designed for educational purposes. It allows users to visualize and understand how different image processing algorithms work in real-time.

## Features

### Point Operations (Intensity Transformations)
- **Negative** - Inverts intensity values (`s = L - 1 - r`)
- **Gamma Correction** - Power-law transformation with adjustable gamma (`s = c * r^gamma`)
- **Logarithmic** - Expands dark tones (`s = c * log(1 + r)`)
- **Quantization** - Reduces gray levels (simulates bit depth)
- **Subsampling** - Reduces spatial resolution (pixelation effect)
- **Histogram Equalization** - Enhances contrast via CDF transformation

### Inspection Tools
- **Magnifier** - 11x11 pixel neighborhood visualization
- **Pixel Inspector** - RGB/Hex values with channel bars
- **Histogram Viewer** - Original vs Processed comparison
- **Real-time Preview** - Hold Space to view original image

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/medeirosdev/ImageVisLab.git
cd ImageVisLab

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. Click **Load Image** in the sidebar
2. Select an image file (JPEG, PNG, etc.)
3. Choose a transformation from the sidebar
4. Adjust parameters using the sliders
5. Hover over the image to inspect individual pixels
6. Click the **Histogram** tab to compare distributions
7. Hold **Space** to temporarily view the original image

## Project Structure

```
src/
├── components/
│   ├── ImageCanvas/     # Main image display
│   ├── Sidebar/         # Filter controls
│   ├── PixelInspector/  # Magnifier + RGB info
│   └── Histogram/       # Bar chart visualization
├── utils/
│   └── imageFilters.ts  # All filter algorithms
├── types/
│   └── index.ts         # TypeScript definitions
├── App.tsx              # Main application
└── index.css            # Design system
```

## Algorithms

All algorithms are implemented in `src/utils/imageFilters.ts` with:
- Lookup tables for O(1) pixel transformation
- Full JSDoc documentation
- Mathematical formulas in comments

## Roadmap

- [x] Sprint 1: MVP with point operations
- [x] Sprint 2: Histogram visualization
- [ ] Sprint 3: Convolution engine (Box, Gaussian, Laplacian)
- [ ] Sprint 4: Morphological operations (Erosion, Dilation)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Authors

- **ImageVisLab Contributors**

## Acknowledgments

Based on concepts from:
- Digital Image Processing (Gonzalez & Woods)
- Computer Vision courses
