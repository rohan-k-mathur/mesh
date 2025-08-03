import { prisma } from "@/lib/prismaclient";
import { userSettingsSchema } from "./schema";

export async function getUserSettings(userId: bigint) {
  const row = await prisma.userSettings.findUnique({ where: { user_id: userId } });
  return row?.prefs ?? {};
}

export async function updateUserSettings(userId: bigint, patch: unknown) {
  const data = userSettingsSchema.partial().parse(patch);
  await prisma.userSettings.upsert({
    where: { user_id: userId },
    create: { user_id: userId, prefs: data },
    update: { prefs: { ...(await getUserSettings(userId)), ...data } },
  });
  return data;
}

export async function getWorkspaceSettings(workspaceId: bigint) {
  const row = await prisma.workspaceSettings.findUnique({ where: { workspace_id: workspaceId } });
  return row?.prefs ?? {};
}

export async function updateWorkspaceSettings(workspaceId: bigint, patch: unknown) {
  const data = userSettingsSchema.partial().parse(patch);
  await prisma.workspaceSettings.upsert({
    where: { workspace_id: workspaceId },
    create: { workspace_id: workspaceId, prefs: data },
    update: { prefs: { ...(await getWorkspaceSettings(workspaceId)), ...data } },
  });
  return data;
}
