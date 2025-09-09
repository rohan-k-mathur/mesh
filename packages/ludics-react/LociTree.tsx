"use client";
import * as React from "react";

type Node = {
  id: string;
  path: string;
  acts: {
    id: string;
    polarity: "P" | "O" | null;
    expression?: string;
    isAdditive?: boolean;
  }[];
  children: Node[];
};

export function LociTree(props: {
  root: Node;
  onPickBranch?: (parentPath: string, childSuffix: string) => void;
  /** parentPath -> chosen child suffix (e.g., { "0.3": "2" }) */
  usedAdditive?: Record<string, string>;
}) {
  const isAdditive = (n: Node) => n.acts.some((a) => a.isAdditive);

  const render = (n: Node) => {
    const additive = isAdditive(n);
    const childSuffixes = n.children.map((c) => c.path.split(".").slice(-1)[0]);
    const chosen = props.usedAdditive?.[n.path];

    return (
      <li key={n.id}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <code>{n.path}</code>

          {n.acts.map((a) => (
            <span
              key={a.id}
              title={a.expression}
              style={{
                fontSize: 12,
                padding: "2px 6px",
                border: "1px solid #ddd",
                borderRadius: 4,
                background: a.isAdditive ? "#fff7ed" : undefined,
              }}
            >
              {a.polarity ?? "†"} {a.isAdditive ? "⊕" : ""}
            </span>
          ))}

          {additive && childSuffixes.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>choose:</span>
              {childSuffixes.map((s) => {
                const checked = chosen === s;
                const disabled = Boolean(chosen && chosen !== s);
                const chooser = n.acts.some(
                  (a) => a.isAdditive && a.polarity === "P"
                )
                  ? "Proponent chooses"
                  : n.acts.some((a) => a.isAdditive && a.polarity === "O")
                  ? "Opponent chooses (passive for P)"
                  : null;

                  {
                    additive && chooser && (
                      <span
                        style={{
                          fontSize: 11,
                          opacity: 0.7,
                          border: "1px dashed #ddd",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {chooser}
                      </span>
                    );
                  }
                return (
                  <label
                    key={s}
                    style={{
                      fontSize: 12,
                      display: "inline-flex",
                      gap: 4,
                      alignItems: "center",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="radio"
                      name={`pick-${n.path}`}
                      checked={checked}
                      disabled={disabled || !props.onPickBranch}
                      onChange={() => props.onPickBranch?.(n.path, s)}
                    />
                    <span
                      style={{
                        padding: "1px 6px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        background: checked ? "#ecfeff" : undefined,
                      }}
                    >
                      {s}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {n.children.length > 0 && (
          <ul style={{ marginLeft: 12, listStyle: "none", paddingLeft: 0 }}>
            {n.children.map(render)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul style={{ listStyle: "none", paddingLeft: 0 }}>{render(props.root)}</ul>
  );
}
