import rateLimit from "next-rate-limit";

const limiter = rateLimit({ limit: 30, interval: 60 * 1000 });

export const checkNext = (req: Request, limit: number) => limiter.checkNext(req, limit);
export const check = (req: Request, key: string) => limiter.check(req, key);

export default { checkNext, check };
