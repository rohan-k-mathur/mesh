# Phase 5.2: Translation Deliberations (Part 3)

**Sub-Phase:** 5.2 of 5.3  
**Focus:** Bridge Claims UI, Participants & Outcome Components

---

## Implementation Steps (Continued)

### Step 5.2.11: Bridge Claims List Component

**File:** `components/translation/BridgeClaimsList.tsx`

```tsx
/**
 * List and manage bridge claims connecting field assumptions
 */

"use client";

import { useState } from "react";
import { useCreateBridgeClaim, useVoteOnBridgeClaim } from "@/lib/translation/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  GitBranch,
  Loader2,
} from "lucide-react";
import { BridgeClaimData, VoteType, AssumptionType } from "@/lib/translation/types";

interface BridgeClaimsListProps {
  translationId: string;
  claims: BridgeClaimData[];
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
  canPropose: boolean;
  canVote: boolean;
}

export function BridgeClaimsList({
  translationId,
  claims,
  fieldA,
  fieldB,
  canPropose,
  canVote,
}: BridgeClaimsListProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Bridge Claims</h3>
          <p className="text-sm text-gray-600">
            Connecting assumptions across {fieldA.name} and {fieldB.name}
          </p>
        </div>
        {canPropose && (
          <CreateBridgeClaimDialog
            translationId={translationId}
            fieldA={fieldA}
            fieldB={fieldB}
          />
        )}
      </div>

      {/* Claims */}
      {claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((claim) => (
            <BridgeClaimCard
              key={claim.id}
              claim={claim}
              translationId={translationId}
              fieldA={fieldA}
              fieldB={fieldB}
              canVote={canVote}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <GitBranch className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p>No bridge claims proposed yet</p>
          <p className="text-sm mt-1">
            Bridge claims connect underlying assumptions between fields
          </p>
        </div>
      )}
    </div>
  );
}

interface BridgeClaimCardProps {
  claim: BridgeClaimData;
  translationId: string;
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
  canVote: boolean;
}

function BridgeClaimCard({
  claim,
  translationId,
  fieldA,
  fieldB,
  canVote,
}: BridgeClaimCardProps) {
  const { mutate: vote, isPending } = useVoteOnBridgeClaim();

  const handleVote = (voteType: VoteType) => {
    vote({
      claimId: claim.id,
      translationId,
      vote: voteType,
    });
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PROPOSED: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    MODIFIED: "bg-purple-100 text-purple-800",
  };

  const assumptionTypeColors: Record<AssumptionType, string> = {
    EMPIRICAL: "bg-emerald-100 text-emerald-700",
    NORMATIVE: "bg-rose-100 text-rose-700",
    INTERPRETIVE: "bg-indigo-100 text-indigo-700",
    METHODOLOGICAL: "bg-amber-100 text-amber-700",
    THEORETICAL: "bg-cyan-100 text-cyan-700",
  };

  return (
    <div className="border rounded-lg p-5 bg-white shadow-sm">
      {/* Bridge claim structure */}
      <div className="space-y-4">
        {/* IF clause - Field A assumption */}
        <div className="flex items-start gap-3">
          <div className="text-sm font-semibold text-gray-500 mt-2 w-16 shrink-0">
            IF
          </div>
          <div className="flex-1 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600">
                {fieldA.name} assumes:
              </span>
              <Badge
                className={`text-xs ${assumptionTypeColors[claim.fieldAAssumptionType]}`}
              >
                {claim.fieldAAssumptionType.toLowerCase()}
              </Badge>
            </div>
            <p className="text-sm">{claim.fieldAAssumption}</p>
          </div>
        </div>

        {/* AND clause - Field B assumption */}
        <div className="flex items-start gap-3">
          <div className="text-sm font-semibold text-gray-500 mt-2 w-16 shrink-0">
            AND
          </div>
          <div className="flex-1 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-purple-600">
                {fieldB.name} assumes:
              </span>
              <Badge
                className={`text-xs ${assumptionTypeColors[claim.fieldBAssumptionType]}`}
              >
                {claim.fieldBAssumptionType.toLowerCase()}
              </Badge>
            </div>
            <p className="text-sm">{claim.fieldBAssumption}</p>
          </div>
        </div>

        {/* THEN clause - Common ground */}
        <div className="flex items-start gap-3">
          <div className="text-sm font-semibold text-gray-500 mt-2 w-16 shrink-0">
            THEN
          </div>
          <div className="flex-1 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
            <div className="text-xs font-medium text-green-600 mb-2">
              Common Ground:
            </div>
            <p className="text-sm font-medium">{claim.commonGround}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t">
        <div className="flex items-center gap-3">
          <Badge className={statusColors[claim.status]}>
            {claim.status.toLowerCase().replace("_", " ")}
          </Badge>
          <span className="text-sm text-gray-500">
            by {claim.proposedBy.name}
          </span>
        </div>

        {/* Votes */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            <span>{claim.votes.agree}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ThumbsDown className="w-4 h-4 text-red-600" />
            <span>{claim.votes.disagree}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{claim.votes.needsModification}</span>
          </div>
        </div>

        {/* Vote buttons */}
        {canVote && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("AGREE")}
              disabled={isPending}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("DISAGREE")}
              disabled={isPending}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("NEEDS_MODIFICATION")}
              disabled={isPending}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CreateBridgeClaimDialogProps {
  translationId: string;
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
}

function CreateBridgeClaimDialog({
  translationId,
  fieldA,
  fieldB,
}: CreateBridgeClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [fieldAAssumption, setFieldAAssumption] = useState("");
  const [fieldAType, setFieldAType] = useState<AssumptionType>("EMPIRICAL");
  const [fieldBAssumption, setFieldBAssumption] = useState("");
  const [fieldBType, setFieldBType] = useState<AssumptionType>("EMPIRICAL");
  const [commonGround, setCommonGround] = useState("");

  const { mutate: createClaim, isPending } = useCreateBridgeClaim();

  const handleSubmit = () => {
    createClaim(
      {
        translationId,
        fieldAAssumption,
        fieldBAssumption,
        commonGround,
        fieldAAssumptionType: fieldAType,
        fieldBAssumptionType: fieldBType,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setFieldAAssumption("");
    setFieldAType("EMPIRICAL");
    setFieldBAssumption("");
    setFieldBType("EMPIRICAL");
    setCommonGround("");
  };

  const assumptionTypes: AssumptionType[] = [
    "EMPIRICAL",
    "NORMATIVE",
    "INTERPRETIVE",
    "METHODOLOGICAL",
    "THEORETICAL",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Bridge Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Bridge Claim</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Connect underlying assumptions from both fields to find common ground
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Field A assumption */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500">IF</span>
              <span className="text-blue-600 font-medium">{fieldA.name}</span>
              <span className="text-gray-500">assumes:</span>
            </div>
            <div className="pl-8 space-y-2">
              <Select
                value={fieldAType}
                onValueChange={(v) => setFieldAType(v as AssumptionType)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assumption type" />
                </SelectTrigger>
                <SelectContent>
                  {assumptionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder={`What does ${fieldA.name} assume about this topic?`}
                value={fieldAAssumption}
                onChange={(e) => setFieldAAssumption(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Field B assumption */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500">AND</span>
              <span className="text-purple-600 font-medium">{fieldB.name}</span>
              <span className="text-gray-500">assumes:</span>
            </div>
            <div className="pl-8 space-y-2">
              <Select
                value={fieldBType}
                onValueChange={(v) => setFieldBType(v as AssumptionType)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assumption type" />
                </SelectTrigger>
                <SelectContent>
                  {assumptionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder={`What does ${fieldB.name} assume about this topic?`}
                value={fieldBAssumption}
                onChange={(e) => setFieldBAssumption(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Common ground */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500">THEN</span>
              <span className="text-green-600 font-medium">
                we can agree that:
              </span>
            </div>
            <div className="pl-8">
              <Textarea
                placeholder="What common ground can be established from these assumptions?"
                value={commonGround}
                onChange={(e) => setCommonGround(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !fieldAAssumption || !fieldBAssumption || !commonGround || isPending
            }
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Bridge Claim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 5.2.12: Participants List Component

**File:** `components/translation/ParticipantsList.tsx`

```tsx
/**
 * List translation participants with roles
 */

"use client";

import { useState } from "react";
import { useJoinTranslation } from "@/lib/translation/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Crown,
  GraduationCap,
  GitBranch,
  Eye,
  Plus,
  Loader2,
} from "lucide-react";
import { ParticipantData, TranslationRole } from "@/lib/translation/types";

interface ParticipantsListProps {
  translationId: string;
  participants: ParticipantData[];
  facilitatorId: string;
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
}

export function ParticipantsList({
  translationId,
  participants,
  facilitatorId,
  fieldA,
  fieldB,
}: ParticipantsListProps) {
  const roleIcons: Record<TranslationRole, typeof GraduationCap> = {
    FIELD_A_EXPERT: GraduationCap,
    FIELD_B_EXPERT: GraduationCap,
    BRIDGE_SCHOLAR: GitBranch,
    OBSERVER: Eye,
  };

  const roleColors: Record<TranslationRole, string> = {
    FIELD_A_EXPERT: "bg-blue-100 text-blue-700",
    FIELD_B_EXPERT: "bg-purple-100 text-purple-700",
    BRIDGE_SCHOLAR: "bg-green-100 text-green-700",
    OBSERVER: "bg-gray-100 text-gray-700",
  };

  const groupedParticipants = {
    FIELD_A_EXPERT: participants.filter((p) => p.role === "FIELD_A_EXPERT"),
    FIELD_B_EXPERT: participants.filter((p) => p.role === "FIELD_B_EXPERT"),
    BRIDGE_SCHOLAR: participants.filter((p) => p.role === "BRIDGE_SCHOLAR"),
    OBSERVER: participants.filter((p) => p.role === "OBSERVER"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-lg">Participants</h3>
        </div>
        <JoinTranslationDialog
          translationId={translationId}
          fieldA={fieldA}
          fieldB={fieldB}
        />
      </div>

      {/* Grouped by role */}
      <div className="grid grid-cols-2 gap-4">
        {/* Field A Experts */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={roleColors.FIELD_A_EXPERT}>
              {fieldA.name} Experts
            </Badge>
            <span className="text-sm text-gray-500">
              ({groupedParticipants.FIELD_A_EXPERT.length})
            </span>
          </div>
          <div className="space-y-2">
            {groupedParticipants.FIELD_A_EXPERT.map((p) => (
              <ParticipantRow
                key={p.userId}
                participant={p}
                isFacilitator={p.userId === facilitatorId}
              />
            ))}
            {groupedParticipants.FIELD_A_EXPERT.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No experts yet
              </p>
            )}
          </div>
        </div>

        {/* Field B Experts */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={roleColors.FIELD_B_EXPERT}>
              {fieldB.name} Experts
            </Badge>
            <span className="text-sm text-gray-500">
              ({groupedParticipants.FIELD_B_EXPERT.length})
            </span>
          </div>
          <div className="space-y-2">
            {groupedParticipants.FIELD_B_EXPERT.map((p) => (
              <ParticipantRow
                key={p.userId}
                participant={p}
                isFacilitator={p.userId === facilitatorId}
              />
            ))}
            {groupedParticipants.FIELD_B_EXPERT.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No experts yet
              </p>
            )}
          </div>
        </div>

        {/* Bridge Scholars */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={roleColors.BRIDGE_SCHOLAR}>Bridge Scholars</Badge>
            <span className="text-sm text-gray-500">
              ({groupedParticipants.BRIDGE_SCHOLAR.length})
            </span>
          </div>
          <div className="space-y-2">
            {groupedParticipants.BRIDGE_SCHOLAR.map((p) => (
              <ParticipantRow
                key={p.userId}
                participant={p}
                isFacilitator={p.userId === facilitatorId}
              />
            ))}
            {groupedParticipants.BRIDGE_SCHOLAR.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No bridge scholars yet
              </p>
            )}
          </div>
        </div>

        {/* Observers */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={roleColors.OBSERVER}>Observers</Badge>
            <span className="text-sm text-gray-500">
              ({groupedParticipants.OBSERVER.length})
            </span>
          </div>
          <div className="space-y-2">
            {groupedParticipants.OBSERVER.map((p) => (
              <ParticipantRow
                key={p.userId}
                participant={p}
                isFacilitator={p.userId === facilitatorId}
              />
            ))}
            {groupedParticipants.OBSERVER.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No observers yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ParticipantRowProps {
  participant: ParticipantData;
  isFacilitator: boolean;
}

function ParticipantRow({ participant, isFacilitator }: ParticipantRowProps) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
      <Avatar className="h-8 w-8">
        <AvatarImage src={participant.user.image || undefined} />
        <AvatarFallback>
          {participant.user.name?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {participant.user.name}
          </span>
          {isFacilitator && (
            <Crown className="w-4 h-4 text-amber-500" title="Facilitator" />
          )}
        </div>
        {participant.representingField && (
          <span className="text-xs text-gray-500">
            representing {participant.representingField.name}
          </span>
        )}
      </div>
    </div>
  );
}

interface JoinTranslationDialogProps {
  translationId: string;
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
}

function JoinTranslationDialog({
  translationId,
  fieldA,
  fieldB,
}: JoinTranslationDialogProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<TranslationRole>("OBSERVER");
  const [representingFieldId, setRepresentingFieldId] = useState<string | undefined>();

  const { mutate: joinTranslation, isPending } = useJoinTranslation();

  const handleSubmit = () => {
    joinTranslation(
      {
        translationId,
        role,
        representingFieldId,
      },
      {
        onSuccess: () => setOpen(false),
      }
    );
  };

  const showFieldSelect =
    role === "FIELD_A_EXPERT" || role === "FIELD_B_EXPERT";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Join
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Translation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Your Role</label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as TranslationRole);
                if (v === "FIELD_A_EXPERT") {
                  setRepresentingFieldId(fieldA.id);
                } else if (v === "FIELD_B_EXPERT") {
                  setRepresentingFieldId(fieldB.id);
                } else {
                  setRepresentingFieldId(undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIELD_A_EXPERT">
                  {fieldA.name} Expert
                </SelectItem>
                <SelectItem value="FIELD_B_EXPERT">
                  {fieldB.name} Expert
                </SelectItem>
                <SelectItem value="BRIDGE_SCHOLAR">Bridge Scholar</SelectItem>
                <SelectItem value="OBSERVER">Observer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            {role === "FIELD_A_EXPERT" && (
              <p>
                As a <strong>{fieldA.name} Expert</strong>, you'll contribute
                terminology and assumptions from your field and help evaluate
                proposed mappings.
              </p>
            )}
            {role === "FIELD_B_EXPERT" && (
              <p>
                As a <strong>{fieldB.name} Expert</strong>, you'll contribute
                terminology and assumptions from your field and help evaluate
                proposed mappings.
              </p>
            )}
            {role === "BRIDGE_SCHOLAR" && (
              <p>
                As a <strong>Bridge Scholar</strong>, you'll help facilitate
                communication between fields and propose bridge claims that
                connect assumptions.
              </p>
            )}
            {role === "OBSERVER" && (
              <p>
                As an <strong>Observer</strong>, you can follow the translation
                process and learn from the interdisciplinary exchange.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Join Translation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 5.2.13: Translation Outcome Component

**File:** `components/translation/TranslationOutcome.tsx`

```tsx
/**
 * Display the outcome of a completed translation
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  FileText,
  GitBranch,
  AlertTriangle,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutcomeData } from "@/lib/translation/types";

interface TranslationOutcomeProps {
  outcome: OutcomeData;
}

export function TranslationOutcome({ outcome }: TranslationOutcomeProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <CardTitle>Translation Complete</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{outcome.summary}</p>
          {outcome.glossaryUrl && (
            <div className="mt-4">
              <Button variant="outline" asChild>
                <a
                  href={outcome.glossaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Glossary
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {outcome.acceptedMappings}
                </div>
                <div className="text-sm text-gray-600">Accepted Mappings</div>
              </div>
              <FileText className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {outcome.acceptedBridgeClaims}
                </div>
                <div className="text-sm text-gray-600">Bridge Claims</div>
              </div>
              <GitBranch className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-600">
                  {outcome.documentedCaveats}
                </div>
                <div className="text-sm text-gray-600">Caveats Documented</div>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      {outcome.keyInsights && outcome.keyInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {outcome.keyInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Remaining Disagreements */}
      {outcome.remainingDisagreements &&
        outcome.remainingDisagreements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Remaining Disagreements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {outcome.remainingDisagreements.map((disagreement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span className="text-gray-700">{disagreement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* References */}
      {outcome.references && outcome.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">References</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {outcome.references.map((ref, index) => (
                <li key={index}>
                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {ref.title}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-700">{ref.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Step 5.2.14: Translation List Page Component

**File:** `components/translation/TranslationListPage.tsx`

```tsx
/**
 * Page component for listing translations by field
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslationsForField, useCreateTranslation } from "@/lib/translation/hooks";
import { useFields } from "@/lib/crossfield/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  ArrowRight,
  Users,
  FileText,
  GitBranch,
  Loader2,
} from "lucide-react";
import { TranslationSummary, PHASE_DESCRIPTIONS } from "@/lib/translation/types";
import { formatDistanceToNow } from "date-fns";

interface TranslationListPageProps {
  fieldId: string;
}

export function TranslationListPage({ fieldId }: TranslationListPageProps) {
  const { data: translations, isLoading } = useTranslationsForField(fieldId);
  const { data: fields } = useFields();

  const currentField = fields?.find((f) => f.id === fieldId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Translation Deliberations</h1>
          {currentField && (
            <p className="text-gray-600 mt-1">
              Translations involving {currentField.name}
            </p>
          )}
        </div>
        <CreateTranslationDialog currentFieldId={fieldId} />
      </div>

      {/* Translations list */}
      {translations && translations.length > 0 ? (
        <div className="grid gap-4">
          {translations.map((translation) => (
            <TranslationCard key={translation.id} translation={translation} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <GitBranch className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No translations yet
          </h3>
          <p className="text-gray-600 mt-1 max-w-md mx-auto">
            Start a translation deliberation to bridge terminology and
            assumptions between academic fields.
          </p>
        </div>
      )}
    </div>
  );
}

function TranslationCard({ translation }: { translation: TranslationSummary }) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    ABANDONED: "bg-gray-100 text-gray-800",
  };

  return (
    <Link href={`/translations/${translation.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{translation.title}</CardTitle>
              <CardDescription className="mt-1">
                {translation.description}
              </CardDescription>
            </div>
            <Badge className={statusColors[translation.status]}>
              {translation.status.toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Fields */}
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {translation.fieldA.name}
            </Badge>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <Badge
              variant="outline"
              className="text-purple-700 border-purple-300"
            >
              {translation.fieldB.name}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{translation.participantCount} participants</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{translation.mappingCount} mappings</span>
            </div>
            <div className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              <span>{translation.bridgeClaimCount} bridge claims</span>
            </div>
          </div>

          {/* Current phase */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-500 mb-1">Current Phase</div>
            <div className="text-sm font-medium">
              {translation.currentPhase.replace(/_/g, " ")}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface CreateTranslationDialogProps {
  currentFieldId: string;
}

function CreateTranslationDialog({
  currentFieldId,
}: CreateTranslationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [otherFieldId, setOtherFieldId] = useState("");

  const { data: fields } = useFields();
  const { mutate: createTranslation, isPending } = useCreateTranslation();

  const otherFields = fields?.filter((f) => f.id !== currentFieldId) || [];

  const handleSubmit = () => {
    createTranslation(
      {
        title,
        description,
        fieldAId: currentFieldId,
        fieldBId: otherFieldId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOtherFieldId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Translation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Translation Deliberation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="e.g., Bridging Economics and Psychology on Decision-Making"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe the goal of this translation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bridge With Field</label>
            <Select value={otherFieldId} onValueChange={setOtherFieldId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {otherFields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || !description || !otherFieldId || isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Translation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 5.2 Complete Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| **Part 1** | | | |
| 1 | Prisma schema | `prisma/schema.prisma` | ✅ |
| 2 | Translation types | `lib/translation/types.ts` | ✅ |
| 3 | Translation service | `lib/translation/translationService.ts` | ✅ |
| 4 | Term mapping service | `lib/translation/termMappingService.ts` | ✅ |
| 5 | Bridge claim service | `lib/translation/bridgeClaimService.ts` | ✅ |
| **Part 2** | | | |
| 6 | Translations API | `app/api/translations/route.ts` | ✅ |
| 7 | Single translation API | `app/api/translations/[translationId]/route.ts` | ✅ |
| 8 | Phase advance API | `app/api/translations/[translationId]/phase/route.ts` | ✅ |
| 9 | Join translation API | `app/api/translations/[translationId]/join/route.ts` | ✅ |
| 10 | Term mappings API | `app/api/translations/[translationId]/mappings/route.ts` | ✅ |
| 11 | Mapping vote API | `app/api/translations/mappings/[mappingId]/vote/route.ts` | ✅ |
| 12 | Bridge claims API | `app/api/translations/[translationId]/bridge-claims/route.ts` | ✅ |
| 13 | Bridge claim vote API | `app/api/translations/bridge-claims/[claimId]/vote/route.ts` | ✅ |
| 14 | React Query hooks | `lib/translation/hooks.ts` | ✅ |
| 15 | TranslationDashboard | `components/translation/TranslationDashboard.tsx` | ✅ |
| 16 | PhaseProgress | `components/translation/PhaseProgress.tsx` | ✅ |
| 17 | TermMappingsList | `components/translation/TermMappingsList.tsx` | ✅ |
| **Part 3** | | | |
| 18 | BridgeClaimsList | `components/translation/BridgeClaimsList.tsx` | ✅ |
| 19 | ParticipantsList | `components/translation/ParticipantsList.tsx` | ✅ |
| 20 | TranslationOutcome | `components/translation/TranslationOutcome.tsx` | ✅ |
| 21 | TranslationListPage | `components/translation/TranslationListPage.tsx` | ✅ |

---

**Phase 5.2 Translation Deliberations: COMPLETE**

*Next: Phase 5.3 - Collaboration Matching*
