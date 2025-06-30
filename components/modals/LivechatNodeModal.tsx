import { LivechatInviteValidation } from "@/lib/validations/thread";
import { z } from "zod";
import LivechatNodeForm from "@/components/forms/LivechatNodeForm";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  id?: string;
  isOwned: boolean;
  onSubmit?: (values: z.infer<typeof LivechatInviteValidation>) => void;
  currentInvitee: string;
}

const renderCreate = ({ onSubmit }: { onSubmit?: (v: z.infer<typeof LivechatInviteValidation>) => void }) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Create Chat</b>
    </DialogHeader>
    <hr />
    <LivechatNodeForm onSubmit={onSubmit!} currentInvitee="" />
  </div>
);

const renderEdit = ({ onSubmit, currentInvitee }: { onSubmit?: (v: z.infer<typeof LivechatInviteValidation>) => void; currentInvitee: string }) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Edit Chat</b>
    </DialogHeader>
    <hr />
    <LivechatNodeForm onSubmit={onSubmit!} currentInvitee={currentInvitee} />
  </div>
);

const renderView = (currentInvitee: string) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-3rem]">
      <b>View Chat</b>
    </DialogHeader>
    <hr />
    <div className="py-4 grid gap-2 text-white">Invitee: {currentInvitee}</div>
    <hr />
    <div className="mt-8 mb-0">
      <DialogClose id="animateButton" className={`form-submit-button pl-2 py-0 pr-[1rem]`}>
        <div className="w-2"></div>
        <> Close </>
      </DialogClose>
    </div>
  </div>
);

function LivechatNodeModal({ id, isOwned, onSubmit, currentInvitee }: Props) {
  const isCreate = !id && isOwned;
  const isEdit = id && isOwned;
  const isView = id && !isOwned;
  return (
    <div>
      <DialogContent className="max-w-[57rem]">
        <div className="grid rounded-md px-4 py-4">
          {isCreate && renderCreate({ onSubmit })}
          {isEdit && renderEdit({ onSubmit, currentInvitee })}
          {isView && renderView(currentInvitee)}
        </div>
      </DialogContent>
    </div>
  );
}

export default LivechatNodeModal;
