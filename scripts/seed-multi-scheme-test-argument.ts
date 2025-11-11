#!/usr/bin/env tsx
/**
 * Seed Script: Create Multi-Scheme Test Argument for Week 16 Testing
 * 
 * Creates a climate change argument with a scheme net:
 * 1. Expert Opinion (primary) - Scientists agree on climate change
 * 2. Sign (supporting) - Rising temperatures as evidence
 * 3. Causal Reasoning (supporting) - CO2 causes warming
 * 
 * Usage:
 *   npx tsx scripts/seed-multi-scheme-test-argument.ts
 * 
 * Returns: Created argument ID for testing
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding multi-scheme test argument...\n");

  // 1. Get or create test user
  const testUser = await prisma.user.upsert({
    where: { auth_id: "test-auth-week16" },
    update: {},
    create: {
      auth_id: "test-auth-week16",
      username: "week16-tester",
      name: "Week16 Tester",
      onboarded: true,
    },
  });
  console.log(`✅ Test user: ${testUser.id} (${testUser.username})`);

  // 2. Get or create test deliberation
  const testDeliberation = await prisma.deliberation.upsert({
    where: { id: "test-delib-week16" },
    update: {},
    create: {
      id: "test-delib-week16",
      hostType: "free",
      hostId: "test-room-week16",
      createdById: testUser.id.toString(),
      title: "Week 16 Test: Climate Change Deliberation",
      tags: ["test", "week16", "climate"],
    },
  });
  console.log(`✅ Test deliberation: ${testDeliberation.id}`);

  // 3. Get or create schemes for testing
  const expertScheme = await prisma.argumentScheme.upsert({
    where: { key: "expert_opinion" },
    update: {},
    create: {
      key: "expert_opinion",
      name: "Argument from Expert Opinion",
      summary: "An argument based on the testimony of an expert authority",
      title: "Expert Opinion",
      cq: [
        "Is the source an expert in this domain?",
        "Is the expert reliable?",
        "Is the claim within the expert's field of expertise?",
      ],
    },
  });

  const signScheme = await prisma.argumentScheme.upsert({
    where: { key: "sign" },
    update: {},
    create: {
      key: "sign",
      name: "Argument from Sign",
      summary: "An argument that infers a conclusion from an observed sign or indicator",
      title: "Sign",
      cq: [
        "Is the sign reliable in this context?",
        "Are there alternative explanations for the sign?",
        "How strong is the correlation between sign and conclusion?",
      ],
    },
  });

  const causalScheme = await prisma.argumentScheme.upsert({
    where: { key: "cause_to_effect" },
    update: {},
    create: {
      key: "cause_to_effect",
      name: "Causal Reasoning",
      summary: "An argument that infers an effect from a cause",
      title: "Cause to Effect",
      cq: [
        "Is the cause sufficient to produce the effect?",
        "Are there other causes that could explain the effect?",
        "Is the causal mechanism well-understood?",
      ],
    },
  });

  console.log(`✅ Found schemes:
  - Expert Opinion: ${expertScheme.id}
  - Sign: ${signScheme.id}
  - Causal Reasoning: ${causalScheme.id}
`);

  // 4. Delete existing test argument if present (for clean re-runs)
  const existingArg = await prisma.argument.findUnique({
    where: { id: "test-multi-scheme-climate-arg" },
  });
  
  if (existingArg) {
    console.log("🔄 Deleting existing test argument for clean re-run...");
    await prisma.argument.delete({
      where: { id: "test-multi-scheme-climate-arg" },
    });
  }

  // 5. Create multi-scheme argument
  const multiSchemeArg = await prisma.argument.create({
    data: {
      id: "test-multi-scheme-climate-arg",
      deliberationId: testDeliberation.id,
      authorId: testUser.id.toString(),
      text: `Climate scientists overwhelmingly agree that human activity is causing global warming. Rising global temperatures over the past century, particularly the sharp increase since 1980, serve as clear evidence of this warming trend. The causal mechanism is well-established: increased atmospheric CO2 from burning fossil fuels traps heat through the greenhouse effect, directly causing the observed temperature rise.`,
      confidence: 0.95,
      isImplicit: false,
      mediaType: "text",
      // Note: Legacy schemeId left null - this is a multi-scheme argument
    },
  });
  console.log(`✅ Created argument: ${multiSchemeArg.id}`);

  // 6. Create scheme net (sequential composition)
  const schemeNet = await prisma.schemeNet.create({
    data: {
      argumentId: multiSchemeArg.id,
      description: "Sequential argumentation chain: Expert consensus → Sign evidence → Causal explanation",
      overallConfidence: 0.90,
    },
  });
  console.log(`✅ Created scheme net: ${schemeNet.id}`);

  // 7. Create net steps (sequential chain)
  const step1 = await prisma.schemeNetStep.create({
    data: {
      netId: schemeNet.id,
      schemeId: expertScheme.id,
      stepOrder: 1,
      label: "Expert Consensus",
      stepText: "Climate scientists overwhelmingly agree that human activity is causing global warming.",
      confidence: 0.95,
      inputFromStep: null, // First step
    },
  });

  const step2 = await prisma.schemeNetStep.create({
    data: {
      netId: schemeNet.id,
      schemeId: signScheme.id,
      stepOrder: 2,
      label: "Observational Evidence",
      stepText: "Rising global temperatures over the past century, particularly the sharp increase since 1980, serve as clear evidence of this warming trend.",
      confidence: 0.92,
      inputFromStep: 1, // Feeds from expert consensus
      inputSlotMapping: {
        A: "P1.conclusion", // Sign conclusion references expert opinion
      },
    },
  });

  const step3 = await prisma.schemeNetStep.create({
    data: {
      netId: schemeNet.id,
      schemeId: causalScheme.id,
      stepOrder: 3,
      label: "Causal Mechanism",
      stepText: "Increased atmospheric CO2 from burning fossil fuels traps heat through the greenhouse effect, directly causing the observed temperature rise.",
      confidence: 0.88,
      inputFromStep: 2, // Feeds from sign evidence
      inputSlotMapping: {
        C: "P2.conclusion", // Cause conclusion references sign evidence
      },
    },
  });

  console.log(`✅ Created net steps:
  1. ${step1.id} (Expert Opinion)
  2. ${step2.id} (Sign)
  3. ${step3.id} (Causal Reasoning)
`);

  // 7. Create argument-scheme instances (many-to-many)
  const instance1 = await prisma.argumentSchemeInstance.create({
    data: {
      argumentId: multiSchemeArg.id,
      schemeId: expertScheme.id,
      confidence: 0.95,
      isPrimary: true,
      role: "primary",
      explicitness: "explicit",
      order: 1,
      textEvidence: "Climate scientists overwhelmingly agree",
    },
  });

  const instance2 = await prisma.argumentSchemeInstance.create({
    data: {
      argumentId: multiSchemeArg.id,
      schemeId: signScheme.id,
      confidence: 0.92,
      isPrimary: false,
      role: "supporting",
      explicitness: "explicit",
      order: 2,
      textEvidence: "Rising global temperatures over the past century",
    },
  });

  const instance3 = await prisma.argumentSchemeInstance.create({
    data: {
      argumentId: multiSchemeArg.id,
      schemeId: causalScheme.id,
      confidence: 0.88,
      isPrimary: false,
      role: "supporting",
      explicitness: "explicit",
      order: 3,
      textEvidence: "CO2 from burning fossil fuels traps heat through the greenhouse effect",
    },
  });

  console.log(`✅ Created scheme instances:
  1. ${instance1.id} (primary)
  2. ${instance2.id} (supporting)
  3. ${instance3.id} (supporting)
`);

  // 8. Verify net detection
  console.log("\n🔍 Verifying net structure...");
  const verifyArg = await prisma.argument.findUnique({
    where: { id: multiSchemeArg.id },
    include: {
      schemeNet: {
        include: {
          steps: {
            include: {
              scheme: true,
            },
            orderBy: { stepOrder: "asc" },
          },
        },
      },
      argumentSchemes: {
        include: {
          scheme: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  console.log("\n✅ Verification complete!");
  console.log(`
Net Structure:
- Argument ID: ${verifyArg?.id}
- Scheme Net ID: ${verifyArg?.schemeNet?.id}
- Net Steps: ${verifyArg?.schemeNet?.steps.length || 0}
- Scheme Instances: ${verifyArg?.argumentSchemes.length || 0}

Schemes in Net:
${verifyArg?.schemeNet?.steps
  .map((s) => `  ${s.stepOrder}. ${s.label} (${s.scheme.name})`)
  .join("\n")}

Test with:
  - Argument ID: ${multiSchemeArg.id}
  - Deliberation ID: ${testDeliberation.id}
  - API: POST /api/nets/detect {"argumentId":"${multiSchemeArg.id}"}
  - Test Page: /test/net-analyzer
`);

  return multiSchemeArg.id;
}

main()
  .then((argId) => {
    console.log(`\n✅ SUCCESS! Argument ID: ${argId}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
