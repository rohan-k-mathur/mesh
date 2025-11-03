// components/aif/PreferenceBadge.tsx
"use client";
import { Badge } from "@/components/ui/badge";

type PreferenceBadgeProps = {
  preferredBy: number;
  dispreferredBy: number;
  className?: string;
};

export function PreferenceBadge({ preferredBy, dispreferredBy, className = "" }: PreferenceBadgeProps) {
  if (preferredBy === 0 && dispreferredBy === 0) return null;

  const netPreference = preferredBy - dispreferredBy;
  const bgColor = netPreference > 0 
    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
    : netPreference < 0
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <Badge 
      variant="outline" 
      className={`text-[10px] ${bgColor} ${className}`}
      title={`${preferredBy} preferred, ${dispreferredBy} dispreferred`}
    >
      {preferredBy > 0 && <span>↑{preferredBy}</span>}
      {preferredBy > 0 && dispreferredBy > 0 && <span className="mx-0.5">/</span>}
      {dispreferredBy > 0 && <span>↓{dispreferredBy}</span>}
    </Badge>
  );
}
