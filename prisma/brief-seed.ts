import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create a dummy Brief
  const slug = `demo-brief-${Date.now()}`;
  const brief = await prisma.brief.create({
    data: {
      roomId: 'room-123',
      title: 'Demo Brief',
      slug,
      createdById: 'user-abc',
      visibility: 'public',
      status: 'draft',
    },
  });
  

  console.log('Created Brief:', brief);

  // 2. Create Version 1
  const version1 = await prisma.briefVersion.create({
    data: {
      briefId: brief.id,
      number: 1,
      sectionsJson: {
        overview: 'This is version 1 of the demo brief. It introduces the topic.',
        positions: 'Version 1 includes two main positions from the discussion.',
        evidence: 'Cites a couple of sources (see links).',
      },
      citations: [],
      createdById: 'user-abc',
    },
  });

  // Add a link for v1
  await prisma.briefLink.create({
    data: {
      briefVersionId: version1.id,
      sourceType: 'card',
      sourceId: 'demo-card-1',
    },
  });

  console.log('Added Version 1');

  // 3. Create Version 2
  const version2 = await prisma.briefVersion.create({
    data: {
      briefId: brief.id,
      number: 2,
      sectionsJson: {
        overview: 'Version 2 refines the arguments and clarifies open questions.',
        positions: 'Adds a third position raised in later deliberations.',
        evidence: 'Expanded evidence base with new studies.',
        openQuestions: 'What trade-offs remain unresolved?',
        decision: 'Consensus leaning toward Position B with conditions.',
      },
      citations: [],
      createdById: 'user-abc',
    },
  });

  // Add links for v2
  await prisma.briefLink.createMany({
    data: [
      { briefVersionId: version2.id, sourceType: 'argument', sourceId: 'demo-arg-1' },
      { briefVersionId: version2.id, sourceType: 'post', sourceId: 'demo-post-42' },
    ],
  });

  console.log('Added Version 2 with links');

  // 4. Point Brief.currentVersionId → version2
  const updatedBrief = await prisma.brief.update({
    where: { id: brief.id },
    data: {
      currentVersionId: version2.id,
      status: 'published',
    },
    include: {
      currentVersion: true,
      versions: { include: { links: true } },
    },
  });

  console.dir(updatedBrief, { depth: null });
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
