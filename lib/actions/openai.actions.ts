"use server";

import { openai } from "../openaiclient";

export async function generateImage({
  prompt,
  imageSize,
}: {
  prompt: string;
  imageSize:
    | "256x256"
    | "512x512"
    | "1024x1024"
    | "1792x1024"
    | "1024x1792"
    | null;
}) {
  try {
    console.log("Generating image for the following prompt: " + prompt);
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1, // Number of images to generate
      size: imageSize, // Image size from body (e.g., "1024x1024")
    });

    const imageUrl = response.data[0].url; // URL of the generated image
    if (!imageUrl) {
      throw new Error("No image URL found");
    }
    return imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
  }
}
