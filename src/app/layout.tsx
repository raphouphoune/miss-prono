import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { getPublicSiteUrl } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const body = DM_Sans({
  variable: "--font-body-family",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Miss Prono — L'élection se joue aussi ici",
  description: "Le jeu de pronostics autour de Miss France. Composez votre Top 12, défiez vos amis et comparez vos résultats.",
  applicationName: "Miss Prono",
  metadataBase: getPublicSiteUrl() ?? undefined,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Miss Prono",
    title: "Miss Prono — L'élection se joue aussi ici",
    description: "Composez votre Top 12, défiez vos amis et suivez les résultats de Miss France.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
