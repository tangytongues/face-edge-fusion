import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
};

export const detectFaces = async (imageElement: HTMLImageElement) => {
  return await faceapi
    .detectAllFaces(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptors();
};

export const createLabeledDescriptors = (name: string, descriptors: Float32Array[]) => {
  return new faceapi.LabeledFaceDescriptors(name, descriptors);
};

export const createFaceMatcher = (labeledDescriptors: faceapi.LabeledFaceDescriptors[]) => {
  return new faceapi.FaceMatcher(labeledDescriptors, 0.6);
};

export const drawDetections = (
  canvas: HTMLCanvasElement,
  detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>[],
  faceMatcher: faceapi.FaceMatcher | null
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  detections.forEach((detection) => {
    const { x, y, width, height } = detection.detection.box;
    
    let label = 'Unknown';
    let color = '#ff0000';
    
    if (faceMatcher && detection.descriptor) {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      label = bestMatch.label;
      color = bestMatch.label !== 'unknown' ? '#00ff00' : '#ff0000';
    }

    // Draw rectangle
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Draw label background
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 30, width, 30);

    // Draw label text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(label, x + 5, y - 10);
  });
};
