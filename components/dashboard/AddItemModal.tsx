"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Dropzone from "react-dropzone";
import { uploadItemImage } from "@/lib/uploadItemImage";
import { createItem } from "@/lib/items.client";

const Schema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  price: z.number({ invalid_type_error: "Price required" }).min(0.5, "Min $0.50"),
  stock: z.number().int().min(1),
  images: z.array(z.string()).min(1, "At least one photo"),
});

type FormData = z.infer<typeof Schema>;

export function AddItemModal({ stallId }: { stallId: string }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(Schema), defaultValues: { images: [] } });

  const onDrop = async (files: File[]) => {
    for (const file of files) {
      const url = await uploadItemImage(stallId, file);
      setValue("images", [...watch("images"), url]);
    }
  };

  const onSubmit = async (data: FormData) => {
    await createItem(stallId, data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register("name")} placeholder="Title" />
      <textarea {...register("description")} placeholder="Details (Markdown ok)" />
      <input {...register("price", { valueAsNumber: true })} type="number" step="0.01" />
      <input {...register("stock", { valueAsNumber: true })} type="number" />
      <Dropzone onDrop={onDrop}><p>Drag photos here</p></Dropzone>
      <div className="border p-2">
        <h4>{watch("name")}</h4>
        <p>{watch("description")}</p>
        <p>${watch("price")?.toFixed(2)}</p>
        <div className="flex gap-2">
          {watch("images").map(src => (
            <img key={src} src={src} className="h-16 w-16 object-cover" />
          ))}
        </div>
      </div>
      <button type="submit">Save</button>
      {Object.values(errors).map(e => (
        <p key={e?.message} className="text-red-500">{e?.message}</p>
      ))}
    </form>
  );
}
