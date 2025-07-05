import { NodeProps } from "@xyflow/react";
import { PluginDescriptor } from "@/lib/pluginLoader";

function PdfViewerNode({ data }: NodeProps<{ url?: string }>) {
  return (
    <iframe
      src={data?.url}
      className="w-full h-full border-none"
      title="PDF Viewer"
    />
  );
}

export const descriptor: PluginDescriptor = {
  type: "PDF_VIEWER",
  component: PdfViewerNode,
  config: { label: "PDF Viewer" },
};

export default PdfViewerNode;
