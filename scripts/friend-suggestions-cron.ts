import { prisma } from "../lib/prismaclient";
import { generateFriendSuggestions, updateUserEmbedding } from "../lib/actions/friend-suggestions.actions";

async function run() {
  await prisma.$connect();
  const users = await prisma.user.findMany({
    where: { onboarded: true },
    select: { id: true },
  });

  for (const user of users) {
    await updateUserEmbedding(user.id);
    await generateFriendSuggestions(user.id);
  }
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
