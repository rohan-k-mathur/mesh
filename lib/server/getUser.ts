// lib/server/getUser.ts
'use server';
import 'server-only';

import { cookies } from 'next/headers';
import { getTokens } from 'next-firebase-auth-edge';
import { toUser } from '../serverutils'; // make sure THIS file is also server-only
import { filterStandardClaims } from 'next-firebase-auth-edge/lib/auth/claims';
import { serverConfig } from '@/lib/firebase/config';
import { fetchUserByAuthId, createDefaultUser, clearUserCache } from '@/lib/actions/user.actions';

export async function getUserFromCookies() {
  clearUserCache();
  const tokens = await getTokens(cookies(), serverConfig);
  if (!tokens) return null;

  // Your existing logic:
  const user = await toUser(tokens); // ensure toUser is server-only too
  return user;
}
