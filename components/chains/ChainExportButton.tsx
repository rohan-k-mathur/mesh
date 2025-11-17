"use client";

import React, { useState, useRef } from "react";
import { Download, Image as ImageIcon, FileCode } from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { useReactFlow } from "reactflow";

interface ChainExportButtonProps {
  chainName?: string;
}

const ChainExportButton: React.FC<ChainExportButtonProps> = ({ chainName = "argument-chain" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { getNodes } = useReactFlow();

  const handleExportPNG = async () => {
    setExporting(true);
    try {
      const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewport) {
        throw new Error("Viewport not found");
      }

      const dataUrl = await toPng(viewport, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `${chainName}.png`;
      link.href = dataUrl;
      link.click();

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to export PNG:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSVG = async () => {
    setExporting(true);
    try {
      const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewport) {
        throw new Error("Viewport not found");
      }

      const dataUrl = await toSvg(viewport, {
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${chainName}.svg`;
      link.href = dataUrl;
      link.click();

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to export SVG:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = () => {
    setExporting(true);
    try {
      const nodes = getNodes();
      const data = {
        chainName,
        exportedAt: new Date().toISOString(),
        nodes,
      };

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `${chainName}.json`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to export JSON:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-2 border-b bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Export Format
              </h3>
            </div>

            <div className="p-1">
              <button
                onClick={handleExportPNG}
                disabled={exporting}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium">PNG Image</div>
                  <div className="text-xs text-gray-500">High quality raster</div>
                </div>
              </button>

              <button
                onClick={handleExportSVG}
                disabled={exporting}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCode className="w-4 h-4 text-purple-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium">SVG Vector</div>
                  <div className="text-xs text-gray-500">Scalable vector graphics</div>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                disabled={exporting}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCode className="w-4 h-4 text-green-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium">JSON Data</div>
                  <div className="text-xs text-gray-500">Raw structured data</div>
                </div>
              </button>
            </div>

            {exporting && (
              <div className="p-3 border-t bg-blue-50">
                <div className="text-xs text-blue-700 font-medium">Exporting...</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChainExportButton;
