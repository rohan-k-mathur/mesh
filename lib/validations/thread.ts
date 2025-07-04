import * as z from "zod";

const MAX_FILE_SIZE = 500000000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const ThreadValidation = z.object({
  thread: z.string().min(3, { message: "Minimum of 3 characters" }),
  accountId: z.bigint(),
});

export const RoomValidation = z.object({
  roomName: z.string().min(3, { message: "Minimum of 3 characters" }),
  userId: z.bigint(),
  roomIcon: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

export const TextPostValidation = z.object({
  postContent: z.string().min(3, { message: "Minimum of 3 characters" }),
});

export const YoutubePostValidation = z.object({
  videoURL: z.string(),
});

export const ImagePostValidation = z.object({
  image: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

export const GalleryPostValidation = z.object({
  images: z
    .array(
      z
        .any()
        .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
        .refine(
          (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
          "Only .jpg, .jpeg, .png and .webp formats are supported."
        )
    )
    .min(1),
  isPublic: z.boolean().optional(),
});

export const GalleryEditValidation = z.object({
  images: z
    .array(
      z
        .any()
        .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
        .refine(
          (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
          "Only .jpg, .jpeg, .png and .webp formats are supported."
        )
    )
    .optional(),
  isPublic: z.boolean().optional(),
});
export const CommentValidation = z.object({
  thread: z.string().min(3, { message: "Minimum of 3 characters" }),
});

export const PortalNodeValidation = z.object({
  x: z.number(),
  y: z.number(),
});

export const LivechatInviteValidation = z.object({
  invitee: z.string().min(1),
});

export const PortfolioNodeValidation = z.object({
  text: z.string().min(1),
  images: z.array(z.any().refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`).refine((file) => ACCEPTED_IMAGE_TYPES.includes(file?.type), "Only .jpg, .jpeg, .png and .webp formats are supported.")).optional(),
  links: z.array(z.string().url()).optional(),
  layout: z.enum(["grid", "column"]).default("grid"),
  color: z.string().default("bg-white"),
});

export const PdfViewerPostValidation = z.object({
  pdfUrl: z.string().url(),
});

