import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  ImageIcon,
  Check,
  Trash2,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Maximize2,
  AlertTriangle,
} from "lucide-react";
import { normalizeUploadUrl, saveUploadUrl, removeUploadUrl, getPresignedUrl, uploadToCdn } from "../services/uploads";

interface MultiImageUploaderProps {
  initialUrls?: string[];
  onUpload: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
}

export default function MultiImageUploader({
  initialUrls = [],
  onUpload,
  maxImages = 20,
  className = "",
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialUrls.map(normalizeUploadUrl));
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateImages = useCallback(
    (newImages: string[]) => {
      setImages(newImages);
      onUpload(newImages);
    },
    [onUpload]
  );

  const doUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (fileArray.length === 0) {
        setError("Only image files are allowed");
        return;
      }

      const remaining = maxImages - images.length;
      const toUpload = fileArray.slice(0, remaining);
      if (toUpload.length === 0) return;

      setUploading(true);
      setError(null);
      const newUrls: string[] = [];
      const errors: string[] = [];

      for (const file of toUpload) {
        try {
          const { presignedUrl, cdnUrl } = await getPresignedUrl(file.name, file.type);
          const ok = await uploadToCdn(presignedUrl, file);
          if (ok) {
            const url = normalizeUploadUrl(cdnUrl);
            saveUploadUrl(url);
            newUrls.push(url);
          } else {
            errors.push(`${file.name}: Upload failed`);
          }
        } catch (e: any) {
          console.error("Upload failed:", e);
          errors.push(`${file.name}: ${e.message || "Network error"}`);
        }
      }

      if (errors.length > 0) {
        setError(errors.join("; "));
      }

      if (newUrls.length > 0) {
        updateImages([...images, ...newUrls]);
      }
      setUploading(false);
    },
    [images, maxImages, updateImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) {
        doUpload(e.dataTransfer.files);
      }
    },
    [doUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        doUpload(e.target.files);
        e.target.value = "";
      }
    },
    [doUpload]
  );

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIndices.size === images.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(images.map((_, i) => i)));
    }
  };

  const deleteSelected = () => {
    selectedIndices.forEach((i) => removeUploadUrl(images[i]));
    const newImages = images.filter((_, i) => !selectedIndices.has(i));
    setSelectedIndices(new Set());
    updateImages(newImages);
  };

  const deleteSingle = (index: number) => {
    removeUploadUrl(images[index]);
    const newImages = images.filter((_, i) => i !== index);
    setSelectedIndices(new Set());
    updateImages(newImages);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
  };

  const goToPrev = () => {
    if (previewIndex !== null && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const goToNext = () => {
    if (previewIndex !== null && previewIndex < images.length - 1) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            {images.length} {images.length === 1 ? "image" : "images"}
            {maxImages < 999 && ` / ${maxImages}`}
          </span>
          {images.length > 0 && (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-primary hover:text-primary/80 font-medium cursor-pointer"
            >
              {selectedIndices.size === images.length
                ? "Deselect all"
                : "Select all"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIndices.size > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedIndices.size})
            </button>
          )}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 cursor-pointer shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Drop Zone / Grid */}
      {images.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
          }`}
        >
          {uploading ? (
            <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-slate-300" />
              <span className="text-sm text-slate-400 font-medium">
                Drop images here or click to browse
              </span>
              <span className="text-xs text-slate-300">
                Supports JPG, PNG, WebP, GIF
              </span>
            </>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-slate-200"
          }`}
        >
          {/* Image Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-3">
            {images.map((url, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
              >
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(index);
                    }}
                    className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:text-primary cursor-pointer"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSingle(index);
                    }}
                    className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:text-red-500 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Selection Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(index);
                  }}
                  className={`absolute top-1.5 left-1.5 w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all ${
                    selectedIndices.has(index)
                      ? "bg-primary text-white"
                      : "bg-white/80 text-transparent group-hover:text-slate-400"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>

                {/* Image Number */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-mono rounded">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add More Button */}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-primary/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-slate-300" />
                    <span className="text-[10px] text-slate-400 font-medium">
                      Add
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={closePreview}
        >
          {/* Close Button */}
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main Image */}
          <div
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[previewIndex]}
              alt={`Preview ${previewIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />

            {/* Navigation */}
            {images.length > 1 && (
              <>
                {previewIndex > 0 && (
                  <button
                    onClick={goToPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                )}
                {previewIndex < images.length - 1 && (
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                )}
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm font-mono px-4 py-2 rounded-full">
              {previewIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto px-4 py-2">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewIndex(idx);
                  }}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    idx === previewIndex
                      ? "border-white scale-110"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
