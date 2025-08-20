// server/jobs/decentralise.worker.ts
import { Worker, QueueEvents, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { provisionShard } from '@/server/provisioner/orchestrate';
import { copyRoomDb, copyRoomMedia } from '@/server/jobs/copy';

export type DecentraliseJobData = {
  roomId: string;
  kind: 'CONVERSATION' | 'REALTIME';
  conversationId?: string; // bigint as string
  realtimeRoomId?: string;
  region: string;
  sourceBucket: string;
};

const prisma = new PrismaClient();
export const decentraliseEvents = new QueueEvents('decentralise', { connection: { url: process.env.REDIS_URL! } });

export const decentraliseWorker = new Worker<DecentraliseJobData>('decentralise', async (job: Job<DecentraliseJobData>) => {
  const { roomId, kind, conversationId, realtimeRoomId, region, sourceBucket } = job.data;
  const baseDbUrl = process.env.DATABASE_URL!;
  const serviceRoleArn = process.env.SERVICE_KMS_ROLE_ARN!;

  const prov = await provisionShard(prisma, roomId, region, baseDbUrl, serviceRoleArn);

  await copyRoomDb({
    prisma,
    targetSchema: prov.schema,
    roomId,
    region,
    sourceBucket,
    targetBucket: prov.bucket,
    kmsKeyArn: prov.kmsKeyArn,
    conversationId: kind === 'CONVERSATION' && conversationId ? BigInt(conversationId) : undefined,
    realtimeRoomId: kind === 'REALTIME' ? realtimeRoomId : undefined
  });

  await copyRoomMedia({
    prisma,
    targetSchema: prov.schema,
    roomId,
    region,
    sourceBucket,
    targetBucket: prov.bucket,
    kmsKeyArn: prov.kmsKeyArn,
    conversationId: kind === 'CONVERSATION' && conversationId ? BigInt(conversationId) : undefined,
    realtimeRoomId: kind === 'REALTIME' ? realtimeRoomId : undefined
  });

  return { ok: true, ...prov };
}, { connection: { url: process.env.REDIS_URL! } });
