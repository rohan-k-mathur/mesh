import type { NextApiRequest } from 'next';
import { getTokens } from 'next-firebase-auth-edge';
// import { authConfig } from './authConfig';

export async function getUserFromReq(req: NextApiRequest) {
  // next-firebase-auth-edge accepts cookie containers differently depending on version.
  // If your version needs the raw cookie header, pass req.headers.cookie
  // Otherwise pass req.cookies (object). Use whichever your current version requires.
  const tokens = await getTokens(
    // Option A:
    req.headers.cookie ?? ''
    // Option B (if supported by your version):
    // req.cookies
    /*, authConfig */
  );

  if (!tokens) return null;

  const { decodedToken } = tokens;
  return {
    userId: decodedToken.uid,
    email: decodedToken.email ?? null,
  };
}
