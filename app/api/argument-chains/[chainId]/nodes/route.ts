import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const addNodeSchema = z.object({
  argumentId: z.string(),
  role: z
    .enum(["PREMISE", "EVIDENCE", "CONCLUSION", "OBJECTION", "REBUTTAL", "QUALIFIER"])
    .optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const user = await getUserFromCookies();
    if (!user || !user.userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401, ...NO_STORE }
      );
    }

    const { chainId } = params;
    const body = await req.json();
    const validatedData = addNodeSchema.parse(body);

    // Fetch chain
    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
      include: {
        nodes: true,
      },
    });

    if (!chain) {
      return NextResponse.json(
        { ok: false, error: "Chain not found" },
        { status: 404, ...NO_STORE }
      );
    }

    // Check permissions
    const isCreator = chain.createdBy === BigInt(user.userId);
    const canEdit = isCreator || chain.isEditable;

    if (!canEdit) {
      return NextResponse.json(
        { ok: false, error: "You don't have permission to edit this chain" },
        { status: 403, ...NO_STORE }
      );
    }

    // Verify argument exists and is in same deliberation
    const argument = await prisma.argument.findUnique({
      where: { id: validatedData.argumentId },
    });

    if (!argument) {
      return NextResponse.json(
        { ok: false, error: "Argument not found" },
        { status: 404, ...NO_STORE }
      );
    }

    if (argument.deliberationId !== chain.deliberationId) {
      return NextResponse.json(
        { ok: false, error: "Argument must be from the same deliberation" },
        { status: 400, ...NO_STORE }
      );
    }

    // Check if argument already in chain
    const existingNode = chain.nodes.find(
      (n) => n.argumentId === validatedData.argumentId
    );
    if (existingNode) {
      return NextResponse.json(
        { ok: false, error: "Argument already in this chain" },
        { status: 400, ...NO_STORE }
      );
    }

    // Calculate next node order
    const maxOrder =
      chain.nodes.length > 0
        ? Math.max(...chain.nodes.map((n) => n.nodeOrder))
        : 0;

    // Create node
    const node = await prisma.argumentChainNode.create({
      data: {
        chainId,
        argumentId: validatedData.argumentId,
        nodeOrder: maxOrder + 1,
        role: validatedData.role,
        positionX: validatedData.positionX,
        positionY: validatedData.positionY,
        addedBy: BigInt(user.userId),
      },
      include: {
        argument: {
          select: {
            id: true,
            text: true,
            authorId: true,
            createdAt: true,
            argumentSchemes: {
              include: {
                scheme: {
                  select: {
                    id: true,
                    key: true,
                    name: true,
                  },
                },
              },
            },
            schemeNet: {
              include: {
                steps: {
                  include: {
                    scheme: {
                      select: {
                        id: true,
                        key: true,
                        name: true,
                      },
                    },
                  },
                  orderBy: {
                    stepOrder: "asc",
                  },
                },
              },
            },
          },
        },
        contributor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Serialize BigInt fields
    const serializedNode = {
      ...node,
      addedBy: node.addedBy.toString(),
      contributor: {
        ...node.contributor,
        id: node.contributor.id.toString(),
      },
    };

    return NextResponse.json(
      { ok: true, node: serializedNode },
      { status: 201, ...NO_STORE }
    );
  } catch (error) {
    console.error("[POST /api/argument-chains/[chainId]/nodes] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid request data", details: error.errors },
        { status: 400, ...NO_STORE }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Failed to add node to chain" },
      { status: 500, ...NO_STORE }
    );
  }
}
