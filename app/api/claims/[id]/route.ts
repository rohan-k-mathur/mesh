// app/api/claims/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const claimId = decodeURIComponent(params.id || '');
  if (!claimId) {
    return NextResponse.json({ error: 'Missing claim id' }, { status: 400 });
  }



// model Claim {
//   id          String             @id @default(cuid())
//   text        String
//   createdById String
//   moid        String             @unique
//   createdAt   DateTime           @default(now())
//   cards       DeliberationCard[]
//   warrant     ClaimWarrant? // 👈 back-relation

//   deliberationId String?
//   deliberation   Deliberation? @relation(fields: [deliberationId], references: [id], onDelete: Cascade)

//   arguments Argument[] @relation("ArgumentClaim")

//   edgesFrom ClaimEdge[]     @relation("fromClaim")
//   edgesTo   ClaimEdge[]     @relation("toClaim")
//   citations ClaimCitation[]

//   urns        Urn[]        @relation("ClaimUrns")
//   ClaimLabel  ClaimLabel?
//   claimValues ClaimValue[] // <— opposite side for ClaimValue.claim

//   ClaimEvidence ClaimEvidence[]

//   sourceProposition Proposition? @relation("PropositionClaim")

//   // NEW
//   canonicalClaimId String?
//   canonical        CanonicalClaim? @relation(fields: [canonicalClaimId], references: [id], onDelete: SetNull)

//   // NEW (optional negation link for DS pl later)
//   negatesClaimId String?
//   negates        Claim?  @relation("NegationClaims", fields: [negatesClaimId], references: [id], onDelete: SetNull)
//   negatedBy      Claim[] @relation("NegationClaims")

//   debateNodes  DebateNode[] @relation(name: "ClaimDebateNodes")
//   canonicalKey String?      @unique

//   asPremiseOf  ArgumentPremise[]
//   asConclusion Argument[]        @relation("Conclusion")

//   @@index([deliberationId, id], name: "claim_delib_id") // NEW
//   @@index([deliberationId, createdAt]) // claims by delib, time-sorted
//   @@index([canonicalClaimId])
//   @@index([negatesClaimId])
//   @@index([deliberationId])
//   @@index([deliberationId, createdById, createdAt])
// }

  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      text: true,
      createdAt: true,
      createdById: true,
      deliberationId: true,
      _count: {
        select: {
          arguments: true,
        },
      },
    },
  });

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  // Find the top argument (if any) for diagram viewing
  const topArg = await prisma.argument.findFirst({
    where: { claimId },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    {
      ...claim,
      topArgumentId: topArg?.id || null,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}