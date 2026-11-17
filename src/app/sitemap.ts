import type { MetadataRoute } from "next";
import { getCandidates2027 } from "@/features/candidates/repository";
import { getPublicSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) return [];

  const publicPaths = ["/", "/candidates", "/resultats", "/classement", "/mentions-legales", "/confidentialite", "/conditions-utilisation"];
  const candidates = await getCandidates2027();
  return [
    ...publicPaths.map((path) => ({ url: new URL(path, siteUrl).toString() })),
    ...candidates.map((candidate) => ({ url: new URL(`/candidates/${candidate.slug}`, siteUrl).toString() })),
  ];
}
