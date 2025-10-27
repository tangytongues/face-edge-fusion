import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Download, Database } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";
import { FilterSelector } from "@/components/FilterSelector";
import { AddFaceDialog } from "@/components/AddFaceDialog";
import { WebcamCapture } from "@/components/WebcamCapture";
import { LiveProcessor } from "@/components/LiveProcessor";
import { applyEdgeFilter, EdgeFilterType } from "@/lib/edgeDetection";
import { loadModels, detectFaces, createLabeledDescriptors, createFaceMatcher, drawDetections } from "@/lib/faceRecognition";
import { supabase } from "@/integrations/supabase/client";
import * as faceapi from 'face-api.js';

const Index = () => {
  const [mode, setMode] = useState<"recognition" | "filter">("recognition");
  const [selectedFilter, setSelectedFilter] = useState<EdgeFilterType>("canny");
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [knownFaces, setKnownFaces] = useState<any[]>([]);
  const [modelsReady, setModelsReady] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [inputMode, setInputMode] = useState<"upload" | "webcam" | "live">("upload");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        setModelsReady(true);
        toast.success("AI models loaded successfully");
        
        // Check for WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          toast.info("WebGL not available - using CPU mode (slower performance)", {
            duration: 5000
          });
        }
      } catch (error) {
        console.error("Error loading models:", error);
        toast.error("Failed to load AI models. Please refresh the page.");
      }
    };
    init();
    loadKnownFaces();
  }, []);

  const loadKnownFaces = async () => {
    try {
      const { data, error } = await supabase
        .from('known_faces')
        .select('*');

      if (error) throw error;
      setKnownFaces(data || []);
    } catch (error) {
      console.error("Error loading faces:", error);
    }
  };

  const handleImageUpload = (file: File) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      setUploadedImage(img);
      setProcessedCanvas(null);
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
    toast.success("Image loaded");
  };

  const handleWebcamCapture = (img: HTMLImageElement) => {
    setUploadedImage(img);
    setProcessedCanvas(null);
    toast.success("Image captured");
  };

  const processImage = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setProcessing(true);

    try {
      if (mode === "recognition") {
        if (!modelsReady) {
          toast.error("AI models are still loading. Please wait...");
          setProcessing(false);
          return;
        }

        console.log("Processing image for face detection...");
        const detections = await detectFaces(uploadedImage);

        if (!detections || detections.length === 0) {
          toast.info("No faces detected in the image. Try a clearer photo with visible faces.");
          setProcessing(false);
          return;
        }

        // Create face matcher from known faces
        let faceMatcher: faceapi.FaceMatcher | null = null;
        
        if (knownFaces.length > 0) {
          const labeledDescriptors = knownFaces.map(face => {
            const descriptors = [new Float32Array(face.descriptor)];
            return createLabeledDescriptors(face.name, descriptors);
          });
          faceMatcher = createFaceMatcher(labeledDescriptors);
        }

        // Create canvas for drawing
        const canvas = document.createElement('canvas');
        canvas.width = uploadedImage.naturalWidth || uploadedImage.width;
        canvas.height = uploadedImage.naturalHeight || uploadedImage.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(uploadedImage, 0, 0);
          drawDetections(canvas, detections, faceMatcher);
        }

        setProcessedCanvas(canvas);
        toast.success(`Detected ${detections.length} face(s)`);
      } else {
        const canvas = applyEdgeFilter(uploadedImage, selectedFilter);
        setProcessedCanvas(canvas);
        toast.success("Filter applied successfully");
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedCanvas) {
      toast.error("No processed image to download");
      return;
    }

    processedCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image downloaded");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            🧠 Face Recognition & Edge Detection Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered face recognition meets digital image processing
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Face Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-based detection using neural network embeddings to identify and recognize faces
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                Edge Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Filter-based digital processing to detect edges and boundaries in images
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Mode Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={mode === "recognition" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setMode("recognition")}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Face Recognition
                </Button>
                <Button
                  variant={mode === "filter" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setMode("filter")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Edge Detection
                </Button>
              </CardContent>
            </Card>

            {mode === "filter" && (
              <FilterSelector
                selectedFilter={selectedFilter}
                onFilterSelect={setSelectedFilter}
              />
            )}

            {mode === "recognition" && (
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="w-5 h-5 text-primary" />
                    Dataset Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <AddFaceDialog onFaceAdded={loadKnownFaces} />
                  <div className="text-sm text-muted-foreground">
                    {knownFaces.length} face(s) in dataset
                  </div>
                  {knownFaces.length > 0 && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {knownFaces.map((face) => (
                        <div key={face.id} className="text-sm px-2 py-1 bg-muted rounded">
                          {face.name}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Input Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={inputMode === "upload" ? "default" : "outline"}
                onClick={() => setInputMode("upload")}
                className="flex-1"
              >
                Upload Image
              </Button>
              <Button
                variant={inputMode === "webcam" ? "default" : "outline"}
                onClick={() => setInputMode("webcam")}
                className="flex-1"
              >
                Webcam Capture
              </Button>
              <Button
                variant={inputMode === "live" ? "default" : "outline"}
                onClick={() => setInputMode("live")}
                className="flex-1"
              >
                Live Processing
              </Button>
            </div>

            {inputMode === "upload" && (
              <ImageUploader onImageUpload={handleImageUpload} />
            )}

            {inputMode === "webcam" && (
              <WebcamCapture
                onCapture={handleWebcamCapture}
                isActive={webcamActive}
                onToggle={setWebcamActive}
              />
            )}

            {inputMode === "live" && (
              <LiveProcessor
                mode={mode}
                selectedFilter={selectedFilter}
                knownFaces={knownFaces}
                modelsReady={modelsReady}
              />
            )}

            {inputMode !== "live" && uploadedImage && (
              <>
                <div className="flex gap-2">
                  <Button onClick={processImage} disabled={processing} className="flex-1">
                    {processing ? "Processing..." : "Process Image"}
                  </Button>
                  {processedCanvas && (
                    <Button onClick={downloadImage} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>

                <Tabs defaultValue="original" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="processed" disabled={!processedCanvas}>
                      Processed
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="original" className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <img
                          src={uploadedImage.src}
                          alt="Original"
                          className="w-full h-auto rounded-lg"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="processed">
                    {processedCanvas && (
                      <Card>
                        <CardContent className="p-6">
                          <canvas
                            ref={canvasRef}
                            width={processedCanvas.width}
                            height={processedCanvas.height}
                            className="w-full h-auto rounded-lg"
                            style={{
                              backgroundImage: `url(${processedCanvas.toDataURL()})`,
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'center'
                            }}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
          Created by Victor Khang — A Fusion of AI Recognition and Digital Image Processing
        </div>
      </div>
    </div>
  );
};

export default Index;
