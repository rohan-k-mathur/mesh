// Edge type definitions for ArgumentChain visual editor

export interface EdgeTypeConfig {
  id: string;
  label: string;
  color: string;
  description: string;
  strokeDasharray?: string;
}

export const EDGE_TYPES: Record<string, EdgeTypeConfig> = {
  SUPPORTS: {
    id: "SUPPORTS",
    label: "Supports",
    color: "#10b981", // green-500
    description: "This argument provides evidence or reasoning that strengthens the target argument",
  },
  ENABLES: {
    id: "ENABLES",
    label: "Enables",
    color: "#3b82f6", // blue-500
    description: "This argument provides a necessary condition or prerequisite for the target argument",
  },
  PRESUPPOSES: {
    id: "PRESUPPOSES",
    label: "Presupposes",
    color: "#8b5cf6", // violet-500
    description: "This argument assumes or depends on the truth of the target argument",
    strokeDasharray: "5,5",
  },
  REFUTES: {
    id: "REFUTES",
    label: "Refutes",
    color: "#ef4444", // red-500
    description: "This argument contradicts or disproves the target argument",
  },
  QUALIFIES: {
    id: "QUALIFIES",
    label: "Qualifies",
    color: "#f59e0b", // amber-500
    description: "This argument modifies or adds constraints to the target argument",
  },
  EXEMPLIFIES: {
    id: "EXEMPLIFIES",
    label: "Exemplifies",
    color: "#06b6d4", // cyan-500
    description: "This argument provides a concrete example or instance of the target argument",
  },
  GENERALIZES: {
    id: "GENERALIZES",
    label: "Generalizes",
    color: "#ec4899", // pink-500
    description: "This argument extracts a general principle from the target argument",
    strokeDasharray: "8,4",
  },
};

export const getEdgeTypeConfig = (edgeType: string): EdgeTypeConfig => {
  return EDGE_TYPES[edgeType] || {
    id: "SUPPORTS",
    label: "Supports",
    color: "#6b7280", // gray-500
    description: "Unknown edge type",
  };
};

export const getEdgeStrokeWidth = (strength: number): number => {
  // Map strength (0-1) to stroke width (1-4)
  return 1 + (strength * 3);
};

export const getEdgeAnimated = (strength: number): boolean => {
  // Animate edges with strength > 0.7
  return strength > 0.7;
};
