import { MusicPostValidation } from "@/lib/validations/thread";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
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
  onSubmit: (values: { audioUrl: string; title: string }) => void;
}

const MusicNodeForm = ({ onSubmit }: Props) => {
  const form = useForm({
    resolver: zodResolver(MusicPostValidation),
    defaultValues: {
      youtubeUrl: "",
      title: "",
    },
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: z.infer<typeof MusicPostValidation>) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/youtube-audio?url=${encodeURIComponent(values.youtubeUrl)}`
      );
      if (res.ok) {
        const data = await res.json();
        onSubmit({
          audioUrl: data.audioUrl,
          title: values.title || data.title,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid gap-2 mt-2 mb-2"
      >
        <FormField
          control={form.control}
          name="youtubeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube URL</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Enter a YouTube URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Track title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full h-max image-submit-button mt-2"
          disabled={loading}
        >
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default MusicNodeForm;
