"use client";

import { Button } from "@/components/ui/button";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import ConnectAccountModal from "@/components/modals/ConnectAccountModal";
import IntegrationConfigModal from "@/components/modals/IntegrationConfigModal";

export default function IntegrationButtons() {
  const { openModal } = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );

  return (
    <div className="mb-3 flex">
      <Button
        className="p-4 mr-2"
        onClick={() => openModal(<ConnectAccountModal />)}
      >
        Connect Accounts
      </Button>
      <Button
        className="p-4"
        onClick={() => openModal(<IntegrationConfigModal />)}
      >
        Configure Integrations
      </Button>
    </div>
  );
}
