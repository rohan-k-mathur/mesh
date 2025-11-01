// app/api/schemes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(_: NextRequest) {
  try {
    const schemes = await prisma.argumentScheme.findMany({
      orderBy: { key: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        summary: true,
        description: true,
        purpose: true,
        source: true,
        materialRelation: true,
        reasoningType: true,
        ruleForm: true,
        conclusionType: true,
        slotHints: true,
        premises: true,
        conclusion: true,
        cq: true, // Note: DB field is 'cq' not 'cqs'
        // Phase 6D: Clustering fields
        parentSchemeId: true,
        clusterTag: true,
        inheritCQs: true,
      },
    });

    // Parse and normalize to 'cqs' for API response
    const items = schemes.map((s) => ({
      ...s,
      cqs: Array.isArray(s.cq) ? s.cq : [],
      cq: undefined, // Remove the DB field name from response
    }));

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[GET /api/schemes] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schemes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.key || typeof body.key !== "string") {
      return NextResponse.json(
        { error: "Scheme key is required and must be a string" },
        { status: 400 }
      );
    }

    if (!/^[a-z_]+$/.test(body.key)) {
      return NextResponse.json(
        { error: "Scheme key must be lowercase with underscores only" },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Scheme name is required and must be a string" },
        { status: 400 }
      );
    }

    if (!body.summary || typeof body.summary !== "string") {
      return NextResponse.json(
        { error: "Scheme summary is required and must be a string" },
        { status: 400 }
      );
    }

    if (!body.cqs || !Array.isArray(body.cqs) || body.cqs.length === 0) {
      return NextResponse.json(
        { error: "At least one critical question is required" },
        { status: 400 }
      );
    }

    // Check for duplicate key
    const existing = await prisma.argumentScheme.findUnique({
      where: { key: body.key },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Scheme with key "${body.key}" already exists` },
        { status: 409 }
      );
    }

    // Create scheme
    const scheme = await prisma.argumentScheme.create({
      data: {
        key: body.key,
        name: body.name,
        summary: body.summary,
        description: body.description || null,
        purpose: body.purpose || null,
        source: body.source || null,
        materialRelation: body.materialRelation || null,
        reasoningType: body.reasoningType || null,
        ruleForm: body.ruleForm || null,
        conclusionType: body.conclusionType || null,
        premises: body.premises || null, // Formal structure
        conclusion: body.conclusion || null, // Formal structure
        cq: body.cqs, // Store CQs in JSON field
        // Phase 6D: Clustering fields
        parentSchemeId: body.parentSchemeId || null,
        clusterTag: body.clusterTag || null,
        inheritCQs: body.inheritCQs ?? true, // Default true
      },
    });

    return NextResponse.json(
      { success: true, schemeId: scheme.id, scheme },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/schemes] Error:", error);
    return NextResponse.json(
      { error: "Failed to create scheme" },
      { status: 500 }
    );
  }
}
