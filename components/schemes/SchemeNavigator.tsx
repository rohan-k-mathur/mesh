/**
 * Unified Scheme Navigator
 * 
 * Main component integrating all navigation modes (Wizard, Clusters, Conditions, Search)
 * into a single tab-based interface with shared state and context.
 * 
 * Week 8, Task 8.2: Tab-Based Interface
 */

"use client";

import React, { Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { GitBranch, Grid3x3, Filter, Search } from "lucide-react";
import { useNavigationStore, type NavigationMode } from "@/lib/schemes/navigation-state";
import { SchemeNavigationProvider } from "./SchemeNavigationContext";
import type { ArgumentScheme } from "@prisma/client";

// Lazy load navigation mode components for better performance
const DichotomicTreeWizard = lazy(() => import("./DichotomicTreeWizard"));
const ClusterBrowser = lazy(() => import("./ClusterBrowser").then(m => ({ default: m.ClusterBrowser })));
const IdentificationConditionsFilter = lazy(() => import("./IdentificationConditionsFilter").then(m => ({ default: m.IdentificationConditionsFilter })));

/**
 * Loading fallback for lazy-loaded tabs
 */
function TabLoadingFallback() {
  return (
    <Card className="p-12 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-muted-foreground">Loading navigation mode...</p>
    </Card>
  );
}

/**
 * Unified SchemeNavigator with all navigation modes
 */
export default function SchemeNavigator() {
  const { currentMode, setMode, selectedScheme } = useNavigationStore();
  
  const handleModeChange = (value: string) => {
    setMode(value as NavigationMode);
  };
  
  return (
    <SchemeNavigationProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Scheme Navigator</h1>
            <p className="text-muted-foreground">
              Find the perfect argumentation scheme using different navigation approaches
            </p>
          </div>
          
          {/* Tabbed Navigation */}
          <Tabs value={currentMode} onValueChange={handleModeChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
              <TabsTrigger value="tree" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">Wizard</span>
              </TabsTrigger>
              <TabsTrigger value="cluster" className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Clusters</span>
              </TabsTrigger>
              <TabsTrigger value="conditions" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Conditions</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Wizard Tab */}
            <TabsContent value="tree" className="space-y-6">
              <Card className="p-4 bg-muted/50">
                <p className="text-sm">
                  <strong>Dichotomic Tree Wizard:</strong> Answer 2-3 questions to narrow down
                  to the most relevant schemes for your argument.
                </p>
              </Card>
              
              <Suspense fallback={<TabLoadingFallback />}>
                <DichotomicTreeWizard
                  onSchemeSelect={(scheme) => {
                    useNavigationStore.getState().selectScheme(scheme);
                  }}
                />
              </Suspense>
            </TabsContent>
            
            {/* Cluster Browser Tab */}
            <TabsContent value="cluster" className="space-y-6">
              <Card className="p-4 bg-muted/50">
                <p className="text-sm">
                  <strong>Cluster Browser:</strong> Browse schemes organized by semantic domain
                  (authority, causality, decision-making, etc.).
                </p>
              </Card>
              
              <Suspense fallback={<TabLoadingFallback />}>
                <ClusterBrowser
                  onSchemeSelect={(scheme: ArgumentScheme) => {
                    useNavigationStore.getState().selectScheme(scheme);
                  }}
                />
              </Suspense>
            </TabsContent>
            
            {/* Identification Conditions Tab */}
            <TabsContent value="conditions" className="space-y-6">
              <Card className="p-4 bg-muted/50">
                <p className="text-sm">
                  <strong>Identification Conditions:</strong> Select observable patterns in your
                  argument to filter schemes by identification conditions.
                </p>
              </Card>
              
              <Suspense fallback={<TabLoadingFallback />}>
                <IdentificationConditionsFilter
                  onSchemeSelect={(scheme: ArgumentScheme) => {
                    useNavigationStore.getState().selectScheme(scheme);
                  }}
                />
              </Suspense>
            </TabsContent>
            
            {/* Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <Card className="p-4 bg-muted/50">
                <p className="text-sm">
                  <strong>Search:</strong> Search schemes by name, description, or keywords to
                  quickly find what you need.
                </p>
              </Card>
              
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Search Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Unified search functionality will be implemented in Task 8.4
                </p>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Selected Scheme Detail Panel (if scheme selected) */}
          {selectedScheme && (
            <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg">{selectedScheme.name}</h3>
                <button
                  onClick={() => useNavigationStore.getState().selectScheme(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Key:</strong> {selectedScheme.key}
              </p>
              {selectedScheme.summary && (
                <p className="text-sm">{selectedScheme.summary}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </SchemeNavigationProvider>
  );
}
