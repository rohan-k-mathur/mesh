import { Inter } from "next/font/google";
import { Chakra_Petch } from "next/font/google";
import { Comfortaa } from "next/font/google";
import { Nunito } from 'next/font/google'
import localFont from 'next/font/local'


import "../../globals.css";
import Topbar from "@/components/shared/Topbar";
import LeftSidebar from "@/components/shared/LeftSidebar";
import RightSidebar from "@/components/shared/RightSidebar";
import Bottombar from "@/components/shared/Bottombar";
import { getUserFromCookies } from "@/lib/serverutils";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { getRoomsForUser } from "@/lib/actions/realtimeroom.actions";
import { RealtimeRoom } from "@prisma/client";

export const metadata = {
  title: "Mesh",
  description: "A social media website",
};
const founders = localFont({ src: '/NewEdgeTest-RegularRounded.otf' })
const founderslight = localFont({ src: '/NewEdgeTest-LightRounded.otf' })

const inter = Inter({ subsets: ["latin"] });
const nunito = Nunito({ subsets: ['latin'] })

const chakra = Chakra_Petch({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});
const comfortaa = Comfortaa({
  weight: ["400"],
  subsets: ["latin"],
});

export default async function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();
  let userRooms = [] as RealtimeRoom[];
  if (user && user.userId) {
    userRooms = await getRoomsForUser({ userId: user!.userId! });
  } else {
    userRooms = [];
  }
  return (
    <html>
      <body className={`${founderslight.className} `}>
        <AuthProvider user={user}>
          <main className="flex flex-row bg-gradient-to-r from-zinc-200 via-indigo-300 to-rose-200">
            <LeftSidebar userRooms={userRooms} />
            <section className="main-container ">
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
