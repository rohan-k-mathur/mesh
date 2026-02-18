import { stripe, ORIGIN } from "./stripe";
import { prisma } from "./prismaclient";

export async function ensureStripeAccount(userId: string) {
  const seller = await prisma.seller.findUnique({ where: { id: userId } });
  if (seller?.stripeAccountId) return seller.stripeAccountId;

  const account = await stripe.accounts.create({ type: "express" });
  await prisma.seller.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });
  return account.id;
}

export async function createOnboardingLink(accountId: string) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${ORIGIN}/settings/stripe/refresh`,
    return_url: `${ORIGIN}/settings/stripe/return`,
    type: "account_onboarding",
  });
  return link.url;
}
