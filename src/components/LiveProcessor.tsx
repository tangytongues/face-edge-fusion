import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Square } from "lucide-react";
import { toast } from "sonner";
import * as faceapi from 'face-api.js';
import { detectFaces, createLabeledDescriptors, createFaceMatcher, drawDetections } from "@/lib/faceRecognition";
import { applyEdgeFilter, EdgeFilterType } from "@/lib/edgeDetection";

interface LiveProcessorProps {
  mode: "recognition" | "filter";
  selectedFilter: EdgeFilterType;
  knownFaces: any[];
  modelsReady: boolean;
}

export const LiveProcessor = ({ mode, selectedFilter, knownFaces, modelsReady }: LiveProcessorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, []);

  const startProcessing = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsProcessing(true);
      toast.success("Live processing started");
      processFrame();
    } catch (error) {
      console.error("Error starting live processing:", error);
      toast.error("Failed to start camera");
    }
  };

  const stopProcessing = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsProcessing(false);
    toast.info("Live processing stopped");
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      if (mode === "recognition" && modelsReady) {
        // Draw video frame
        ctx.drawImage(video, 0, 0);

        // Create temporary image for face detection
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(video, 0, 0);
        }

        const img = document.createElement('img');
        img.src = tempCanvas.toDataURL();
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const detections = await detectFaces(img);

        if (detections && detections.length > 0) {
          let faceMatcher: faceapi.FaceMatcher | null = null;
          
          if (knownFaces.length > 0) {
            const labeledDescriptors = knownFaces.map(face => {
              const descriptors = [new Float32Array(face.descriptor)];
              return createLabeledDescriptors(face.name, descriptors);
            });
            faceMatcher = createFaceMatcher(labeledDescriptors);
          }

          drawDetections(canvas, detections, faceMatcher);
        }
      } else if (mode === "filter") {
        const img = document.createElement('img');
        img.width = video.videoWidth;
        img.height = video.videoHeight;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(video, 0, 0);
          img.src = tempCanvas.toDataURL();
          
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const filtered = applyEdgeFilter(img, selectedFilter);
          ctx.drawImage(filtered, 0, 0);
        }
      }
    } catch (error) {
      console.error("Error processing frame:", error);
    }

    animationRef.current = requestAnimationFrame(processFrame);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-secondary" />
          Live Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: isProcessing ? 'none' : 'block' }}
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: isProcessing ? 'block' : 'none' }}
          />
        </div>

        <Button
          onClick={isProcessing ? stopProcessing : startProcessing}
          variant={isProcessing ? "destructive" : "default"}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop Live Processing
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Start Live Processing
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
