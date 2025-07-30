import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ItemsPanel } from "@/components/dashboard/ItemsPanel";
import { OrdersPanel } from "@/components/dashboard/OrdersPanel";
import { PayoutsPanel } from "@/components/dashboard/PayoutsPanel";
import { LivePanel } from "@/components/dashboard/LivePanel";

export default function StallDashboard() {
  const { id } = useParams<{ id: string }>();
  return (
    <DashboardShell>
      <ItemsPanel stallId={id} />
      <OrdersPanel stallId={id} />
      <PayoutsPanel stallId={id} />
      <LivePanel stallId={id} />
    </DashboardShell>
  );
}
