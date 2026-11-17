const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "LEGAL_PUBLISHER_NAME",
  "LEGAL_PUBLICATION_DIRECTOR",
  "LEGAL_PUBLISHER_ADDRESS",
  "LEGAL_CONTACT_EMAIL",
  "LEGAL_HOST_NAME",
  "LEGAL_HOST_ADDRESS",
  "LEGAL_PRIVACY_LEGAL_BASES",
  "LEGAL_RETENTION_POLICY",
  "LEGAL_DATA_LOCATION",
];

const missing = required.filter((key) => !process.env[key]?.trim());
const issues = [];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || process.env.VERCEL_PROJECT_PRODUCTION_URL
  || process.env.NEXT_PUBLIC_VERCEL_URL
  || process.env.VERCEL_URL;
if (!siteUrl) missing.push("NEXT_PUBLIC_SITE_URL (or Vercel system URL)");

for (const [key, value] of [["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL], ["NEXT_PUBLIC_SITE_URL", siteUrl]]) {
  if (!value) continue;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") issues.push(`${key} must use https:// for production.`);
  } catch {
    issues.push(`${key} must be a valid absolute URL.`);
  }
}

if (missing.length || issues.length) {
  console.error("Production environment is not ready.");
  if (missing.length) console.error(`Missing variables: ${missing.join(", ")}`);
  for (const issue of issues) console.error(issue);
  process.exitCode = 1;
} else {
  console.log("Production environment variables are present and URLs use HTTPS.");
}
