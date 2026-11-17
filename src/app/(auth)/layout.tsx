import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };
import { SiteShell } from "@/components/layout/site-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
