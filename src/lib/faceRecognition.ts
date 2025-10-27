import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  
  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    throw error;
  }
};

export const detectFaces = async (imageElement: HTMLImageElement) => {
  try {
    if (!modelsLoaded) {
      throw new Error('Models not loaded yet');
    }
    
    const detections = await faceapi
      .detectAllFaces(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    console.log(`Detected ${detections.length} face(s)`);
    return detections;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
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
