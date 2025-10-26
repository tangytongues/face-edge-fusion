import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as faceapi from 'face-api.js';
import { loadModels, detectFaces } from "@/lib/faceRecognition";

interface AddFaceDialogProps {
  onFaceAdded: () => void;
}

export const AddFaceDialog = ({ onFaceAdded }: AddFaceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !file) {
      toast.error("Please provide both name and image");
      return;
    }

    setLoading(true);
    try {
      await loadModels();

      // Create image element
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Detect face and get descriptor
      const detections = await detectFaces(img);
      
      if (!detections || detections.length === 0) {
        toast.error("No face detected in the image");
        URL.revokeObjectURL(url);
        setLoading(false);
        return;
      }

      if (detections.length > 1) {
        toast.error("Multiple faces detected. Please upload an image with only one face");
        URL.revokeObjectURL(url);
        setLoading(false);
        return;
      }

      const descriptor = Array.from(detections[0].descriptor);

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('faces')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('faces')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('known_faces')
        .insert({
          name,
          image_url: publicUrl,
          descriptor: descriptor
        });

      if (dbError) throw dbError;

      toast.success(`${name} added to dataset!`);
      setName("");
      setFile(null);
      setOpen(false);
      onFaceAdded();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error adding face:", error);
      toast.error(error.message || "Failed to add face");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New Face
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Face to Dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Person's Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
          <div>
            <Label htmlFor="face-image">Face Image</Label>
            <Input
              id="face-image"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Processing..." : "Add to Dataset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
