// lib/server/getUser.ts (server‑only, can import next/headers)
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { toUser } from "../serverutils";
import { filterStandardClaims } from "next-firebase-auth-edge/lib/auth/claims";
import { serverConfig } from "@/lib/firebase/config";
import {
  fetchUserByAuthId,
  createDefaultUser,
  clearUserCache,
} from "@/lib/actions/user.actions";

export async function getUserFromCookies() {
  clearUserCache();
  const tokens = await getTokens(cookies(), serverConfig);
  if (!tokens) return null;
  /* …toUser logic unchanged… */
  const user = tokens ? await toUser(tokens) : null;
  return user;
}


