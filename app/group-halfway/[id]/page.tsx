import { prisma } from "@/lib/prismaclient";
import { verifyGroupToken } from "@/lib/jwtHelpers";
import { notFound } from "next/navigation";
import OriginWizard from "./wizard";

type Props = { params: { id: string }; searchParams: { token?: string } };

export default async function Page({ params, searchParams }: Props) {
  const token = searchParams.token;
  const payload = token ? verifyGroupToken(token) : null;
  if (!payload || payload.id !== params.id) notFound();

  const meeting = await prisma.groupMeeting.findUnique({ where: { id: params.id } });
  if (!meeting) notFound();

  const origins = (meeting.origins as any) || {};
  const allSet = meeting.participantUids.every((uid) => origins[uid]);

  return (
    <div className="p-4">
      {allSet ? (
        <p>All participants have set their origins.</p>
      ) : (
        <OriginWizard
          meetingId={meeting.id}
          token={token!}
          currentUid={payload.uid}
          participantUids={meeting.participantUids}
          initialOrigins={origins}
        />
      )}
    </div>
  );
}
