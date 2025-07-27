import * as z from "zod";

export const StallFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  sectionId: z.number().int(),
  image: z.any().optional(),
});

export type StallFormValues = z.infer<typeof StallFormSchema>;
