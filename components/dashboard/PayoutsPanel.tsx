"use client";
export function PayoutsPanel({ stallId }: { stallId: string }) {
  const handleOnboard = async () => {
    const r = await fetch("/api/stripe/onboard", { method: "POST" });
    const { url } = await r.json();
    window.location.href = url;
  };
  return (
    <div>
      Payouts for {stallId}
      <button onClick={handleOnboard}>Onboard with Stripe</button>
    </div>
  );
}
