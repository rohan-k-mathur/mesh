"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { User } from "./AuthContext";
import { Tokens } from "next-firebase-auth-edge";
import { filterStandardClaims } from "next-firebase-auth-edge/lib/auth/claims";
import { fetchUserByAuthId } from "./actions/user.actions";
import { serverConfig } from "./firebase/config";

export async function toUser({ decodedToken }: Tokens): Promise<User> {
  const {
    uid,
    email,
    picture: photoURL,
    email_verified: emailVerified,
    phone_number: phoneNumber,
    name: displayName,
    source_sign_in_provider: signInProvider,
  } = decodedToken;

  const customClaims = filterStandardClaims(decodedToken);
  const user = await fetchUserByAuthId(uid);
  const userId = user?.id ?? null;
  const onboarded = user?.onboarded ?? false;

  return {
    uid,
    email: email ?? null,
    displayName: displayName ?? null,
    photoURL: photoURL ?? user?.image ?? null,
    phoneNumber: phoneNumber ?? null,
    emailVerified: emailVerified ?? false,
    providerId: signInProvider,
    customClaims,
    userId,
    onboarded,
    bio: user?.bio ?? null,
    username: user?.username ?? null,
  };
}

export async function getUserFromCookies(): Promise<User | null> {
  const tokens = await getTokens(cookies(), serverConfig);
  const user = tokens ? await toUser(tokens) : null;
  return user;
}
