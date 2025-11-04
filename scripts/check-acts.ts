import { prisma } from '../lib/prismaclient';

async function main() {
  // Get the QA test deliberation specifically
  const deliberationId = 'cmgy6c8vz0000c04w4l9khiux';
  
  const designs = await prisma.ludicDesign.findMany({
    where: { deliberationId },
    include: { 
      acts: { 
        select: { id: true, kind: true, polarity: true, expression: true, locus: { select: { path: true } } }
      }
    }
  });

  console.log(`Found ${designs.length} designs:`);
  designs.forEach(d => {
    console.log(`\n📦 Design ${d.id.slice(0,8)} (${d.participantId}):`);
    console.log(`   Acts: ${d.acts.length}`);
    d.acts.slice(0, 8).forEach(act => {
      const locusPath = act.locus?.path || 'NO_LOCUS';
      console.log(`   - ${locusPath} [${act.polarity}] ${act.kind}: ${act.expression?.substring(0,40) || ''}`);
    });
  });

  await prisma.$disconnect();
}

main().catch(console.error);
