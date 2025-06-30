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
  currentInviteeId: number;
}

const renderCreate = ({ onSubmit }: { onSubmit?: (v: z.infer<typeof LivechatInviteValidation>) => void }) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Create Chat</b>
    </DialogHeader>
    <hr />
    <LivechatNodeForm onSubmit={onSubmit!} currentInviteeId={0} />
  </div>
);

const renderEdit = ({ onSubmit, currentInviteeId }: { onSubmit?: (v: z.infer<typeof LivechatInviteValidation>) => void; currentInviteeId: number }) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Edit Chat</b>
    </DialogHeader>
    <hr />
    <LivechatNodeForm onSubmit={onSubmit!} currentInviteeId={currentInviteeId} />
  </div>
);

const renderView = (currentInviteeId: number) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-3rem]">
      <b>View Chat</b>
    </DialogHeader>
    <hr />
    <div className="py-4 grid gap-2 text-white">Invitee ID: {currentInviteeId}</div>
    <hr />
    <div className="py-4">
      <DialogClose id="animateButton" className={`form-submit-button pl-2 py-2 pr-[1rem]`}>
        <div className="w-2"></div>
        <> Close </>
      </DialogClose>
    </div>
  </div>
);

function LivechatNodeModal({ id, isOwned, onSubmit, currentInviteeId }: Props) {
  const isCreate = !id && isOwned;
  const isEdit = id && isOwned;
  const isView = id && !isOwned;
  return (
    <div>
      <DialogContent className="max-w-[57rem]">
        <DialogTitle>LivechatNodeModal</DialogTitle>
        <div className="grid rounded-md px-4 py-2">
          {isCreate && renderCreate({ onSubmit })}
          {isEdit && renderEdit({ onSubmit, currentInviteeId })}
          {isView && renderView(currentInviteeId)}
        </div>
      </DialogContent>
    </div>
  );
}

export default LivechatNodeModal;
