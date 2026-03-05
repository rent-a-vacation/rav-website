import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const BUCKET_NAME = "dispute-evidence";

export interface EvidenceFile {
  name: string;
  url: string;
  type: string;
}

export function useDisputeEvidence() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<EvidenceFile[]>([]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" has an unsupported type. Use JPEG, PNG, WebP, or PDF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds 10MB limit.`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<EvidenceFile | null> => {
    if (!user) return null;

    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    const evidence: EvidenceFile = {
      name: file.name,
      url: urlData.publicUrl,
      type: file.type,
    };

    setUploadedFiles((prev) => [...prev, evidence]);
    return evidence;
  };

  const uploadFiles = async (files: FileList | File[]): Promise<void> => {
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        await uploadFile(file);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetFiles = () => {
    setUploadedFiles([]);
  };

  const getEvidenceUrls = (): string[] => {
    return uploadedFiles.map((f) => f.url);
  };

  return {
    uploadFiles,
    removeFile,
    resetFiles,
    getEvidenceUrls,
    uploadedFiles,
    isUploading,
    validateFile,
  };
}
