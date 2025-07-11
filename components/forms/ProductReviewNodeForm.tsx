import { ProductReviewValidation } from "@/lib/validations/thread";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface Props {
  onSubmit: (values: z.infer<typeof ProductReviewValidation>) => void;
  currentProductName: string;
  currentRating: number;
  currentSummary: string;
  currentProductLink: string;
  currentClaims: string[];
}

const ProductReviewNodeForm = ({
  onSubmit,
  currentProductName,
  currentRating,
  currentSummary,
  currentProductLink,
  currentClaims,
}: Props) => {
  const form = useForm({
    resolver: zodResolver(ProductReviewValidation),
    defaultValues: {
      productName: currentProductName,
      rating: currentRating,
      summary: currentSummary,
      productLink: currentProductLink,
      claims: currentClaims,
    },
  });

  return (
    <form method="post" className="ml-3 mr-3" onSubmit={form.handleSubmit(onSubmit)}>
      <hr />
      <div className="py-4 grid gap-2">
        <label className="flex flex-col text-slate-500 gap-3 text-[14px]">
          Product Name:
          <Input type="text" {...form.register("productName")} defaultValue={currentProductName} />
        </label>
        <label className="flex flex-col text-slate-500 gap-3 text-[14px]">
          Rating:
          <Input type="number" min={1} max={5} {...form.register("rating", { valueAsNumber: true })} defaultValue={currentRating} />
        </label>
        <label className="flex flex-col text-slate-500 gap-3 text-[14px]">
          Summary:
          <Input type="text" {...form.register("summary")} defaultValue={currentSummary} />
        </label>
        <label className="flex flex-col text-slate-500 gap-3 text-[14px]">
          Product Link:
          <Input type="url" {...form.register("productLink")} defaultValue={currentProductLink} />
        </label>
        <label className="flex flex-col text-slate-500 gap-3 text-[14px]">
          Claims (one per line):
          <Textarea
            {...form.register("claims")}
            value={form.watch("claims").join("\n")}
            onChange={(e) => {
              const vals = e.target.value.split("\n").map((v) => v.trim()).filter(Boolean);
              form.setValue("claims", vals);
            }}
          />
        </label>
      </div>
      <hr />
      <div className="py-4 mb-4">
        <Button type="submit" className="form-submit-button" size={"lg"}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ProductReviewNodeForm;
