# ImageVisLab - Formula Reference

> Complete mathematical reference for all image processing operations

---

## Point Operations (Intensity Transformations)

Point operations transform each pixel independently based only on its intensity value.

### Negative Transform

**Formula:**
```
s = (L - 1) - r
```

**Variables:**
| Symbol | Meaning |
|--------|---------|
| `s` | Output intensity |
| `r` | Input intensity |
| `L` | Number of gray levels (256 for 8-bit) |

**Effect:** Creates a photographic negative. Dark becomes light, light becomes dark.

---

### Power-Law (Gamma) Transformation

**Formula:**
```
s = c * r^gamma
```

**Variables:**
| Symbol | Meaning | Typical Range |
|--------|---------|---------------|
| `s` | Output intensity | [0, 255] |
| `r` | Normalized input | [0, 1] |
| `c` | Scaling constant | 1.0 |
| `gamma` | Gamma exponent | [0.1, 5.0] |

**Effects:**
- `gamma < 1`: Brightens image (expands dark tones)
- `gamma = 1`: No change
- `gamma > 1`: Darkens image (compresses dark tones)

**Applications:** Monitor calibration, contrast enhancement

---

### Logarithmic Transformation

**Formula:**
```
s = c * log(1 + r)
```

**Variables:**
| Symbol | Meaning |
|--------|---------|
| `s` | Output intensity |
| `r` | Input intensity |
| `c` | Scaling constant (255/log(256)) |

**Effect:** Compresses high dynamic range. Maps narrow dark range to wide output range.

**Application:** Displaying Fourier spectra, HDR images

---

### Quantization (Bit Depth Reduction)

**Formula:**
```
s = floor(r / k) * k + (k / 2)
```

Where `k = 256 / levels`

**Variables:**
| Symbol | Meaning | Example |
|--------|---------|---------|
| `r` | Input intensity | 127 |
| `levels` | Number of output levels | 8 |
| `k` | Step size | 32 |
| `s` | Quantized output | 112 |

**Effect:** Posterization effect, reduces unique colors.

---

### Subsampling (Spatial Resolution Reduction)

**Method:**
```
For each block of size n x n:
    output = average(all pixels in block)
```

**Variables:**
| Symbol | Meaning | Range |
|--------|---------|-------|
| `n` | Block size | [1, 32] |

**Effect:** Pixelation effect, reduces image detail.

---

### Histogram Equalization

**Formula:**
```
s_k = round((L - 1) * CDF(r_k))
```

Where:
```
CDF(r_k) = Sum p(r_j)  for j = 0 to k
p(r_j) = n_j / n
```

**Variables:**
| Symbol | Meaning |
|--------|---------|
| `s_k` | Output intensity for level k |
| `L` | Number of gray levels |
| `CDF` | Cumulative Distribution Function |
| `p(r_j)` | Probability of intensity j |
| `n_j` | Number of pixels with intensity j |
| `n` | Total number of pixels |

**Effect:** Spreads histogram to use full dynamic range, enhances contrast.

---

## Spatial Filters (Convolution)

Spatial filters use pixel neighborhoods to compute output values.

### General Convolution

**Formula:**
```
g(x,y) = Sum Sum f(x+i, y+j) * h(i,j)
         i   j
```

**Variables:**
| Symbol | Meaning |
|--------|---------|
| `g(x,y)` | Output pixel at (x,y) |
| `f(x,y)` | Input pixel at (x,y) |
| `h(i,j)` | Kernel/mask coefficient |

---

### Box Blur (Mean Filter)

**Kernel (3x3):**
```
    1/9  1/9  1/9
    1/9  1/9  1/9
    1/9  1/9  1/9
```

**Formula:**
```
g(x,y) = (1/n^2) * Sum f(x+i, y+j)
```

**Effect:** Simple smoothing, reduces noise but also blurs edges.

---

### Gaussian Blur

**Kernel Generation:**
```
G(x,y) = (1 / 2*pi*sigma^2) * exp(-(x^2 + y^2) / 2*sigma^2)
```

**3x3 Kernel (sigma=1):**
```
    0.075  0.124  0.075
    0.124  0.204  0.124
    0.075  0.124  0.075
```

**Variables:**
| Symbol | Meaning | Range |
|--------|---------|-------|
| `sigma` | Standard deviation | [0.5, 3.0] |
| `n` | Kernel size | 3, 5, 7 |

**Effect:** Smooth blur that preserves edges better than box blur.

---

### Sharpening (Unsharp Mask)

**Formula:**
```
sharpened = original + k * (original - blurred)
```

**Laplacian Kernel:**
```
     0  -1   0
    -1   5  -1
     0  -1   0
```

**Effect:** Enhances edges and fine details.

---

### Laplacian (Edge Detection)

**Formula:**
```
Nabla^2 f = d^2f/dx^2 + d^2f/dy^2
```

**Kernel:**
```
     0  -1   0
    -1   4  -1
     0  -1   0
```

**Effect:** Detects edges (zero-crossings indicate edges).

---

## Morphological Operations

Binary operations using structuring elements.

### Binarization (Thresholding)

**Formula:**
```
s = { 0,   if r < T
    { 255, if r >= T
```

**Variables:**
| Symbol | Meaning | Range |
|--------|---------|-------|
| `r` | Input intensity | [0, 255] |
| `T` | Threshold | [0, 255] |
| `s` | Output (binary) | 0 or 255 |

---

### Erosion

**Set Definition:**
```
A - B = { z | B_z subset A }
```

**Meaning:** Output pixel is white only if ALL pixels under the structuring element are white.

**3x3 Square Element:**
```
    1  1  1
    1  1  1
    1  1  1
```

**Effect:** Shrinks white regions, removes small white noise.

---

### Dilation

**Set Definition:**
```
A + B = { z | B_z intersect A != empty }
```

**Meaning:** Output pixel is white if ANY pixel under the structuring element is white.

**Effect:** Expands white regions, fills small black holes.

---

### Opening

**Formula:**
```
A o B = (A - B) + B
```

**Process:** Erosion followed by Dilation

**Effect:** 
- Removes small white objects
- Smooths object boundaries
- Separates weakly connected objects

---

### Closing

**Formula:**
```
A . B = (A + B) - B
```

**Process:** Dilation followed by Erosion

**Effect:**
- Fills small black holes
- Connects nearby objects
- Smooths object boundaries

---

## Distance Metrics

Used in the pixel inspector for neighborhood analysis.

### D4 (City Block / Manhattan)

**Formula:**
```
D4(p, q) = |x_p - x_q| + |y_p - y_q|
```

**4-connected neighborhood:** Shares edge with center pixel.

---

### D8 (Chessboard / Chebyshev)

**Formula:**
```
D8(p, q) = max(|x_p - x_q|, |y_p - y_q|)
```

**8-connected neighborhood:** Shares edge OR corner with center pixel.

---

### DE (Euclidean)

**Formula:**
```
DE(p, q) = sqrt[(x_p - x_q)^2 + (y_p - y_q)^2]
```

**True geometric distance** between pixels.

---

## References

1. Gonzalez, R.C. & Woods, R.E. (2018). *Digital Image Processing* (4th ed.). Pearson.
2. Szeliski, R. (2022). *Computer Vision: Algorithms and Applications* (2nd ed.). Springer.

---

*Generated by ImageVisLab Documentation*
