// components/aspic/AspicTheoryViewer.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronRight } from "lucide-react";

interface AspicTheoryViewerProps {
  theory: any; // Will be properly typed after API is created
  highlightFormula?: string;
}

export function AspicTheoryViewer({ theory, highlightFormula }: AspicTheoryViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["language", "rules", "kb", "contraries"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
    console.log(`Copied ${label} to clipboard`);
  };

  if (!theory) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No theory data available
      </div>
    );
  }

  // Extract data from theory (handle both old and new formats)
  const language = theory.system?.language || theory.language || [];
  const strictRules = theory.system?.strictRules || theory.strictRules || [];
  const defeasibleRules = theory.system?.defeasibleRules || theory.defeasibleRules || [];
  const axioms = theory.knowledgeBase?.axioms || theory.axioms || [];
  const premises = theory.knowledgeBase?.premises || theory.premises || [];
  const assumptions = theory.knowledgeBase?.assumptions || theory.assumptions || [];
  const contraries = theory.system?.contraries || theory.contraries || {};

  // Convert to arrays for rendering (handle both arrays and Sets/Maps)
  const languageArray = Array.isArray(language) ? language : Array.from(language);
  const axiomsArray = Array.isArray(axioms) ? axioms : Array.from(axioms);
  const premisesArray = Array.isArray(premises) ? premises : Array.from(premises);
  const assumptionsArray = Array.isArray(assumptions) ? assumptions : Array.from(assumptions);
  
  // Handle contraries - it's an object with formula -> array of contraries
  const contrariesEntries = Object.entries(contraries);

  return (
    <div className="space-y-4">
      {/* Language Section */}
      <Card className="sidebarv2 p-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection("language")}
              className="flex items-center gap-2 hover:text-purple-600 transition-colors"
            >
              {expandedSections.has("language") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle className="text-base">
                📖 Language ({languageArray.length} formulas)
              </CardTitle>
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(languageArray.join(", "), "Language")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        {expandedSections.has("language") && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {languageArray.length > 0 ? (
                languageArray.map((formula, idx) => (
                  <Badge
                    key={idx}
                    variant={formula === highlightFormula ? "default" : "outline"}
                    className="font-mono btnv2--ghost bg-white/60 text-xs"
                  >
                    {formula}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-gray-500">No formulas defined</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Rules Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection("rules")}
              className="flex items-center gap-2 hover:text-purple-600 transition-colors"
            >
              {expandedSections.has("rules") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle className="text-base">
                ⚖️ Rules ({strictRules.length + defeasibleRules.length} total)
              </CardTitle>
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                copyToClipboard(
                  JSON.stringify({ strictRules, defeasibleRules }, null, 2),
                  "Rules"
                )
              }
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        {expandedSections.has("rules") && (
          <CardContent className="space-y-4">
            {/* Strict Rules */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Strict Rules ({strictRules.length})
              </h4>
              {strictRules.length > 0 ? (
                <div className="space-y-2">
                  {strictRules.map((rule: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {rule.id || `r${idx + 1}`}
                      </Badge>
                      <div className="flex-1">
                        <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                          {Array.isArray(rule.antecedents)
                            ? rule.antecedents.join(", ")
                            : rule.antecedents}{" "}
                          → {rule.consequent}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No strict rules defined</p>
              )}
            </div>

            {/* Defeasible Rules */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Defeasible Rules ({defeasibleRules.length})
              </h4>
              {defeasibleRules.length > 0 ? (
                <div className="space-y-2">
                  {defeasibleRules.map((rule: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {rule.id || `d${idx + 1}`}
                      </Badge>
                      <div className="flex-1">
                        <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                          {Array.isArray(rule.antecedents)
                            ? rule.antecedents.join(", ")
                            : rule.antecedents}{" "}
                          ⇒ {rule.consequent}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No defeasible rules defined</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Knowledge Base Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection("kb")}
              className="flex items-center gap-2 hover:text-purple-600 transition-colors"
            >
              {expandedSections.has("kb") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle className="text-base">
                📚 Knowledge Base (
                {axiomsArray.length + premisesArray.length + assumptionsArray.length} items)
              </CardTitle>
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                copyToClipboard(
                  JSON.stringify({ axioms: axiomsArray, premises: premisesArray, assumptions: assumptionsArray }, null, 2),
                  "Knowledge Base"
                )
              }
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        {expandedSections.has("kb") && (
          <CardContent className="space-y-3">
            {/* Axioms */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Axioms ({axiomsArray.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {axiomsArray.length > 0 ? (
                  axiomsArray.map((axiom, idx) => (
                    <Badge key={idx} variant="default" className="font-mono text-xs bg-sky-100 text-sky-700">
                      {axiom}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No axioms defined</p>
                )}
              </div>
            </div>

            {/* Premises */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Premises ({premisesArray.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {premisesArray.length > 0 ? (
                  premisesArray.map((premise, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono text-xs">
                      {premise}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No premises defined</p>
                )}
              </div>
            </div>

            {/* Assumptions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Assumptions ({assumptionsArray.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {assumptionsArray.length > 0 ? (
                  assumptionsArray.map((assumption, idx) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-xs">
                      {assumption}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No assumptions defined</p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contraries Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection("contraries")}
              className="flex items-center gap-2 hover:text-purple-600 transition-colors"
            >
              {expandedSections.has("contraries") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle className="text-base">
                🔀 Contraries ({contrariesEntries.length} pairs)
              </CardTitle>
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                copyToClipboard(
                  JSON.stringify(Object.fromEntries(contrariesEntries), null, 2),
                  "Contraries"
                )
              }
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        {expandedSections.has("contraries") && (
          <CardContent>
            {contrariesEntries.length > 0 ? (
              <div className="space-y-2">
                {contrariesEntries.map(([formula, contrarySet]: [string, any], idx) => {
                  // contrarySet can be an array or Set depending on data source
                  const contrariesArray = Array.isArray(contrarySet) 
                    ? contrarySet 
                    : Array.from(contrarySet);
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-mono text-xs">
                        {formula}
                      </Badge>
                      <span className="text-gray-400">↔</span>
                      <div className="flex flex-wrap gap-1">
                        {contrariesArray.map((contrary: string, cIdx) => (
                          <Badge key={cIdx} variant="outline" className="font-mono text-xs">
                            {contrary}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No contraries defined</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Export Actions */}
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(JSON.stringify(theory, null, 2), "Theory (JSON)")}
        >
          Export JSON
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // TODO: Generate LaTeX format
            console.log("LaTeX export coming soon");
          }}
        >
          Export LaTeX
        </Button>
      </div>
    </div>
  );
}
