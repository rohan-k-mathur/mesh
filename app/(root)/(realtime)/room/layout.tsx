import { AuthProvider } from "@/components/shared/AuthProvider";
import Bottombar from "@/components/shared/Bottombar";
import { getUserFromCookies } from "@/lib/serverutils";
import "@xyflow/react/dist/style.css";
import { Chakra_Petch, Comfortaa, Inter } from "next/font/google";
import React from "react";
import "../../../globals.css";

export const metadata = {
  title: "Mesh",
  description: "A social media website",
};

const chakra = Chakra_Petch({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});
export default async function RealtimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();
  return (
    <html>
      <body className={`${chakra.className} bg-[#000000]`}>
        <AuthProvider user={user}>
          <main>
            <section className="bg-dark-1 px-6">{children}</section>
          </main>
          <Bottombar />
        </AuthProvider>
      </body>
    </html>
  );
}
