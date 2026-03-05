import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EvidenceFile } from "@/hooks/useDisputeEvidence";

interface EvidenceUploadProps {
  uploadedFiles: EvidenceFile[];
  isUploading: boolean;
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (index: number) => void;
}

const EvidenceUpload = ({
  uploadedFiles,
  isUploading,
  onUpload,
  onRemove,
}: EvidenceUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      await onUpload(files);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file.",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Attach Evidence
        </Button>
        <span className="text-xs text-muted-foreground">
          JPEG, PNG, WebP, or PDF (max 10MB each)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
            >
              {file.type.startsWith("image/") ? (
                <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate flex-1">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRemove(i)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceUpload;
