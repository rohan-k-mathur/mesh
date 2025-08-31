
import { z } from 'zod';


export type ArgSchemeWithCQs = {
  key: string;
  title: string;
  cq: ArgCQ[];
};


export const ArgCQSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const ArgCQArraySchema = z.array(ArgCQSchema);

// Handy TS type
export type ArgCQ = z.infer<typeof ArgCQSchema>;
