import { Chakra_Petch } from "next/font/google";
import "../../../globals.css";
import Topbar from "@/components/shared/Topbar";
import LeftSidebar from "@/components/shared/LeftSidebar";
import RightSidebar from "@/components/shared/RightSidebar";
import Bottombar from "@/components/shared/Bottombar";
import { getUserFromCookies } from "@/lib/serverutils";
import { AuthProvider } from "@/components/shared/AuthProvider";

export const metadata = {
  title: "Mesh",
  description: "A social media website",
};

const chakra = Chakra_Petch({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export default async function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();
  return (
    <html>
      <body className={`${chakra.className} bg-[#311e3e]`}>
        <AuthProvider user={user}>
          <main className="flex flex-row ">
            <section className="main-container">
              <div className="w-full max-w-4xl">
                <AuthProvider user={user}>{children}</AuthProvider>
              </div>
            </section>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
