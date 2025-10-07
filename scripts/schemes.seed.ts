// prisma/seed/schemes.seed.ts
import { PrismaClient, AttackType, TargetScope } from "@prisma/client";
const prisma = new PrismaClient();

type CQSeed = {
  cqKey: string;
  text: string;
  attackType: AttackType;
  targetScope: TargetScope;
};

type SchemeSeed = {
  key: string;
  name: string;
  description?: string;
  purpose: "action" | "state_of_affairs";
  source: "internal" | "external";
  materialRelation: string;
  reasoningType: "deductive" | "inductive" | "abductive" | "practical";
  ruleForm: string;
  conclusionType?: string | null;
  slotHints?: any;
  cqs: CQSeed[];
};

const SEEDS: SchemeSeed[] = [
  {
    key: "expert_opinion",
    name: "Argument from Expert Opinion",
    purpose: "state_of_affairs",
    source: "external",
    materialRelation: "authority",
    reasoningType: "abductive",
    ruleForm: "defeasible_MP",
    conclusionType: "is",
    slotHints: {
      premises: [
        { role: "E", label: "Expert (entity)" },
        { role: "D", label: "Domain" },
        { role: "φ", label: "Statement asserted" },
        { role: "cred", label: "Credibility (optional)" },
      ],
    },
    cqs: [
      { cqKey: "domain_fit", text: "Is E an expert in D?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "consensus",  text: "Do experts in D disagree on φ?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "bias",       text: "Is E biased?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "basis",      text: "Is E’s assertion based on evidence?", attackType: "UNDERMINES", targetScope: "premise" },
    ],
  },
  {
    key: "practical_reasoning",
    name: "Practical Reasoning (Goal→Means→Ought)",
    purpose: "action",
    source: "internal",
    materialRelation: "practical",
    reasoningType: "practical",
    ruleForm: "defeasible_MP",
    conclusionType: "ought",
    cqs: [
      { cqKey: "alternatives", text: "Are there better alternatives to A?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "feasible",     text: "Is A feasible?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "side_effects", text: "Does A have significant negative consequences?", attackType: "UNDERCUTS", targetScope: "inference" },
    ],
  },
  {
    key: "positive_consequences",
    name: "Argument from Positive Consequences",
    purpose: "action",
    source: "internal",
    materialRelation: "cause",
    reasoningType: "inductive",
    ruleForm: "defeasible_MP",
    conclusionType: "ought",
    cqs: [
      { cqKey: "tradeoffs", text: "Are there offsetting negative consequences?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "uncertain", text: "Are the claimed benefits uncertain?", attackType: "UNDERCUTS", targetScope: "inference" },
    ],
  },
  {
    key: "negative_consequences",
    name: "Argument from Negative Consequences",
    purpose: "action",
    source: "internal",
    materialRelation: "cause",
    reasoningType: "inductive",
    ruleForm: "defeasible_MP",
    conclusionType: "ought",
    cqs: [
      { cqKey: "mitigate", text: "Can A’s harms be mitigated?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "exaggerated", text: "Are the harms exaggerated or unlikely?", attackType: "UNDERCUTS", targetScope: "inference" },
    ],
  },
  {
    key: "analogy",
    name: "Argument from Analogy",
    purpose: "state_of_affairs",
    source: "internal",
    materialRelation: "analogy",
    reasoningType: "abductive",
    ruleForm: "defeasible_MP",
    cqs: [
      { cqKey: "relevant_sims", text: "Are the relevant similarities strong?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "critical_diffs", text: "Are there critical differences?", attackType: "UNDERCUTS", targetScope: "inference" },
    ],
  },
  {
    key: "causal",
    name: "Causal (If cause then effect)",
    purpose: "state_of_affairs",
    source: "internal",
    materialRelation: "cause",
    reasoningType: "inductive",
    ruleForm: "defeasible_MP",
    cqs: [
      { cqKey: "alt_causes", text: "Could another cause explain the effect?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "post_hoc",   text: "Is this merely correlation (post hoc)?", attackType: "UNDERCUTS", targetScope: "inference" },
    ],
  },
  {
    key: "classification",
    name: "Classification/Definition",
    purpose: "state_of_affairs",
    source: "internal",
    materialRelation: "definition",
    reasoningType: "deductive",
    ruleForm: "MP",
    cqs: [
      { cqKey: "category_fit", text: "Does the case fit the category?", attackType: "UNDERCUTS", targetScope: "inference" },
    ],
  },
];

async function main() {
  for (const s of SEEDS) {
    const scheme = await prisma.argumentScheme.upsert({
      where: { key: s.key },
      update: {
        name: s.name,
        description: s.description ?? null,
        purpose: s.purpose,
        source: s.source,
        materialRelation: s.materialRelation,
        reasoningType: s.reasoningType,
        ruleForm: s.ruleForm,
        conclusionType: s.conclusionType ?? null,
        slotHints: s.slotHints ?? {},
      },
      create: {
        key: s.key,
        name: s.name,
        description: s.description ?? null,
        purpose: s.purpose,
        source: s.source,
        materialRelation: s.materialRelation,
        reasoningType: s.reasoningType,
        ruleForm: s.ruleForm,
        conclusionType: s.conclusionType ?? null,
        slotHints: s.slotHints ?? {},
      },
    });

    for (const cq of s.cqs) {
      await prisma.criticalQuestion.upsert({
        where: { schemeId_cqKey: { schemeId: scheme.id, cqKey: cq.cqKey } },
        update: {
          text: cq.text,
          attackType: cq.attackType,
          targetScope: cq.targetScope,
        },
        create: {
          schemeId: scheme.id,
          cqKey: cq.cqKey,
          text: cq.text,
          attackType: cq.attackType,
          targetScope: cq.targetScope,
        },
      });
    }
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
