import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentAuthor } from "@cp/lib/auth";

export const metadata: Metadata = {
  title: "Commonplace",
  description: "Infrastructure for personal memory",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getCurrentAuthor().catch(() => null);

  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <main className="mx-auto max-w-2xl px-3 py-10">
          {ctx && (
            <nav className="mb-10 flex items-center justify-between font-sans text-sm text-stone-600">
              <div className="flex gap-4">
                <Link href="/write" className="hover:text-stone-900">
                  Write
                </Link>
                <Link href="/read" className="hover:text-stone-900">
                  Read
                </Link>
                <Link href="/sources" className="hover:text-stone-900">
                  Sources
                </Link>
                <Link href="/graph" className="hover:text-stone-900">
                  Graph
                </Link>
                <Link href="/search" className="hover:text-stone-900">
                  Search
                </Link>
                <Link href="/archive" className="hover:text-stone-900">
                  Archive
                </Link>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-stone-500 hover:text-stone-900"
                >
                  Sign out
                </button>
              </form>
            </nav>
          )}
          {children}
        </main>
      </body>
    </html>
  );
}
