import { ImagePostValidation } from "@/lib/validations/thread";
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
  onSubmit: (values: z.infer<typeof ImagePostValidation>) => void;
  currentImageURL: string;
}

const ImageNodeForm = ({ onSubmit, currentImageURL }: Props) => {
  const [imageURL, setImageURL] = useState(currentImageURL);
  const form = useForm({
    resolver: zodResolver(ImagePostValidation),
    defaultValues: {
      image: new File([""], "filename"),
    },
  });

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: File) => void
  ) => {
    e.preventDefault();
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFile = e.target.files[0];
      if (!uploadedFile.type.includes("image")) return;
      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        setImageURL(imageDataUrl);
        fieldChange(uploadedFile);
      };
      fileReader.readAsDataURL(uploadedFile);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col justify-start mt-8 mb-8"
      >
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem className="flex items-center gap-4 mb-2 text-xl">
              <FormLabel className="account-form_image-label text-xl">
                <Image
                  src={imageURL}
                  alt="uploaded image post"
                  width={96}
                  height={96}
                  priority
                />
              </FormLabel>
              <FormControl className="form-submit-button flex-1 text-base-semibold text-gray-200 text-xl">
                <Input
                  hidden
                  type="file"
                  accept="image/*"
                  placeholder="Upload an image"
                  className="account-form_image-input"
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-[100%] h-max image-submit-button mt-2"
        >
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default ImageNodeForm;
