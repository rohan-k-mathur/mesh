import { Inter } from "next/font/google";
import "../globals.css";
import "./auth-bg.css";
import "./meta-bg.css";
import MetaBg from "./MetaBg";   // ← path relative to this file
export const metadata = {
  title: "Isonomia",
  description: "Deliberation platform for epistemic infrastructure and democratic decision-making",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} `}>
      {/* <MetaBg /> */}
{children}</body>
    </html>
  );
}
