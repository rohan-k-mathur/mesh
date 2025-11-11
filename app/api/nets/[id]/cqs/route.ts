import { NextRequest, NextResponse } from "next/server";
import { NetAwareCQService } from "@/app/server/services/NetAwareCQService";
import { NetIdentificationService } from "@/app/server/services/NetIdentificationService";
import { DependencyInferenceEngine } from "@/app/server/services/DependencyInferenceEngine";
import { ExplicitnessClassifier } from "@/app/server/services/ExplicitnessClassifier";
import { prisma } from "@/lib/prismaclient";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = request.nextUrl;
    const groupBy = searchParams.get("groupBy") as any;

    // Fetch net - for now using mock detection
    // TODO: Replace with actual database fetch when ArgumentNet model exists
    const netService = new NetIdentificationService();
    
    // Mock: fetch argument and detect net
    const argument = await prisma.argument.findUnique({
      where: { id: params.id },
      include: { 
        premises: true,
        deliberation: true,
      },
    });

    if (!argument) {
      return NextResponse.json({ error: "Argument not found" }, { status: 404 });
    }

    // Detect net structure
    const net = await netService.detectMultiScheme(params.id);
    
    if (!net) {
      return NextResponse.json({ error: "Net not found" }, { status: 404 });
    }

    // Get argument text for explicitness analysis
    const argumentText = [
      argument.conclusion,
      ...(argument.premises.map((p: any) => p.text) || []),
    ]
      .filter(Boolean)
      .join(" ");

    // Analyze net
    const depEngine = new DependencyInferenceEngine();
    const classifier = new ExplicitnessClassifier();

    const dependencyGraph = await depEngine.inferDependencies(net);
    const explicitnessAnalysis = await classifier.classifyExplicitness(
      net,
      dependencyGraph,
      argumentText
    );

    // Generate CQs
    const cqService = new NetAwareCQService();
    const questions = await cqService.generateNetCQs(
      params.id,
      net,
      dependencyGraph,
      explicitnessAnalysis
    );

    // Group if requested
    if (groupBy) {
      const groups = cqService.groupCQs(questions, groupBy);
      return NextResponse.json({ groups, totalQuestions: questions.length });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Net CQ generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate critical questions" },
      { status: 500 }
    );
  }
}
