import { PortfolioNodeValidation } from "@/lib/validations/thread";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Props {
  onSubmit: (values: z.infer<typeof PortfolioNodeValidation>) => void;
  currentText: string;
  currentImages: string[];
  currentLinks: string[];
  currentLayout: "grid" | "column";
  currentColor: string;
}

const PortfolioNodeForm = ({
  onSubmit,
  currentText,
  currentImages,
  currentLinks,
  currentLayout,
  currentColor,
}: Props) => {
  const [imageURLs, setImageURLs] = useState<string[]>(currentImages);
  const [links, setLinks] = useState<string[]>(currentLinks);
  const form = useForm({
    resolver: zodResolver(PortfolioNodeValidation),
    defaultValues: {
      text: currentText,
      images: [] as File[],
      links: links,
      layout: currentLayout,
      color: currentColor,
    },
  });

  const handleImages = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: File[]) => void,
  ) => {
    e.preventDefault();
    const files = Array.from(e.target.files || []);
    fieldChange(files);
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target?.result?.toString() || "");
            reader.readAsDataURL(file);
          }),
      ),
    ).then((urls) => setImageURLs((prev) => [...prev, ...urls]));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col justify-start gap-4 mt-4 mb-4"
      >
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2 text-xl">
              <FormLabel>Text</FormLabel>
              <FormControl>
                <Input type="text" {...field} className="text-black" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2 text-xl">
              <FormLabel>Images</FormLabel>
              <FormControl>
                <Input
                  hidden
                  multiple
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImages(e, field.onChange)}
                />
              </FormControl>
              <div className="flex gap-2 flex-wrap">
                {imageURLs.map((url, idx) => (
                  <Image
                    key={idx}
                    src={url}
                    alt={`img-${idx}`}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="links"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2 text-xl">
              <FormLabel>Links (comma separated)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  value={field.value?.join(",")}
                  onChange={(e) => {
                    const vals = e.target.value.split(",").map((v) => v.trim());
                    setLinks(vals);
                    field.onChange(vals);
                  }}
                  className="text-black"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="layout"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2 text-xl">
              <FormLabel>Layout</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="column">Column</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2 text-xl">
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input type="text" {...field} className="text-black" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full mt-4">
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default PortfolioNodeForm;
