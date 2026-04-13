import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileJson } from "lucide-react";
import {
  validateResortJson,
  findDuplicateResorts,
  generateTemplateJson,
  type ResortImportRow,
  type DuplicateCheckResult,
} from "@/lib/resortImportUtils";

type ImportStep = "upload" | "preview" | "results";

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

const AdminResortImport = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<DuplicateCheckResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = () => {
    const template = generateTemplateJson();
    const blob = new Blob([template], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resort-import-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = validateResortJson(parsed);

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Fetch existing resorts for duplicate check
      const { data: existingResorts } = await supabase
        .from("resorts")
        .select("id, resort_name, brand, location");

      const duplicateResults = findDuplicateResorts(
        validation.rows,
        (existingResorts || []) as Array<{ id: string; resort_name: string; brand: string; location: { city?: string; state?: string } | null }>
      );

      setPreviewData(duplicateResults);
      setValidationErrors([]);
      setStep("preview");
    } catch {
      setValidationErrors(["Invalid JSON file. Please check the format and try again."]);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    const newResorts = previewData.filter((d) => !d.isDuplicate);
    if (newResorts.length === 0) {
      toast({
        title: "Nothing to import",
        description: "All resorts already exist in the database.",
      });
      return;
    }

    setIsImporting(true);
    const errors: string[] = [];
    let inserted = 0;

    for (const { row } of newResorts) {
      const { error } = await supabase.from("resorts").insert({
        resort_name: row.resort_name,
        brand: row.brand,
        location: row.location,
        description: row.description || null,
        resort_amenities: row.resort_amenities || null,
        attraction_tags: row.attraction_tags || [],
        guest_rating: row.guest_rating || null,
        nearby_airports: row.nearby_airports || null,
      });

      if (error) {
        errors.push(`${row.resort_name}: ${error.message}`);
      } else {
        inserted++;
      }
    }

    const skipped = previewData.filter((d) => d.isDuplicate).length;
    setImportResult({ inserted, skipped, errors });
    setStep("results");
    setIsImporting(false);

    toast({
      title: "Import complete",
      description: `${inserted} imported, ${skipped} skipped${errors.length > 0 ? `, ${errors.length} errors` : ""}.`,
    });
  };

  const resetImport = () => {
    setStep("upload");
    setPreviewData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Resort Data Import</h2>
        <p className="text-muted-foreground">
          Import resort master data from a JSON file. Duplicates are detected by resort name + brand + city.
        </p>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Upload Resort Data
            </CardTitle>
            <CardDescription>
              Upload a JSON file containing an array of resort objects. Download the template below for the expected format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload JSON File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Validation Errors
                </h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {validationErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              {previewData.filter((d) => !d.isDuplicate).length} new resorts,{" "}
              {previewData.filter((d) => d.isDuplicate).length} duplicates (will be skipped)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Resort Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((item, i) => (
                  <TableRow key={i} className={item.isDuplicate ? "opacity-50" : ""}>
                    <TableCell>
                      {item.isDuplicate ? (
                        <Badge variant="secondary">DUPLICATE</Badge>
                      ) : (
                        <Badge className="bg-green-500">NEW</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.row.resort_name}</TableCell>
                    <TableCell>{item.row.brand.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      {item.row.location.city}, {item.row.location.state}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetImport}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || previewData.every((d) => d.isDuplicate)}
              >
                {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import {previewData.filter((d) => !d.isDuplicate).length} Resorts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === "results" && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700">{importResult.inserted}</p>
                <p className="text-sm text-green-600">Imported</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-700">{importResult.skipped}</p>
                <p className="text-sm text-gray-600">Skipped (duplicates)</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-700">{importResult.errors.length}</p>
                <p className="text-sm text-red-600">Errors</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Import Errors</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={resetImport}>Import More</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminResortImport;
