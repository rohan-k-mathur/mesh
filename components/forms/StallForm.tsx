"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StallFormSchema, type StallFormValues } from "@/lib/validations/stall";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: StallFormValues) => Promise<void> | void;
  defaultValues?: Partial<StallFormValues>;
}

export default function StallForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<StallFormValues>({
    resolver: zodResolver(StallFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      sectionId: defaultValues?.sectionId ?? 0,
    },
  });

  const handleSubmit = async (values: StallFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Stall" : "New Stall"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    <Input type="number" {...field} className="text-black" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-2">Save</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
