import {
  GalleryPostValidation,
  GalleryEditValidation,
} from "@/lib/validations/thread";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  onSubmit: (
    values:
      | z.infer<typeof GalleryPostValidation>
      | z.infer<typeof GalleryEditValidation>
  ) => void;
  currentImages: string[];
  currentIsPublic: boolean;
  isOwned: boolean;
}

const GalleryNodeForm = ({
  onSubmit,
  currentImages,
  currentIsPublic,
  isOwned,
}: Props) => {
  const [imageURLs, setImageURLs] = useState<string[]>(currentImages);
  const isEditing = currentImages.length > 0;
  const form = useForm({
    resolver: zodResolver(
      isEditing ? GalleryEditValidation : GalleryPostValidation
    ),
    defaultValues: { images: [] as File[], isPublic: currentIsPublic },
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
    ).then((urls) =>
      setImageURLs((prev) => [...prev, ...urls])
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid mt-8 mb-8"
      >
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem className="flex gap-4 mb-2 text-xl">
              {/* <FormLabel className="account-form_image-label text-xl">
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
              </FormLabel> */}
              <FormControl className=" flex h-max text-base-semibold text-gray-200 text-[1.25rem]">
                <Input
                  hidden
                  multiple
                  type="file"
                  accept="image/*"
                  placeholder="Upload images"
                  className="account-form_image-input w-min"
                  onChange={(e) => handleImages(e, field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isOwned && (
          <FormField
            control={form.control}
            
            name="isPublic"
            render={({ field }) => (
              <div className="w-min h-min grid">
              <FormItem className="flex justify-start  items-start gap-2 mb-4">
                <FormLabel className=" px-8 flex  text-[1.5rem] text-white ">Public?</FormLabel>
                <FormControl className="relative h-min  w-min bottom-2 right-[14%]  flex items-start justify-start">
                  <Input
                    type="checkbox"
                    
                    checked={field.value}
                    onChange={field.onChange}
                    className=" "
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
                      <Button type="submit" className="relative bottom-4 left-6 px-0 py-2 rounded-full h-min image-submit-button  ">
                      Submit
                    </Button>
                    </div>

            )}
            
          />
        )}

      </form>
    </Form>
  );
};

export default GalleryNodeForm;
