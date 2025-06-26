import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prismaclient";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { serverConfig } from "../lib/firebase/config";

initializeApp({
  credential: cert(serverConfig.serviceAccount),
});

const GLOBAL_ROOM_ID = "global";

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
  await prisma.realtimeRoom.upsert({
    where: { id: GLOBAL_ROOM_ID },
    update: {},
    create: { id: GLOBAL_ROOM_ID, room_icon: "/assets/logo-black.svg" },
  });

  for (let i = 0; i < firstNames.length; i++) {
    const first = firstNames[i];
    const last = getRandom(lastNames);
    const name = `${first} ${last}`;
    const username = `${first.toLowerCase()}${i}`;
    const email = `${username}@example.com`;
    const password = "password123";

    let authId: string;
    try {
      const firebaseUser = await getAuth().createUser({
        email,
        password,
      });
      authId = firebaseUser.uid;
    } catch (err: any) {
      if (err.code === "auth/email-already-exists") {
        const existing = await getAuth().getUserByEmail(email);
        authId = existing.uid;
      } else {
        throw err;
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { auth_id: authId },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          auth_id: authId,
          username,
          name,
          bio: `Bio for ${name}`,
          onboarded: true,
        },
      });

      await prisma.userRealtimeRoom.upsert({
        where: {
          user_id_realtime_room_id: {
            user_id: user.id,
            realtime_room_id: GLOBAL_ROOM_ID,
          },
        },
        update: {},
        create: {
          user_id: user.id,
          realtime_room_id: GLOBAL_ROOM_ID,
        },
      });

      const postCount = 3;
      for (let j = 0; j < postCount; j++) {
        const content = `${getRandom(samplePosts)} (${j + 1})`;

        await prisma.post.create({
          data: {
            content,
            author_id: user.id,
          },
        });

        await prisma.realtimePost.create({
          data: {
            content,
            author_id: user.id,
            realtime_room_id: GLOBAL_ROOM_ID,
            x_coordinate: new Prisma.Decimal(Math.random() * 100),
            y_coordinate: new Prisma.Decimal(Math.random() * 100),
            type: "TEXT",
            locked: false,
          },
        });
      }
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
