import { GalleryPostValidation } from "@/lib/validations/thread";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

interface Props {
  onSubmit: (values: z.infer<typeof GalleryPostValidation>) => void;
  currentImages: string[];
}

const GalleryNodeForm = ({ onSubmit, currentImages }: Props) => {
  const [imageURLs, setImageURLs] = useState<string[]>(currentImages);
  const form = useForm({
    resolver: zodResolver(GalleryPostValidation),
    defaultValues: { images: [] as File[] },
  });

  const handleImages = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: File[]) => void
  ) => {
    e.preventDefault();
    const files = Array.from(e.target.files || []);
    fieldChange(files);
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) =>
              resolve(evt.target?.result?.toString() || "");
            reader.readAsDataURL(file);
          })
      )
    ).then((urls) => setImageURLs(urls));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col justify-start mt-8 mb-8"
      >
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-4 mb-2 text-xl">
              <FormLabel className="account-form_image-label text-xl">
                <div className="flex gap-2 flex-wrap">
                  {imageURLs.map((url, idx) => (
                    <Image
                      key={idx}
                      src={url}
                      alt={`preview-${idx}`}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  ))}
                </div>
              </FormLabel>
              <FormControl className="form-submit-button flex-1 text-base-semibol d text-gray-200 text-xl">
                <Input
                  hidden
                  multiple
                  type="file"
                  accept="image/*"
                  placeholder="Upload images"
                  className="account-form_image-input"
                  onChange={(e) => handleImages(e, field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-[100%] h-max image-submit-button mt-2">
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default GalleryNodeForm;
