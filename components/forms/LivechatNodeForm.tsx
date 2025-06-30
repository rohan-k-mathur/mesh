import { LivechatInviteValidation } from "@/lib/validations/thread";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface Props {
  onSubmit: (values: z.infer<typeof LivechatInviteValidation>) => void;
  currentInviteeId: number;
}

function LivechatNodeForm({ onSubmit, currentInviteeId }: Props) {
  const form = useForm({
    resolver: zodResolver(LivechatInviteValidation),
    defaultValues: { inviteeId: currentInviteeId },
  });

  return (
    <form method="post" className="ml-3 mr-3" onSubmit={form.handleSubmit(onSubmit)}>
      <hr />
      <div className="py-4 grid gap-2">
        <label className="flex flex-col text-slate-500 gap-3 text-xl">
          Invitee User ID:
          <Input type="number" {...form.register("inviteeId", { valueAsNumber: true })} />
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
}

export default LivechatNodeForm;
