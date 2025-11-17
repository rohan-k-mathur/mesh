// components/arguments/QuickContraryDialog.tsx
"use client";
import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Split } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClaimPicker } from "@/components/claims/ClaimPicker";

interface QuickContraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliberationId: string;
  sourceClaim: {
    id: string;
    text: string;
  };
  onContraryCreated?: () => void;
}

export function QuickContraryDialog({
  open,
  onOpenChange,
  deliberationId,
  sourceClaim,
  onContraryCreated
}: QuickContraryDialogProps) {
  const [selectedContrary, setSelectedContrary] = React.useState<{ id: string; text: string } | null>(null);
  const [isSymmetric, setIsSymmetric] = React.useState(true);
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedContrary(null);
      setIsSymmetric(true);
      setReason("");
      setError(null);
    }
  }, [open]);

  const handleCreateContrary = async () => {
    if (!selectedContrary) {
      setError("Please select a contrary claim");
      return;
    }

    if (selectedContrary.id === sourceClaim.id) {
      setError("A claim cannot be contrary to itself");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contraries/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          claimId: sourceClaim.id,
          contraryId: selectedContrary.id,
          isSymmetric,
          reason: reason.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create contrary");
      }

      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent("contraries:changed", {
        detail: { deliberationId, claimId: sourceClaim.id }
      }));

      // Notify parent
      onContraryCreated?.();

      // Close dialog
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create contrary:", err);
      setError(err instanceof Error ? err.message : "Failed to create contrary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5 text-rose-600" />
            Mark Contrary Claim
          </DialogTitle>
          <DialogDescription>
            Define a claim that contradicts or is incompatible with this claim.
            This enables rebutting attacks in ASPIC+.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Claim Display */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              Source Claim:
            </label>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">{sourceClaim.text}</p>
            </div>
          </div>

          {/* Contrary Claim Picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              Select Contrary Claim:
            </label>
            {!selectedContrary ? (
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => setPickerOpen(true)}
              >
                <Split className="mr-2 h-4 w-4 text-gray-500" />
                Click to select a contrary claim...
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <p className="text-sm text-rose-900">{selectedContrary.text}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  className="text-xs"
                >
                  Change selection
                </Button>
              </div>
            )}
          </div>

          {/* Symmetric Toggle */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Checkbox
                id="symmetric"
                checked={isSymmetric}
                onCheckedChange={(checked) => setIsSymmetric(checked === true)}
              />
              <div className="flex-1">
                <label
                  htmlFor="symmetric"
                  className="text-sm font-medium text-slate-900 cursor-pointer"
                >
                  Contradictory (Symmetric)
                </label>
                <p className="text-xs text-slate-600 mt-1">
                  {isSymmetric ? (
                    <>
                      <strong>&quot;{sourceClaim.text}&quot;</strong> ↔ <strong>&quot;{selectedContrary?.text || "contrary"}&quot;</strong>
                      <br />
                      Both claims cannot be true (mutual exclusion)
                    </>
                  ) : (
                    <>
                      <strong>&quot;{sourceClaim.text}&quot;</strong> → ¬<strong>&quot;{selectedContrary?.text || "contrary"}&quot;</strong>
                      <br />
                      If source is true, contrary must be false (one-way incompatibility)
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Reason Field (Optional) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              Reason (Optional):
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why these claims are contrary (e.g., 'These claims represent mutually exclusive states')"
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Well-formedness Info */}
          {selectedContrary && (
            <Alert className="border-blue-500 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800">
                <strong>ASPIC+ Rule:</strong> Arguments with conclusions <strong>&quot;{sourceClaim.text}&quot;</strong> and{" "}
                <strong>&quot;{selectedContrary.text}&quot;</strong> will be able to rebut each other.
                {isSymmetric && " This is a symmetric (contradictory) relationship."}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs text-red-800">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateContrary}
            disabled={!selectedContrary || loading}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {loading ? (
              <>Creating...</>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create Contrary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* ClaimPicker Dialog */}
      {pickerOpen && (
        <ClaimPicker
          deliberationId={deliberationId}
          onPick={(claim) => {
            setSelectedContrary({ id: claim.id, text: claim.text });
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Dialog>
  );
}
