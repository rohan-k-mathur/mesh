// components/workflow/DynamicForm.tsx
import { FieldDef } from "@/lib/workflow/registry";

export function DynamicForm({
  fields,
  value,
  onChange
}: {
  fields: FieldDef[];
  value: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}) {
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-2">
      {fields.map(f => (
        <div key={f.key} className="space-y-1">
          <label className="text-sm">{f.label}</label>
          {f.type === "text" ? (
            <textarea className="w-full border rounded p-2"
              placeholder={f.placeholder}
              value={value[f.key] ?? ""}
              onChange={e => set(f.key, e.target.value)} />
          ) : f.type === "boolean" ? (
            <input type="checkbox" checked={!!value[f.key]} onChange={e => set(f.key, e.target.checked)} />
          ) : f.type === "select" ? (
            <select className="w-full border rounded p-2"
              value={value[f.key] ?? f.options?.[0]?.value ?? ""}
              onChange={e => set(f.key, e.target.value)}>
              {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input className="w-full border rounded p-2"
              type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
              placeholder={f.placeholder}
              value={value[f.key] ?? ""}
              onChange={e => set(f.key, e.target.value)} />
          )}
        </div>
      ))}
    </div>
  );
}
