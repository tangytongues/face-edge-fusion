import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Camera } from "lucide-react";
import { toast } from "sonner";

interface WebcamCaptureProps {
  onCapture: (imageData: HTMLImageElement) => void;
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export const WebcamCapture = ({ onCapture, isActive, onToggle }: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (isActive) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isActive]);

  const startWebcam = async () => {
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
        videoRef.current.play();
      }
      setHasPermission(true);
      toast.success("Webcam activated");
    } catch (error) {
      console.error("Error accessing webcam:", error);
      toast.error("Failed to access webcam");
      onToggle(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const img = document.createElement('img');
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        onCapture(img);
        URL.revokeObjectURL(url);
        toast.success("Frame captured");
      };
      
      img.src = url;
    }, 'image/jpeg', 0.95);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-primary" />
          Live Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
          {isActive ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoOff className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onToggle(!isActive)}
            variant={isActive ? "destructive" : "default"}
            className="flex-1"
          >
            {isActive ? (
              <>
                <VideoOff className="w-4 h-4 mr-2" />
                Stop Camera
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>

          {isActive && (
            <Button onClick={captureFrame} variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
