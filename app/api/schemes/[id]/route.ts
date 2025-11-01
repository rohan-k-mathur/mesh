// app/api/schemes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheme = await prisma.argumentScheme.findUnique({
      where: { id: params.id },
      include: {
        cqs: true, // Include related CriticalQuestion records
      },
    });

    if (!scheme) {
      return NextResponse.json(
        { error: "Scheme not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ scheme });
  } catch (error) {
    console.error(`[GET /api/schemes/${params.id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch scheme" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Validate fields (key cannot be changed)
    if (body.key) {
      return NextResponse.json(
        { error: "Scheme key cannot be modified" },
        { status: 400 }
      );
    }

    if (body.name && typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Scheme name must be a string" },
        { status: 400 }
      );
    }

    if (body.summary && typeof body.summary !== "string") {
      return NextResponse.json(
        { error: "Scheme summary must be a string" },
        { status: 400 }
      );
    }

    if (body.cqs && (!Array.isArray(body.cqs) || body.cqs.length === 0)) {
      return NextResponse.json(
        { error: "At least one critical question is required" },
        { status: 400 }
      );
    }

    // Check if scheme exists
    const existing = await prisma.argumentScheme.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Scheme not found" },
        { status: 404 }
      );
    }

    // Update scheme
    const updated = await prisma.argumentScheme.update({
      where: { id: params.id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        summary: body.summary !== undefined ? body.summary : undefined,
        description: body.description !== undefined ? body.description : undefined,
        purpose: body.purpose !== undefined ? body.purpose : undefined,
        source: body.source !== undefined ? body.source : undefined,
        materialRelation: body.materialRelation !== undefined ? body.materialRelation : undefined,
        reasoningType: body.reasoningType !== undefined ? body.reasoningType : undefined,
        ruleForm: body.ruleForm !== undefined ? body.ruleForm : undefined,
        conclusionType: body.conclusionType !== undefined ? body.conclusionType : undefined,
        premises: body.premises !== undefined ? body.premises : undefined,
        conclusion: body.conclusion !== undefined ? body.conclusion : undefined,
        cq: body.cqs !== undefined ? body.cqs : undefined,
      },
    });

    return NextResponse.json({ success: true, scheme: updated });
  } catch (error) {
    console.error(`[PUT /api/schemes/${params.id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to update scheme" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if scheme exists
    const existing = await prisma.argumentScheme.findUnique({
      where: { id: params.id },
      include: {
        Argument: { take: 1 }, // Check if any arguments use this scheme
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Scheme not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if in use
    if (existing.Argument.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete scheme: it is in use by existing arguments" },
        { status: 409 }
      );
    }

    // Delete scheme
    await prisma.argumentScheme.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/schemes/${params.id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to delete scheme" },
      { status: 500 }
    );
  }
}
