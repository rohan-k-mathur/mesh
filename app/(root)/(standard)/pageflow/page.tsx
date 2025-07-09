import dynamic from "next/dynamic";

export const metadata = {
  title: "Linear Workflow Builder",
  description: "Create simple page-based workflows",
};

const Builder = dynamic(() => import("@/components/pageflow/PageFlowBuilder"), {
  ssr: false,
});

export default function Page() {
  return (
    <section className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Linear Workflow Builder</h1>
      <Builder />
    </section>
  );
}
