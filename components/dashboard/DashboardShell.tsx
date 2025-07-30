"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const links = [
  { href: "items", label: "Items" },
  { href: "orders", label: "Orders" },
  { href: "payouts", label: "Payouts" },
  { href: "live", label: "Live" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex">
      <nav className="w-40 p-4 border-r">
        <ul className="space-y-2">
          {links.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={pathname.endsWith(l.href) ? "font-bold" : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
