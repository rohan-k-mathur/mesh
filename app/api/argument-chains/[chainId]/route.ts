import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

export async function GET(
  _req: NextRequest,
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

    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        deliberation: {
          select: {
            id: true,
            title: true,
          },
        },
        nodes: {
          include: {
            argument: {
              select: {
                id: true,
                text: true,
                authorId: true,
                createdAt: true,
                // Include conclusion claim for proper display text
                conclusion: {
                  select: {
                    id: true,
                    text: true,
                  },
                },
                // Include actual premises for prose structure analysis
                premises: {
                  include: {
                    claim: {
                      select: {
                        id: true,
                        text: true,
                      },
                    },
                  },
                },
                // Include implicit warrant if any
                implicitWarrant: true,
                argumentSchemes: {
                  include: {
                    scheme: {
                      select: {
                        id: true,
                        key: true,
                        name: true,
                        description: true,
                        summary: true,
                        cq: true,
                        premises: true,
                        conclusion: true,
                        purpose: true,
                        source: true,
                        materialRelation: true,
                        reasoningType: true,
                        ruleForm: true,
                        conclusionType: true,
                        whenToUse: true,
                        tags: true,
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
                            description: true,
                            summary: true,
                            cq: true,
                            premises: true,
                            conclusion: true,
                            purpose: true,
                            materialRelation: true,
                            reasoningType: true,
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
          orderBy: {
            nodeOrder: "asc",
          },
        },
        edges: {
          include: {
            sourceNode: {
              include: {
                argument: {
                  select: {
                    id: true,
                    text: true,
                    conclusion: {
                      select: {
                        id: true,
                        text: true,
                      },
                    },
                  },
                },
              },
            },
            targetNode: {
              include: {
                argument: {
                  select: {
                    id: true,
                    text: true,
                    conclusion: {
                      select: {
                        id: true,
                        text: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
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
    const canView = isCreator || chain.isPublic;

    if (!canView) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403, ...NO_STORE }
      );
    }

    // Serialize BigInt fields for JSON
    const serializedChain = {
      ...chain,
      createdBy: chain.createdBy.toString(),
      creator: {
        ...chain.creator,
        id: chain.creator.id.toString(),
      },
      nodes: chain.nodes.map((node) => ({
        ...node,
        addedBy: node.addedBy.toString(),
        contributor: {
          ...node.contributor,
          id: node.contributor.id.toString(),
        },
        argument: node.argument ? {
          ...node.argument,
          authorId: node.argument.authorId?.toString() ?? null,
        } : null,
      })),
      edges: chain.edges.map((edge) => ({
        ...edge,
        sourceNode: edge.sourceNode ? {
          ...edge.sourceNode,
          addedBy: edge.sourceNode.addedBy.toString(),
        } : null,
        targetNode: edge.targetNode ? {
          ...edge.targetNode,
          addedBy: edge.targetNode.addedBy.toString(),
        } : null,
      })),
    };

    return NextResponse.json({ ok: true, chain: serializedChain }, NO_STORE);
  } catch (error) {
    console.error("[GET /api/argument-chains/[chainId]] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch argument chain" },
      { status: 500, ...NO_STORE }
    );
  }
}

export async function PATCH(
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

    // Fetch existing chain
    const existingChain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
    });

    if (!existingChain) {
      return NextResponse.json(
        { ok: false, error: "Chain not found" },
        { status: 404, ...NO_STORE }
      );
    }

    // Check if user is creator
    if (existingChain.createdBy !== BigInt(user.userId)) {
      return NextResponse.json(
        { ok: false, error: "Only the creator can edit this chain" },
        { status: 403, ...NO_STORE }
      );
    }

    // Update chain (only allow updating specific fields)
    const updatedChain = await prisma.argumentChain.update({
      where: { id: chainId },
      data: {
        name: body.name,
        description: body.description,
        purpose: body.purpose,
        chainType: body.chainType,
        isPublic: body.isPublic,
        isEditable: body.isEditable,
        rootNodeId: body.rootNodeId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Serialize BigInt for JSON
    const serializedChain = {
      ...updatedChain,
      createdBy: updatedChain.createdBy.toString(),
      creator: {
        ...updatedChain.creator,
        id: updatedChain.creator.id.toString(),
      },
    };

    return NextResponse.json({ ok: true, chain: serializedChain }, NO_STORE);
  } catch (error) {
    console.error("[PATCH /api/argument-chains/[chainId]] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update argument chain" },
      { status: 500, ...NO_STORE }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
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

    const existingChain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
    });

    if (!existingChain) {
      return NextResponse.json(
        { ok: false, error: "Chain not found" },
        { status: 404, ...NO_STORE }
      );
    }

    // Check if user is creator
    if (existingChain.createdBy !== BigInt(user.userId)) {
      return NextResponse.json(
        { ok: false, error: "Only the creator can delete this chain" },
        { status: 403, ...NO_STORE }
      );
    }

    // Delete chain (cascade deletes nodes and edges)
    await prisma.argumentChain.delete({
      where: { id: chainId },
    });

    return NextResponse.json({ ok: true }, { status: 200, ...NO_STORE });
  } catch (error) {
    console.error("[DELETE /api/argument-chains/[chainId]] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete argument chain" },
      { status: 500, ...NO_STORE }
    );
  }
}
