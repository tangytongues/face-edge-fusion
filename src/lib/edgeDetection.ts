export type EdgeFilterType = 'canny' | 'sobel' | 'laplacian';

const applyGrayscale = (imageData: ImageData): ImageData => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return imageData;
};

const convolve = (imageData: ImageData, kernel: number[][], divisor: number = 1): ImageData => {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);
  const kSize = Math.floor(kernel.length / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      
      for (let ky = -kSize; ky <= kSize; ky++) {
        for (let kx = -kSize; kx <= kSize; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = (py * width + px) * 4;
          sum += data[idx] * kernel[ky + kSize][kx + kSize];
        }
      }
      
      const idx = (y * width + x) * 4;
      const value = Math.abs(sum / divisor);
      result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = value;
      result.data[idx + 3] = 255;
    }
  }
  
  return result;
};

export const applySobelFilter = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const grayData = applyGrayscale(imageData);

  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  const edgeX = convolve(grayData, sobelX);
  const edgeY = convolve(grayData, sobelY);

  const result = new ImageData(canvas.width, canvas.height);
  for (let i = 0; i < edgeX.data.length; i += 4) {
    const magnitude = Math.sqrt(
      edgeX.data[i] ** 2 + edgeY.data[i] ** 2
    );
    result.data[i] = result.data[i + 1] = result.data[i + 2] = magnitude;
    result.data[i + 3] = 255;
  }

  ctx.putImageData(result, 0, 0);
  return canvas;
};

export const applyCannyFilter = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const grayData = applyGrayscale(imageData);

  // Gaussian blur
  const gaussianKernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  const blurred = convolve(grayData, gaussianKernel, 16);

  // Sobel for edge detection
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  const edgeX = convolve(blurred, sobelX);
  const edgeY = convolve(blurred, sobelY);

  const result = new ImageData(canvas.width, canvas.height);
  for (let i = 0; i < edgeX.data.length; i += 4) {
    const magnitude = Math.sqrt(
      edgeX.data[i] ** 2 + edgeY.data[i] ** 2
    );
    const threshold = magnitude > 50 ? 255 : 0;
    result.data[i] = result.data[i + 1] = result.data[i + 2] = threshold;
    result.data[i + 3] = 255;
  }

  ctx.putImageData(result, 0, 0);
  return canvas;
};

export const applyLaplacianFilter = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const grayData = applyGrayscale(imageData);

  const laplacianKernel = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0]
  ];

  const result = convolve(grayData, laplacianKernel);
  ctx.putImageData(result, 0, 0);
  return canvas;
};

export const applyEdgeFilter = (
  image: HTMLImageElement,
  filterType: EdgeFilterType
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  ctx.drawImage(image, 0, 0);

  switch (filterType) {
    case 'canny':
      return applyCannyFilter(canvas);
    case 'sobel':
      return applySobelFilter(canvas);
    case 'laplacian':
      return applyLaplacianFilter(canvas);
    default:
      return canvas;
  }
};
