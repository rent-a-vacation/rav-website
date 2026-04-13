import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, CheckCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface TaxData {
  tax_id_type: "ssn" | "ein" | null;
  tax_id_last4: string | null;
  w9_submitted_at: string | null;
  tax_business_name: string | null;
  tax_address_line1: string | null;
  tax_address_line2: string | null;
  tax_city: string | null;
  tax_state: string | null;
  tax_zip: string | null;
}

export function OwnerTaxInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [taxData, setTaxData] = useState<TaxData>({
    tax_id_type: null,
    tax_id_last4: null,
    w9_submitted_at: null,
    tax_business_name: null,
    tax_address_line1: null,
    tax_address_line2: null,
    tax_city: null,
    tax_state: null,
    tax_zip: null,
  });
  const [taxIdInput, setTaxIdInput] = useState("");
  const [w9Acknowledged, setW9Acknowledged] = useState(false);

  // Fetch existing tax data
  useEffect(() => {
    if (!user) return;
    const fetchTaxData = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("profiles") as any)
        .select("tax_id_type, tax_id_last4, w9_submitted_at, tax_business_name, tax_address_line1, tax_address_line2, tax_city, tax_state, tax_zip")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setTaxData(data as TaxData);
        if (data.w9_submitted_at) setW9Acknowledged(true);
      }
      setIsLoading(false);
    };
    fetchTaxData();
  }, [user]);

  const isSubmitted = !!taxData.w9_submitted_at;
  const isEin = taxData.tax_id_type === "ein";

  const canSave =
    taxData.tax_id_type &&
    taxIdInput.length === 4 &&
    /^\d{4}$/.test(taxIdInput) &&
    taxData.tax_address_line1?.trim() &&
    taxData.tax_city?.trim() &&
    taxData.tax_state &&
    taxData.tax_zip?.trim() &&
    /^\d{5}(-\d{4})?$/.test(taxData.tax_zip?.trim() || "") &&
    w9Acknowledged &&
    (!isEin || taxData.tax_business_name?.trim());

  const handleSave = async () => {
    if (!user || !canSave) return;
    setIsSaving(true);

    try {
      const updateData = {
        tax_id_type: taxData.tax_id_type,
        tax_id_last4: taxIdInput,
        tax_business_name: isEin ? taxData.tax_business_name : null,
        tax_address_line1: taxData.tax_address_line1,
        tax_address_line2: taxData.tax_address_line2 || null,
        tax_city: taxData.tax_city,
        tax_state: taxData.tax_state,
        tax_zip: taxData.tax_zip,
        w9_submitted_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("profiles") as any)
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      setTaxData((prev) => ({ ...prev, ...updateData }));
      toast({
        title: "Tax information saved",
        description: "Your W-9 information has been submitted successfully.",
      });
    } catch (error) {
      console.error("Error saving tax info:", error);
      toast({
        title: "Error",
        description: "Failed to save tax information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof TaxData, value: string | null) => {
    setTaxData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Tax Information (W-9)
            </CardTitle>
            <CardDescription className="mt-1">
              Required for 1099-K tax reporting if you earn $600 or more per year.
            </CardDescription>
          </div>
          {isSubmitted ? (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              W-9 Submitted
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Incomplete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tax ID Type */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Tax ID Type</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="taxIdType"
                checked={taxData.tax_id_type === "ssn"}
                onChange={() => updateField("tax_id_type", "ssn")}
                className="accent-primary"
              />
              <span className="text-sm">Social Security Number (SSN)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="taxIdType"
                checked={taxData.tax_id_type === "ein"}
                onChange={() => updateField("tax_id_type", "ein")}
                className="accent-primary"
              />
              <span className="text-sm">Employer Identification Number (EIN)</span>
            </label>
          </div>
        </div>

        {/* Tax ID Last 4 */}
        <div className="space-y-2">
          <Label htmlFor="taxIdLast4" className="text-sm font-semibold">
            Last 4 digits of your {taxData.tax_id_type === "ein" ? "EIN" : "SSN"}
          </Label>
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-muted-foreground text-sm font-mono">***-**-</span>
            <Input
              id="taxIdLast4"
              type="text"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              placeholder="0000"
              value={taxIdInput || taxData.tax_id_last4 || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setTaxIdInput(val);
              }}
              className="w-24 font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            We only store the last 4 digits for your security. Full tax ID is never stored.
          </p>
        </div>

        {/* Business Name (EIN only) */}
        {isEin && (
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm font-semibold">Business Name</Label>
            <Input
              id="businessName"
              placeholder="Legal business name"
              value={taxData.tax_business_name || ""}
              onChange={(e) => updateField("tax_business_name", e.target.value)}
            />
          </div>
        )}

        {/* Address */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Tax Address</Label>
          <div className="space-y-3">
            <Input
              placeholder="Address line 1"
              value={taxData.tax_address_line1 || ""}
              onChange={(e) => updateField("tax_address_line1", e.target.value)}
            />
            <Input
              placeholder="Address line 2 (optional)"
              value={taxData.tax_address_line2 || ""}
              onChange={(e) => updateField("tax_address_line2", e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="City"
                value={taxData.tax_city || ""}
                onChange={(e) => updateField("tax_city", e.target.value)}
              />
              <Select
                value={taxData.tax_state || ""}
                onValueChange={(v) => updateField("tax_state", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="ZIP"
                value={taxData.tax_zip || ""}
                onChange={(e) => updateField("tax_zip", e.target.value)}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* W-9 Acknowledgment */}
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
          <Checkbox
            id="w9Acknowledge"
            checked={w9Acknowledged}
            onCheckedChange={(checked) => setW9Acknowledged(checked === true)}
          />
          <label htmlFor="w9Acknowledge" className="text-sm cursor-pointer leading-relaxed">
            <strong>W-9 Certification:</strong> Under penalties of perjury, I certify that the information provided above is correct, including my taxpayer identification number (last 4 digits). I understand this information will be used for IRS Form 1099-K reporting if my earnings exceed $600 in a calendar year.
          </label>
        </div>

        {/* Info note */}
        <div className="flex gap-2 text-xs text-muted-foreground bg-primary/5 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <p>
            The IRS requires platforms to issue Form 1099-K if you receive $600 or more in a calendar year. Your tax information is encrypted and only used for tax reporting purposes.
          </p>
        </div>

        {/* Save button */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isSubmitted ? (
              "Update Tax Information"
            ) : (
              "Submit W-9 Information"
            )}
          </Button>
          {isSubmitted && taxData.w9_submitted_at && (
            <p className="text-xs text-muted-foreground self-center">
              Last submitted: {new Date(taxData.w9_submitted_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
