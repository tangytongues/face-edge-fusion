import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploader = ({ onImageUpload }: ImageUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  return (
    <Card className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
      <label className="flex flex-col items-center justify-center p-8 cursor-pointer">
        <Upload className="w-12 h-12 mb-4 text-primary" />
        <span className="text-lg font-medium mb-2">Upload Image</span>
        <span className="text-sm text-muted-foreground">
          Click to select an image file
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </Card>
  );
};
