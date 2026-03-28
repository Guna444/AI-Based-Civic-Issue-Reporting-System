"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { fileToBase64 } from "@/lib/utils";

interface ImageUploadProps {
  images: string[];
  imageBase64: string;
  onImagesChange: (urls: string[], base64: string) => void;
  maxImages?: number;
}

export function ImageUpload({
  images,
  imageBase64,
  onImagesChange,
  maxImages = 3,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      if (images.length + fileArray.length > maxImages) {
        toast({
          title: "Too many images",
          description: `Maximum ${maxImages} images allowed.`,
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      const newUrls: string[] = [];
      let newBase64 = imageBase64;

      for (const file of fileArray) {
        try {
          // Upload to server
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Upload failed");
          }

          const { url } = await res.json();
          newUrls.push(url);

          // Get base64 for AI analysis (first image only)
          if (!newBase64) {
            newBase64 = await fileToBase64(file);
          }
        } catch (error) {
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image.",
            variant: "destructive",
          });
        }
      }

      onImagesChange([...images, ...newUrls], newBase64);
      setUploading(false);
    },
    [images, imageBase64, maxImages, onImagesChange, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newBase64 = index === 0 ? "" : imageBase64;
    onImagesChange(newImages, newBase64);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        Issue Images
        <span className="text-gray-400 font-normal ml-1">(up to {maxImages})</span>
      </Label>

      {/* Upload zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-100 rounded-full">
                <Upload className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WebP up to 5MB each
                </p>
              </div>
              <Button type="button" variant="outline" size="sm">
                <ImageIcon className="h-4 w-4 mr-2" />
                Select Images
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  AI Analysis
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-blue-600">
          The first image will be analyzed by Gemini AI for issue classification.
        </p>
      )}
    </div>
  );
}
