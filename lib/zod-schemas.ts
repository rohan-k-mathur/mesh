import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  price: z.number().min(0.5),
  stock: z.number().int().min(1),
  images: z.array(z.string()).min(1),
});
