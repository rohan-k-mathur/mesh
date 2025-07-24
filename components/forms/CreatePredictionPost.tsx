import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormField, FormItem, FormControl, FormMessage } from "../ui/form";
import { PredictionPostValidation } from "@/lib/validations/thread";

interface Props {
  onSubmit: (values: z.infer<typeof PredictionPostValidation>) => void;
}

export default function CreatePredictionPost({ onSubmit }: Props) {
  const form = useForm({
    resolver: zodResolver(PredictionPostValidation),
    defaultValues: {
      question: "",
      closesAt: "",
      liquidity: 100,
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Market question" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="closesAt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="liquidity"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" min={50} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  );
}
