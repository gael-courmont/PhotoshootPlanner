// Public origin for canonical URLs, `hreflang` and the sitemap; set it to the deployed URL.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
