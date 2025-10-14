// app/api/evidentialdev/seed-aif-debate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { $Enums } from '@prisma/client';
import type { AifSubgraph } from '@/lib/arguments/diagram';
import type { StatementRole, InferenceKind } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;
const uid = (n = 6) => Math.random().toString(36).slice(2, 2 + n);
const moid = (tag: string) => `seed:${tag}:${Date.now()}:${uid(4)}`;

export async function GET() { 
  return NextResponse.json({ ok: true }, NO_STORE); 
}

export async function POST(_req: NextRequest) {
  // ==================== 0) Setup: Room + Deliberation ====================
  const room = await prisma.agoraRoom.create({
    data: { 
      slug: `bike-lanes-${Date.now()}-${uid(3)}`, 
      title: 'Protected Bike Lanes on Maple Avenue',
      summary: 'Should the city install protected bike lanes on Maple Ave?'
    },
    select: { id: true, slug: true, title: true }
  });

  // Create deliberation
  let deliberationId: string;
  try {
    const hostTypeAny = (Object.values(($Enums as any)?.DeliberationHostType ?? {})[0] as any) || 'topic';
    const delib = await prisma.deliberation.create({
      data: {
        hostType: hostTypeAny,
        hostId: `topic:bike-lanes-${uid(4)}`,
        createdById: 'system',
        rule: 'utilitarian' as any,
        roomId: room.id,
        agoraRoomId: room.id as any,
      },
      select: { id: true }
    }).catch(async () => {
      return await prisma.deliberation.create({
        data: {
          hostType: hostTypeAny, 
          hostId: `topic:${uid(6)}`, 
          createdById: 'system', 
          rule: 'utilitarian' as any, 
          roomId: room.id
        },
        select: { id: true }
      });
    });
    deliberationId = delib.id;
  } catch {
    const anyDelib = await prisma.deliberation.findFirst({ select: { id: true } });
    if (!anyDelib) {
      return NextResponse.json(
        { ok: false, error: 'Cannot create deliberation' },
        { status: 500, ...NO_STORE }
      );
    }
    deliberationId = anyDelib.id;
  }

  // ==================== 1) Claims ====================
  const [mainClaim, safetyClaim, trafficClaim, costClaim] = await Promise.all([
    prisma.claim.create({
      data: {
        deliberationId,
        text: 'The city should install protected bike lanes on Maple Avenue',
        createdById: 'system',
        moid: moid('main-claim'),
      },
      select: { id: true, text: true }
    }),
    prisma.claim.create({
      data: {
        deliberationId,
        text: 'Protected bike lanes significantly improve cyclist safety',
        createdById: 'system',
        moid: moid('safety-claim'),
      },
      select: { id: true, text: true }
    }),
    prisma.claim.create({
      data: {
        deliberationId,
        text: 'Bike lanes will worsen traffic congestion',
        createdById: 'system',
        moid: moid('traffic-claim'),
      },
      select: { id: true, text: true }
    }),
    prisma.claim.create({
      data: {
        deliberationId,
        text: 'The project cost is justified by long-term benefits',
        createdById: 'system',
        moid: moid('cost-claim'),
      },
      select: { id: true, text: true }
    }),
  ]);

  // ==================== 2) Safety Argument (Main Supporting) ====================
  const safetyArg = await prisma.argument.create({
    data: {
      deliberationId,
      authorId: 'system',
      text: 'Safety Argument: Protected lanes reduce injuries',
      claimId: mainClaim.id,
    },
    select: { id: true, text: true }
  });

  // Create detailed ArgumentDiagram for safety argument with AIF
  const safetyDiagram = await prisma.argumentDiagram.create({
    data: {
      title: 'Safety Case for Protected Bike Lanes',
      createdById: 'system',
      statements: {
        create: [
          { 
            text: 'Protected lanes reduce injuries by 40-50% in peer cities', 
            role: 'premise', 
            tags: ['data', 'safety'] 
          },
          { 
            text: 'Maple Ave carries heavy bike and scooter traffic from two schools', 
            role: 'premise', 
            tags: ['context', 'demand'] 
          },
          { 
            text: 'If an intervention reduces injuries and demand is high, the city ought to implement it', 
            role: 'warrant', 
            tags: ['policy-principle'] 
          },
          { 
            text: 'The city should install protected bike lanes on Maple Avenue', 
            role: 'conclusion', 
            tags: ['recommendation'] 
          },
        ]
      }
    },
    select: { id: true, title: true, statements: { select: { id: true, text: true, role: true } } }
  });

  // Create inference linking premises to conclusion
  const stmtMap = new Map<string, string>(
    safetyDiagram.statements.map((s: { id: string; text: string; role: StatementRole }) => [s.text, s.id])
  );
  const safetyInference = await prisma.inference.create({
    data: {
      diagramId: safetyDiagram.id,
     kind: 'PRESUMPTIVE',
      conclusionId: stmtMap.get('The city should install protected bike lanes on Maple Avenue')!,
      schemeKey: 'value_based_practical_reasoning',
      cqKeys: [],
    },
    select: { id: true }
  });

  // Link premises to inference
  await Promise.all([
    prisma.inferencePremise.create({
      data: { 
        inferenceId: safetyInference.id, 
        statementId: stmtMap.get('Protected lanes reduce injuries by 40-50% in peer cities')! 
      }
    }),
    prisma.inferencePremise.create({
      data: { 
        inferenceId: safetyInference.id, 
        statementId: stmtMap.get('Maple Ave carries heavy bike and scooter traffic from two schools')! 
      }
    }),
    prisma.inferencePremise.create({
      data: { 
        inferenceId: safetyInference.id, 
        statementId: stmtMap.get('If an intervention reduces injuries and demand is high, the city ought to implement it')! 
      }
    }),
  ]);

  // Generate AIF graph for safety argument
  const safetyAif: AifSubgraph = {
    nodes: [
      { id: 'I:safety_data', kind: 'I', label: 'Protected lanes reduce injuries by 40-50%', 
        label: 'Protected lanes reduce injuries by 40-50% in peer cities' },
      { id: 'I:demand', kind: 'I', label: 'High bike traffic from schools', 
        label: 'Maple Ave carries heavy bike and scooter traffic from two schools' },
      { id: 'I:warrant', kind: 'I', label: 'Policy principle', 
        label: 'If an intervention reduces injuries and demand is high, the city ought to implement it' },
      { id: 'RA:safety', kind: 'RA', label: 'Safety reasoning', schemeKey: 'value_based_practical_reasoning' },
      { id: 'I:conclusion', kind: 'I', label: 'Should install bike lanes', 
        label: 'The city should install protected bike lanes on Maple Avenue' },
    ],
    edges: [
      { id: 'e1', from: 'I:safety_data', to: 'RA:safety', role: 'premise' },
      { id: 'e2', from: 'I:demand', to: 'RA:safety', role: 'premise' },
      { id: 'e3', from: 'I:warrant', to: 'RA:safety', role: 'premise' },
      { id: 'e4', from: 'RA:safety', to: 'I:conclusion', role: 'conclusion' },
    ]
  };

  // Update diagram with AIF data
  await prisma.argumentDiagram.update({
    where: { id: safetyDiagram.id },
    data: { aif: safetyAif as any }
  });

  // ==================== 3) Traffic Opposition Argument ====================
  const trafficArg = await prisma.argument.create({
    data: {
      deliberationId,
      authorId: 'system',
      text: 'Traffic Argument: Lanes will worsen congestion',
      claimId: trafficClaim.id,
    },
    select: { id: true, text: true }
  });

  const trafficDiagram = await prisma.argumentDiagram.create({
    data: {
      title: 'Traffic Congestion Concerns',
      createdById: 'system',
      statements: {
        create: [
          { text: 'Removing one car lane will reduce vehicle capacity', role: 'premise', tags: ['traffic'] },
          { text: 'Maple Ave is already congested during peak hours', role: 'premise', tags: ['context'] },
          { text: 'Reduced capacity on congested roads increases delays', role: 'warrant', tags: ['traffic-principle'] },
          { text: 'Bike lanes will worsen traffic congestion', role: 'conclusion', tags: ['prediction'] },
        ]
      }
    },
    select: { id: true, statements: { select: { id: true, text: true, role: true } } }
  });

//   enum InferenceKind {
//   presumptive
//   deductive
//   inductive
//   abductive
//   defeasible
//   analogy
// }

  const trafficStmtMap = new Map(trafficDiagram.statements.map(s => [s.text, s.id]));
  const trafficInference = await prisma.inference.create({
    data: {
      diagramId: trafficDiagram.id,
      kind: 'causal_reasoning',
      conclusionId: trafficStmtMap.get('Bike lanes will worsen traffic congestion')!,
      schemeKey: 'cause_to_effect',
      cqKeys: [],
    },
    select: { id: true }
  });

  await Promise.all([
    prisma.inferencePremise.create({
      data: { inferenceId: trafficInference.id, statementId: trafficStmtMap.get('Removing one car lane will reduce vehicle capacity')! }
    }),
    prisma.inferencePremise.create({
      data: { inferenceId: trafficInference.id, statementId: trafficStmtMap.get('Maple Ave is already congested during peak hours')! }
    }),
    prisma.inferencePremise.create({
      data: { inferenceId: trafficInference.id, statementId: trafficStmtMap.get('Reduced capacity on congested roads increases delays')! }
    }),
  ]);

  // AIF for traffic argument with conflict
  const trafficAif: AifSubgraph = {
    nodes: [
      { id: 'I:capacity', kind: 'I', label: 'Reduced vehicle capacity', 
        label: 'Removing one car lane will reduce vehicle capacity' },
      { id: 'I:current_congestion', kind: 'I', label: 'Already congested', 
        label: 'Maple Ave is already congested during peak hours' },
      { id: 'I:traffic_warrant', kind: 'I', label: 'Traffic principle', 
        label: 'Reduced capacity on congested roads increases delays' },
      { id: 'RA:traffic', kind: 'RA', label: 'Traffic reasoning', schemeKey: 'cause_to_effect' },
      { id: 'I:traffic_conclusion', kind: 'I', label: 'Will worsen congestion', 
        label: 'Bike lanes will worsen traffic congestion' },
      // Conflict with safety argument
      { id: 'CA:conflict1', kind: 'CA', label: 'Rebut', schemeKey: 'REBUT' },
    ],
    edges: [
      { id: 'e1', from: 'I:capacity', to: 'RA:traffic', role: 'premise' },
      { id: 'e2', from: 'I:current_congestion', to: 'RA:traffic', role: 'premise' },
      { id: 'e3', from: 'I:traffic_warrant', to: 'RA:traffic', role: 'premise' },
      { id: 'e4', from: 'RA:traffic', to: 'I:traffic_conclusion', role: 'conclusion' },
      // Conflict: traffic concerns rebut the bike lane proposal
      { id: 'e5', from: 'RA:traffic', to: 'CA:conflict1', role: 'conflictingElement' },
      { id: 'e6', from: 'CA:conflict1', to: 'I:conclusion', role: 'conflictedElement' },
    ]
  };

  await prisma.argumentDiagram.update({
    where: { id: trafficDiagram.id },
    data: { aif: trafficAif as any }
  });

  // ==================== 4) Counter-argument: Modal Shift ====================
  const modalShiftArg = await prisma.argument.create({
    data: {
      deliberationId,
      authorId: 'system',
      text: 'Modal Shift Response: More biking reduces car traffic',
      claimId: mainClaim.id,
    },
    select: { id: true, text: true }
  });

  const modalShiftDiagram = await prisma.argumentDiagram.create({
    data: {
      title: 'Modal Shift Counterargument',
      createdById: 'system',
      statements: {
        create: [
          { text: 'Protected lanes increase cycling by 50-75% (Seattle, Portland data)', role: 'premise', tags: ['data'] },
          { text: 'Each new cyclist is one less car on the road', role: 'premise', tags: ['modal-shift'] },
          { text: 'The net effect reduces congestion rather than increasing it', role: 'conclusion', tags: ['rebuttal'] },
        ]
      }
    },
    select: { id: true, statements: { select: { id: true, text: true, role: true } } }
  });

  const modalStmtMap = new Map(modalShiftDiagram.statements.map(s => [s.text, s.id]));
  const modalInference = await prisma.inference.create({
    data: {
      diagramId: modalShiftDiagram.id,
      kind: 'causal_reasoning',
      conclusionId: modalStmtMap.get('The net effect reduces congestion rather than increasing it')!,
      schemeKey: 'cause_to_effect',
      cqKeys: [],
    },
    select: { id: true }
  });

  await Promise.all([
    prisma.inferencePremise.create({
      data: { inferenceId: modalInference.id, statementId: modalStmtMap.get('Protected lanes increase cycling by 50-75% (Seattle, Portland data)')! }
    }),
    prisma.inferencePremise.create({
      data: { inferenceId: modalInference.id, statementId: modalStmtMap.get('Each new cyclist is one less car on the road')! }
    }),
  ]);

  // Complex AIF with undercut attack on traffic argument
  const modalShiftAif: AifSubgraph = {
    nodes: [
      { id: 'I:modal_data', kind: 'I', label: 'Cycling increases 50-75%', 
        label: 'Protected lanes increase cycling by 50-75% (Seattle, Portland data)' },
      { id: 'I:one_less_car', kind: 'I', label: 'Modal substitution', 
        label: 'Each new cyclist is one less car on the road' },
      { id: 'RA:modal_shift', kind: 'RA', label: 'Modal shift reasoning', schemeKey: 'cause_to_effect' },
      { id: 'I:modal_conclusion', kind: 'I', label: 'Net reduces congestion', 
        label: 'The net effect reduces congestion rather than increasing it' },
      // Undercut attack on traffic argument's inference
      { id: 'CA:undercut1', kind: 'CA', label: 'Undercut', schemeKey: 'UNDERCUT' },
    ],
    edges: [
      { id: 'e1', from: 'I:modal_data', to: 'RA:modal_shift', role: 'premise' },
      { id: 'e2', from: 'I:one_less_car', to: 'RA:modal_shift', role: 'premise' },
      { id: 'e3', from: 'RA:modal_shift', to: 'I:modal_conclusion', role: 'conclusion' },
      // Undercut: modal shift attacks the inference in traffic argument
      { id: 'e4', from: 'RA:modal_shift', to: 'CA:undercut1', role: 'conflictingElement' },
      { id: 'e5', from: 'CA:undercut1', to: 'RA:traffic', role: 'conflictedElement' },
    ]
  };

  await prisma.argumentDiagram.update({
    where: { id: modalShiftDiagram.id },
    data: { aif: modalShiftAif as any }
  });

  // ==================== 5) Expert Opinion Argument ====================
  const expertArg = await prisma.argument.create({
    data: {
      deliberationId,
      authorId: 'system',
      text: 'Expert Opinion: Transportation planners support the project',
      claimId: mainClaim.id,
    },
    select: { id: true, text: true }
  });

  const expertDiagram = await prisma.argumentDiagram.create({
    data: {
      title: 'Expert Opinion Support',
      createdById: 'system',
      statements: {
        create: [
          { text: 'City Transportation Department recommends protected lanes for Maple Ave', role: 'premise', tags: ['expert'] },
          { text: 'Transportation planners are experts in urban mobility', role: 'premise', tags: ['credibility'] },
          { text: 'We should follow expert recommendations on technical matters', role: 'warrant', tags: ['epistemic'] },
          { text: 'The city should install protected bike lanes on Maple Avenue', role: 'conclusion', tags: ['recommendation'] },
        ]
      }
    },
    select: { id: true, statements: { select: { id: true, text: true, role: true } } }
  });

  const expertStmtMap = new Map(expertDiagram.statements.map(s => [s.text, s.id]));
  const expertInference = await prisma.inference.create({
    data: {
      diagramId: expertDiagram.id,
      kind: 'expert_opinion',
      conclusionId: expertStmtMap.get('The city should install protected bike lanes on Maple Avenue')!,
      schemeKey: 'argument_from_expert_opinion',
      cqKeys: ['CQ1: Is the source a genuine expert?', 'CQ2: Is the expert's opinion relevant?'],
    },
    select: { id: true }
  });

  await Promise.all([
    prisma.inferencePremise.create({
      data: { inferenceId: expertInference.id, statementId: expertStmtMap.get('City Transportation Department recommends protected lanes for Maple Ave')! }
    }),
    prisma.inferencePremise.create({
      data: { inferenceId: expertInference.id, statementId: expertStmtMap.get('Transportation planners are experts in urban mobility')! }
    }),
    prisma.inferencePremise.create({
      data: { inferenceId: expertInference.id, statementId: expertStmtMap.get('We should follow expert recommendations on technical matters')! }
    }),
  ]);

  const expertAif: AifSubgraph = {
    nodes: [
      { id: 'I:expert_says', kind: 'I', label: 'Transportation Dept recommends', 
        label: 'City Transportation Department recommends protected lanes for Maple Ave' },
      { id: 'I:expert_cred', kind: 'I', label: 'Planners are experts', 
        label: 'Transportation planners are experts in urban mobility' },
      { id: 'I:expert_warrant', kind: 'I', label: 'Follow expert advice', 
        label: 'We should follow expert recommendations on technical matters' },
      { id: 'RA:expert', kind: 'RA', label: 'Expert opinion', schemeKey: 'argument_from_expert_opinion' },
      { id: 'I:expert_conclusion', kind: 'I', label: 'Should install lanes', 
        label: 'The city should install protected bike lanes on Maple Avenue' },
    ],
    edges: [
      { id: 'e1', from: 'I:expert_says', to: 'RA:expert', role: 'premise' },
      { id: 'e2', from: 'I:expert_cred', to: 'RA:expert', role: 'premise' },
      { id: 'e3', from: 'I:expert_warrant', to: 'RA:expert', role: 'premise' },
      { id: 'e4', from: 'RA:expert', to: 'I:expert_conclusion', role: 'conclusion' },
    ]
  };

  await prisma.argumentDiagram.update({
    where: { id: expertDiagram.id },
    data: { aif: expertAif as any }
  });

  // ==================== 6) Argument Supports & Edges ====================
  await prisma.argumentSupport.createMany({
    data: [
      { deliberationId, claimId: mainClaim.id, argumentId: safetyArg.id, base: 0.72 },
      { deliberationId, claimId: trafficClaim.id, argumentId: trafficArg.id, base: 0.58 },
      { deliberationId, claimId: mainClaim.id, argumentId: modalShiftArg.id, base: 0.65 },
      { deliberationId, claimId: mainClaim.id, argumentId: expertArg.id, base: 0.68 },
    ],
    skipDuplicates: true,
  });

  // Create argument edges (modal shift rebuts traffic argument)
  await prisma.argumentEdge.createMany({
    data: [
      { 
        deliberationId, 
        fromArgumentId: modalShiftArg.id, 
        toArgumentId: trafficArg.id, 
        type: 'challenge' as any, 
        createdById: 'system', 
        targetScope: 'inference' as any 
      },
    ],
    skipDuplicates: true,
  });

  // ==================== 7) DebateSheet & Nodes ====================
  const sheet = await prisma.debateSheet.create({
    data: {
      title: `Bike Lanes Debate • ${room.slug}`,
      createdById: 'system',
      deliberation: { connect: { id: deliberationId } },
      room: { connect: { id: room.id } },
    },
    select: { id: true }
  });

  await prisma.debateNode.createMany({
    data: [
      // Claims
      { sheetId: sheet.id, title: mainClaim.text, claimId: mainClaim.id },
      { sheetId: sheet.id, title: safetyClaim.text, claimId: safetyClaim.id },
      { sheetId: sheet.id, title: trafficClaim.text, claimId: trafficClaim.id },
      { sheetId: sheet.id, title: costClaim.text, claimId: costClaim.id },
      // Arguments with diagrams
      { sheetId: sheet.id, title: safetyArg.text, argumentId: safetyArg.id, diagramId: safetyDiagram.id },
      { sheetId: sheet.id, title: trafficArg.text, argumentId: trafficArg.id, diagramId: trafficDiagram.id },
      { sheetId: sheet.id, title: modalShiftArg.text, argumentId: modalShiftArg.id, diagramId: modalShiftDiagram.id },
      { sheetId: sheet.id, title: expertArg.text, argumentId: expertArg.id, diagramId: expertDiagram.id },
    ] as any,
    skipDuplicates: true,
  });

  // ==================== 8) Response ====================
  return NextResponse.json({
    ok: true,
    room: { id: room.id, slug: room.slug, title: room.title },
    deliberationId,
    sheetId: sheet.id,
    urls: {
      room: `/agora/rooms/${room.slug}`,
      deliberation: `/deliberation/${deliberationId}`,
      sheet: `/api/sheets/${sheet.id}`,
      sheetAlias: `/api/sheets/delib:${deliberationId}`,
      evidential: `/api/deliberations/${deliberationId}/evidential?mode=product`,
      evidentialMin: `/api/deliberations/${deliberationId}/evidential?mode=min`,
      graph: `/api/deliberations/${deliberationId}/graph?semantics=preferred&confidence=0.6&mode=product`,
    },
    created: {
      claims: {
        main: mainClaim.id,
        safety: safetyClaim.id,
        traffic: trafficClaim.id,
        cost: costClaim.id,
      },
      arguments: {
        safety: { id: safetyArg.id, diagramId: safetyDiagram.id },
        traffic: { id: trafficArg.id, diagramId: trafficDiagram.id },
        modalShift: { id: modalShiftArg.id, diagramId: modalShiftDiagram.id },
        expert: { id: expertArg.id, diagramId: expertDiagram.id },
      },
    },
    summary: {
      scenario: 'Protected bike lanes debate with 4 claims, 4 arguments, all with AIF visualizations',
      features: [
        'Safety argument with practical reasoning',
        'Traffic opposition with causal reasoning',
        'Modal shift counter-argument with undercut attack',
        'Expert opinion with argumentation scheme',
        'Full AIF graphs with conflicts and preferences',
      ],
    },
  }, NO_STORE);
}