import { NextResponse } from "next/server";
import { prisma } from "@cp/lib/prisma";
import { getCurrentAuthor } from "@cp/lib/auth";
import { ArtifactBodySchema, type ArtifactBody } from "@cp/lib/artifact-types";

/**
 * GET /api/artifacts/:id/export.md
 * Renders the artifact as Markdown. Entry blocks resolve to the entry's
 * current plainText plus a citation line — provenance is preserved by
 * reference, not copy, so re-export reflects the entry's latest state.
 */
export async function GET(
  _request: Request,
  { params }: { params: { artifactId: string } },
) {
  const ctx = await getCurrentAuthor();
  if (!ctx)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const artifact = await prisma.artifact.findFirst({
    where: { id: params.artifactId, authorId: ctx.author.id },
  });
  if (!artifact)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = ArtifactBodySchema.safeParse(artifact.body);
  const body: ArtifactBody = parsed.success ? parsed.data : { blocks: [] };

  const entryIds = body.blocks
    .filter((b): b is Extract<typeof b, { kind: "entry" }> => b.kind === "entry")
    .map((b) => b.entryId);

  const entries = entryIds.length
    ? await prisma.entry.findMany({
        where: { id: { in: entryIds }, authorId: ctx.author.id },
        select: {
          id: true,
          genre: true,
          plainText: true,
          createdAt: true,
          locator: true,
          source: { select: { title: true, author: true, year: true } },
        },
      })
    : [];
  const entryMap = new Map(entries.map((e) => [e.id, e]));

  const out: string[] = [];
  out.push(`# ${artifact.title}`);
  if (artifact.subtitle) out.push("", `*${artifact.subtitle}*`);
  out.push("");

  for (const block of body.blocks) {
    if (block.kind === "heading") {
      const hashes = "#".repeat(block.level + 1); // level 1 → ##, etc.
      out.push(`${hashes} ${block.text}`, "");
      continue;
    }
    if (block.kind === "prose") {
      out.push(block.text.trim(), "");
      continue;
    }
    if (block.kind === "entry") {
      const entry = entryMap.get(block.entryId);
      if (!entry) {
        out.push(`> _(missing entry ${block.entryId.slice(0, 8)})_`, "");
        continue;
      }
      const text = (entry.plainText || "").trim() || "(empty)";
      // Indent as blockquote so entries read as quoted material.
      out.push(
        text
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n"),
      );
      if (block.includeProvenance) {
        const date = entry.createdAt.toISOString().slice(0, 10);
        const parts: string[] = [entry.genre.toLowerCase(), date];
        if (entry.source) {
          const src = [entry.source.author, entry.source.title]
            .filter(Boolean)
            .join(", ");
          if (src) parts.push(src);
          if (entry.source.year) parts.push(String(entry.source.year));
          if (entry.locator) parts.push(entry.locator);
        }
        out.push(`> — ${parts.join(", ")} [[${entry.id.slice(0, 8)}]]`);
      }
      out.push("");
    }
  }

  const markdown = out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  const safeTitle =
    (artifact.title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "untitled";

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeTitle}.md"`,
    },
  });
}
