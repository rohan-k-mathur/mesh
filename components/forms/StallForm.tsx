"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ImageDropzone from "../ImageDropzone";
import { compressImage, generateBlurhash } from "@/lib/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StallFormSchema, type StallFormValues } from "@/lib/validations/stall";
import { useState } from "react";

import useSWR from "swr";
export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  });

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: StallFormValues) => Promise<void> | void;
  defaultValues?: Partial<StallFormValues>;
  loading?: boolean;
}

export default function StallForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading,
}: Props) {
  const form = useForm<StallFormValues>({
    resolver: zodResolver(StallFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      sectionId: defaultValues?.sectionId ?? 0,
      image: undefined,
    },
    mode: "onChange",
  });
  const [step, setStep] = useState(0);

  const handleSubmit = async (values: StallFormValues) => {
    if (!(values.image instanceof File)) {
      delete (values as any).image;
    }
    await onSubmit(values);
    onOpenChange(false);
  };
  const { data: sections } = useSWR("/swapmeet/api/section", fetcher);
  const isReady = !!sections?.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="dialog" aria-labelledby="new-stall" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit Stall" : "New Stall"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {step === 0 && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} className="text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="text-black border px-2 py-1"
                          value={field.value ?? sections?.[0]?.id ?? ""}
                        >
                          {sections?.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              ({s.x}, {s.y})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={!form.formState.isValid || !isReady}
                >
                  Next
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail</FormLabel>
                      <FormControl>
                        <ImageDropzone onFile={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between">
                  <Button type="button" onClick={() => setStep(0)} disabled={!isReady}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(2)}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Button type="button" onClick={() => setStep(1)} disabled={!isReady}>
                  Back
                </Button>
                <Button type="submit" className="ml-2" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
