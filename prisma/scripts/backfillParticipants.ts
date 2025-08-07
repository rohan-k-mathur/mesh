import { prisma } from "../../lib/prismaclient";

declare const process: any;

await prisma.$transaction(async (tx) => {
  const dms = await tx.conversation.findMany({ where: { is_group: false } });
  for (const dm of dms) {
    const { user1_id, user2_id } = dm;
    if (!user1_id || !user2_id) continue;
    await tx.conversationParticipant.createMany({
      data: [
        { conversation_id: dm.id, user_id: user1_id },
        { conversation_id: dm.id, user_id: user2_id },
      ],
      skipDuplicates: true,
    });
  }
});

console.log("Backfill complete");
process.exit(0);
