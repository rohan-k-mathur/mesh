"use client";

import CounterOutputExample from "@/components/workflow/examples/CounterOutputExample";
import GmailFlowExample from "@/components/workflow/examples/GmailFlowExample";
import { ReactFlowProvider } from "@xyflow/react";
import Modal from "@/components/modals/Modal";

export default function Page() {
  return (
    <ReactFlowProvider>
      <Modal />
      <GmailFlowExample />
    </ReactFlowProvider>
  );
}
