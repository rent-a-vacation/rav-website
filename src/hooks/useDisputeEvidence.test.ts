import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDisputeEvidence } from "./useDisputeEvidence";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-123" },
  }),
}));

// Mock Supabase storage
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  },
}));

describe("useDisputeEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.com/evidence/photo.jpg" },
    });
  });

  it("validateFile accepts valid image types", () => {
    const { result } = renderHook(() => useDisputeEvidence());

    const jpegFile = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    const pngFile = new File(["x"], "photo.png", { type: "image/png" });
    const webpFile = new File(["x"], "photo.webp", { type: "image/webp" });
    const pdfFile = new File(["x"], "doc.pdf", { type: "application/pdf" });

    expect(result.current.validateFile(jpegFile)).toBeNull();
    expect(result.current.validateFile(pngFile)).toBeNull();
    expect(result.current.validateFile(webpFile)).toBeNull();
    expect(result.current.validateFile(pdfFile)).toBeNull();
  });

  it("validateFile rejects unsupported file types", () => {
    const { result } = renderHook(() => useDisputeEvidence());

    const gifFile = new File(["x"], "anim.gif", { type: "image/gif" });
    expect(result.current.validateFile(gifFile)).toContain("unsupported type");

    const zipFile = new File(["x"], "archive.zip", { type: "application/zip" });
    expect(result.current.validateFile(zipFile)).toContain("unsupported type");
  });

  it("validateFile rejects files over 10MB", () => {
    const { result } = renderHook(() => useDisputeEvidence());

    // Create a file object with size > 10MB
    const bigFile = new File(["x"], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 11 * 1024 * 1024 });

    expect(result.current.validateFile(bigFile)).toContain("exceeds 10MB");
  });

  it("getEvidenceUrls returns uploaded file URLs", async () => {
    const { result } = renderHook(() => useDisputeEvidence());

    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.uploadFiles([file] as unknown as FileList);
    });

    const urls = result.current.getEvidenceUrls();
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://example.com/evidence/photo.jpg");
  });

  it("removeFile removes a file by index", async () => {
    const { result } = renderHook(() => useDisputeEvidence());

    const file1 = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const file2 = new File(["b"], "b.jpg", { type: "image/jpeg" });

    mockGetPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: "https://example.com/a.jpg" } })
      .mockReturnValueOnce({ data: { publicUrl: "https://example.com/b.jpg" } });

    await act(async () => {
      await result.current.uploadFiles([file1, file2] as unknown as FileList);
    });

    expect(result.current.uploadedFiles).toHaveLength(2);

    act(() => {
      result.current.removeFile(0);
    });

    expect(result.current.uploadedFiles).toHaveLength(1);
    expect(result.current.uploadedFiles[0].name).toBe("b.jpg");
  });

  it("resetFiles clears all uploaded files", async () => {
    const { result } = renderHook(() => useDisputeEvidence());

    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.uploadFiles([file] as unknown as FileList);
    });

    expect(result.current.uploadedFiles).toHaveLength(1);

    act(() => {
      result.current.resetFiles();
    });

    expect(result.current.uploadedFiles).toHaveLength(0);
  });
});
