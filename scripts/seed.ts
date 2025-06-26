import { prisma } from "../lib/prismaclient";
import { nanoid } from "nanoid";

const firstNames = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eve",
  "Frank",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
];

const lastNames = [
  "Anderson",
  "Brown",
  "Clark",
  "Davis",
  "Edwards",
  "Franklin",
  "Garcia",
  "Harris",
  "Iverson",
  "Johnson",
];

const samplePosts = [
  "Hello world!",
  "Enjoying my time here.",
  "What a great day!",
  "Just posting a quick update.",
  "Learning new things every day.",
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createSampleData() {
  for (let i = 0; i < firstNames.length; i++) {
    const first = firstNames[i];
    const last = getRandom(lastNames);
    const name = `${first} ${last}`;
    const username = `${first.toLowerCase()}${i}`;
    const authId = nanoid();

    const user = await prisma.user.create({
      data: {
        auth_id: authId,
        username,
        name,
        bio: `Bio for ${name}`,
        onboarded: true,
      },
    });

    const postCount = 3;
    for (let j = 0; j < postCount; j++) {
      await prisma.post.create({
        data: {
          content: `${getRandom(samplePosts)} (${j + 1})`,
          author_id: user.id,
        },
      });
    }
  }
}

createSampleData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
