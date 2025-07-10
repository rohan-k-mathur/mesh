"use client";

import CounterOutputExample from "@/components/workflow/examples/CounterOutputExample";
import GmailFlowExample from "@/components/workflow/examples/GmailFlowExample";
import RandomDataPlotExample from "@/components/workflow/examples/RandomDataPlotExample";
import { ReactFlowProvider } from "@xyflow/react";
import Modal from "@/components/modals/Modal";

export default function Page() {
  return (

<div className="relative -top-12 space-y-4">

      <div className="w-[100%] h-[100%] border-2 border-blue overscroll-none">
<ReactFlowProvider>
      <Modal />
      <GmailFlowExample />
    </ReactFlowProvider>
    </div>
    </div>
  );
}
