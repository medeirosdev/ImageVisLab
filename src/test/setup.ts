import '@testing-library/jest-dom';

// Polyfill for ImageData in jsdom
if (typeof globalThis.ImageData === 'undefined') {
    (globalThis as Record<string, unknown>).ImageData = class ImageData {
        readonly data: Uint8ClampedArray;
        readonly width: number;
        readonly height: number;

        constructor(data: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
            if (typeof data === 'number') {
                // new ImageData(width, height)
                this.width = data;
                this.height = widthOrHeight!;
                this.data = new Uint8ClampedArray(this.width * this.height * 4);
            } else {
                // new ImageData(data, width, height?)
                this.data = data;
                this.width = widthOrHeight!;
                this.height = height ?? data.length / 4 / widthOrHeight!;
            }
        }
    } as unknown as typeof ImageData;
}
