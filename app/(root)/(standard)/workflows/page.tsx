import Link from "next/link";
import { listWorkflows } from "@/lib/actions/workflow.actions";

export const metadata = {
  title: "My Workflows",
  description: "List of saved workflows",
};

export default async function Page() {
  const workflows = await listWorkflows();
  return (
    <section className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">My Workflows</h1>
      <ul className="space-y-2">
        {workflows.map((w) => (
          <li key={w.id.toString()} className="border p-2 rounded">
            <Link href={`/workflows/${w.id}`}>{w.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
