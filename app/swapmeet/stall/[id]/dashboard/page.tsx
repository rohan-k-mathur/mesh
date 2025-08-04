import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ItemsPanel } from "@/components/dashboard/ItemsPanel";
import { OrdersPanel } from "@/components/dashboard/OrdersPanel";
import { PayoutsPanel } from "@/components/dashboard/PayoutsPanel";
import { LivePanel } from "@/app/swapmeet/components/dashboard/LivePanel";

interface PageProps {
    params: { id: string };          // <- Next.js injects this for route segments
  }
  

  export default function StallDashboard({ params }: PageProps) {
    const { id } = params;           // <- No client hook needed
    return (
    <DashboardShell>
      <ItemsPanel stallId={id} />
      <OrdersPanel stallId={id} />
      <PayoutsPanel stallId={id} />
      <LivePanel stallId={id} />
    </DashboardShell>
  );
}
