import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, AlertTriangle } from "lucide-react";
import { normalizeUploadUrl, saveUploadUrl, removeUploadUrl, getPresignedUrl, uploadToCdn } from "../services/uploads";

interface ImageUploaderProps {
  initialUrl?: string;
  onUpload: (url: string) => void;
  className?: string;
}

export default function ImageUploader({ initialUrl, onUpload, className }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ? normalizeUploadUrl(initialUrl) : null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    setUploading(true);
    setError(null);
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    try {
      const { presignedUrl, cdnUrl } = await getPresignedUrl(file.name, file.type);
      const ok = await uploadToCdn(presignedUrl, file);
      if (ok) {
        const url = normalizeUploadUrl(cdnUrl);
        URL.revokeObjectURL(blobUrl);
        setPreview(url);
        saveUploadUrl(url);
        onUpload(url);
      } else {
        setError("Upload failed");
        URL.revokeObjectURL(blobUrl);
        setPreview(null);
      }
    } catch (e: any) {
      console.error("Upload failed:", e);
      setError(e.message || "Network error. Please try again.");
      URL.revokeObjectURL(blobUrl);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  }, [doUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  }, [doUpload]);

  const handleRemove = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    if (preview) removeUploadUrl(preview);
    setPreview(null);
    setError(null);
    onUpload("");
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 rounded-xl object-cover bg-slate-100 border border-slate-200"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 bg-white/90 rounded-lg text-slate-600 hover:text-primary cursor-pointer shadow-xs text-xs flex items-center gap-1"
              title="Change image"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-white/90 rounded-lg text-slate-600 hover:text-red-500 cursor-pointer shadow-xs"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
          }`}
        >
          {uploading ? (
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-slate-300" />
              <span className="text-xs text-slate-400 font-medium">
                Drop image or click to browse
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
