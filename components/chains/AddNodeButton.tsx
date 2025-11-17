"use client";

import React, { useState, useCallback } from "react";
import { Plus, Search, X } from "lucide-react";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { getNewNodePosition } from "@/lib/utils/chainLayoutUtils";

interface Argument {
  id: string;
  text: string;
  title?: string;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
  };
}

interface AddNodeButtonProps {
  deliberationId: string;
}

const ROLE_OPTIONS = [
  { value: "PREMISE", label: "Premise", description: "Provides foundational claim" },
  { value: "EVIDENCE", label: "Evidence", description: "Supports with data/facts" },
  { value: "CONCLUSION", label: "Conclusion", description: "Final claim being argued for" },
  { value: "OBJECTION", label: "Objection", description: "Challenges another argument" },
  { value: "REBUTTAL", label: "Rebuttal", description: "Responds to objection" },
  { value: "QUALIFIER", label: "Qualifier", description: "Adds conditions/scope" },
];

const AddNodeButton: React.FC<AddNodeButtonProps> = ({ deliberationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("PREMISE");
  const [searchQuery, setSearchQuery] = useState("");
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [loading, setLoading] = useState(false);

  const { nodes, addNode, chainId } = useChainEditorStore();

  // Fetch arguments from deliberation
  const fetchArguments = useCallback(async () => {
    if (!deliberationId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/deliberations/${deliberationId}/arguments/aif?limit=100`);
      if (response.ok) {
        const data = await response.json();
        // Map AIF arguments to simpler format
        const mapped = (data.items || []).map((item: any) => ({
          id: item.id,
          text: item.text,
          title: item.aif?.conclusion?.text || item.text.substring(0, 50) + "...",
          createdAt: item.createdAt,
          creator: {
            id: item.authorId,
            name: item.dialogueProvenance?.speakerName || "Unknown",
          },
        }));
        setArgumentsList(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch arguments:", error);
    } finally {
      setLoading(false);
    }
  }, [deliberationId]);

  // Open modal and fetch arguments
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    fetchArguments();
  }, [fetchArguments]);

  // Add argument as node
  const handleAddArgument = useCallback(async (argument: Argument) => {
    if (!chainId) {
      console.error("No chain ID set");
      return;
    }

    try {
      // Call API to add node
      const response = await fetch(`/api/argument-chains/${chainId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          argumentId: argument.id,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add node");
      }

      const result = await response.json();
      const nodeData = result.node;

      // Calculate position for new node
      const position = getNewNodePosition(nodes, 280, 180);

      // Add to local state with full node data from API
      addNode({
        id: nodeData.id,
        type: "argumentNode",
        position,
        data: {
          argument: nodeData.argument,
          role: nodeData.role,
          addedBy: nodeData.contributor,
          nodeOrder: nodeData.nodeOrder,
        },
      });

      setIsOpen(false);
      setSearchQuery("");
      setSelectedRole("PREMISE");
    } catch (error) {
      console.error("Failed to add node:", error);
    }
  }, [chainId, selectedRole, nodes, addNode]);

  const filteredArguments = argumentsList.filter((arg) => {
    const query = searchQuery.toLowerCase();
    return (
      arg.text.toLowerCase().includes(query) ||
      arg.title?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-md"
      >
        <Plus className="w-4 h-4" />
        Add Argument
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add Argument to Chain</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Selection */}
            <div className="p-4 border-b bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`
                      p-2 text-left rounded-lg border-2 transition-colors
                      ${selectedRole === role.value
                        ? "border-sky-500 bg-sky-50"
                        : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <div className="font-medium text-sm text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search arguments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Arguments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading arguments...</div>
              ) : filteredArguments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No arguments found</div>
              ) : (
                <div className="space-y-2">
                  {filteredArguments.map((arg) => (
                    <button
                      key={arg.id}
                      onClick={() => handleAddArgument(arg)}
                      className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {arg.title || "Untitled"}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{arg.text}</p>
                      <div className="text-xs text-gray-500">
                        By {arg.creator.name || "Unknown"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddNodeButton;
