import clickCounter from "@/templates/click-counter.json";
import conditionalBranch from "@/templates/conditional-branch.json";

export const metadata = {
  title: "Workflow Templates",
  description: "Example starter templates for new workflows",
};

type Template = {
  name: string;
  description: string;
};

export default function Page() {
  const templates: Template[] = [clickCounter, conditionalBranch];

  return (
    <section className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Workflow Templates</h1>
      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.name} className="border p-2 rounded">
            <h2 className="font-semibold">{t.name}</h2>
            <p className="text-sm text-gray-600">{t.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
