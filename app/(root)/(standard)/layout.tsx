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
import ScrollAnalytics from "@/components/shared/ScrollAnalytics";
import { getRoomsForUser } from "@/lib/actions/realtimeroom.actions";
import { RealtimeRoom } from "@prisma/client";
import { PrivateChatManagerProvider } from "@/contexts/PrivateChatManager";

export const metadata = {
  title: "Mesh",
  description: "A social media website",
};

export const dynamic = "force-dynamic";
const founders = localFont({ src: './NewEdgeTest-RegularRounded.otf' })
const founderslight = localFont({ src: './NewEdgeTest-LightRounded.otf' })

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
    <html className="bg-gradient-to-r from-zinc-200 from-0% via-indigo-300 via-50% to-rose-200 to-100%">
    <body className={`${founderslight.className}`}>
      {/* <AuthProvider user={user}>
        <PrivateChatManagerProvider>
          <ScrollAnalytics />
          <main className="flex flex-row">
            <LeftSidebar userRooms={userRooms} />
            <section className="main-container ">

              <div className="w-full max-w-4xl">
                <AuthProvider user={user}>{children}</AuthProvider>
              </div>

            </section>
            <RightSidebar/>

          </main>
        </PrivateChatManagerProvider>

      </AuthProvider> */}
        {/* ONE AuthProvider and ONE ChatManager for the entire app */}
  <AuthProvider user={user}>
    <PrivateChatManagerProvider>
      <ScrollAnalytics />
      <main className="flex flex-row">
        <LeftSidebar userRooms={userRooms} />
        <section className="main-container ">
          <div className="w-full max-w-4xl">{children}</div>
        </section>
        <RightSidebar />
      </main>
    </PrivateChatManagerProvider>
  </AuthProvider>
    </body>
  </html>
  );
}
