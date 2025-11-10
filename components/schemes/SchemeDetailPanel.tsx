/**
 * Scheme Detail Panel
 * 
 * Enhanced detail view for selected schemes with actions and related schemes.
 * 
 * Week 8, Task 8.3: User Preferences
 */

"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Star,
  Copy,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { ArgumentScheme } from "@prisma/client";
import { useNavigationStore } from "@/lib/schemes/navigation-state";
import { getRelatedSchemes, getSuggestedNavigationMode } from "@/lib/schemes/navigation-integration";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SchemeDetailPanelProps {
  scheme: ArgumentScheme;
  onClose: () => void;
  onSchemeSelect?: (scheme: ArgumentScheme) => void;
}

export default function SchemeDetailPanel({
  scheme,
  onClose,
  onSchemeSelect,
}: SchemeDetailPanelProps) {
  const { isFavorite, toggleFavorite, setMode } = useNavigationStore();
  const { data: allSchemes } = useSWR<ArgumentScheme[]>("/api/schemes/all", fetcher);

  const favorite = isFavorite(scheme.key);
  const suggestedMode = getSuggestedNavigationMode(scheme);

  const relatedSchemes = React.useMemo(() => {
    if (!allSchemes) return null;
    return getRelatedSchemes(scheme, allSchemes);
  }, [scheme, allSchemes]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(scheme.key);
  };

  const handleViewFull = () => {
    window.open(`/schemes/${scheme.key}`, "_blank");
  };

  const handleSwitchMode = () => {
    setMode(suggestedMode);
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto shadow-lg z-50">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{scheme.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(scheme.key)}
                className="p-0 h-6 w-6"
              >
                <Star
                  className={`w-4 h-4 ${
                    favorite ? "fill-yellow-400 text-yellow-400" : ""
                  }`}
                />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {scheme.key}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm mb-4">{scheme.description}</p>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyKey}
            className="flex-1"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Key
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewFull}
            className="flex-1"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Full Details
          </Button>
        </div>

        {/* Premises & Conclusion */}
        {scheme.premises && Array.isArray(scheme.premises) && scheme.premises.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Premises</h4>
            <ul className="space-y-1">
              {(scheme.premises as string[]).map((premise: string, idx: number) => (
                <li key={idx} className="text-xs text-muted-foreground">
                  <span className="font-medium">P{idx + 1}:</span> {premise}
                </li>
              ))}
            </ul>
          </div>
        )}

        {scheme.conclusion && typeof scheme.conclusion === "string" && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Conclusion</h4>
            <p className="text-xs text-muted-foreground">{scheme.conclusion}</p>
          </div>
        )}

        {/* Suggested Navigation */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
          <p className="text-xs font-medium mb-2">Suggested Navigation</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchMode}
            className="w-full"
          >
            {suggestedMode === "tree" && "Use Wizard"}
            {suggestedMode === "cluster" && "Browse Cluster"}
            {suggestedMode === "conditions" && "Filter by Conditions"}
            {suggestedMode === "search" && "Search Similar"}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {/* Related Schemes */}
        {relatedSchemes && onSchemeSelect && (
          <div className="space-y-3">
            {relatedSchemes.byCluster.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Same Cluster
                  <Badge variant="secondary" className="ml-2">
                    {relatedSchemes.byCluster.length}
                  </Badge>
                </h4>
                <div className="space-y-1">
                  {relatedSchemes.byCluster.slice(0, 3).map((related) => (
                    <button
                      key={related.key}
                      onClick={() => onSchemeSelect(related)}
                      className="w-full text-left p-2 text-xs rounded hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{related.name}</div>
                      <div className="text-muted-foreground truncate">
                        {related.key}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {relatedSchemes.byPurposeSource.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Similar Purpose/Source
                  <Badge variant="secondary" className="ml-2">
                    {relatedSchemes.byPurposeSource.length}
                  </Badge>
                </h4>
                <div className="space-y-1">
                  {relatedSchemes.byPurposeSource.slice(0, 3).map((related) => (
                    <button
                      key={related.key}
                      onClick={() => onSchemeSelect(related)}
                      className="w-full text-left p-2 text-xs rounded hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{related.name}</div>
                      <div className="text-muted-foreground truncate">
                        {related.key}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
