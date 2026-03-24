import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/settings/",
          "/onboarding/",
          "/friends/",
          "/feed/",
        ],
      },
    ],
    sitemap: "https://www.dancecircle.co/sitemap.xml",
  };
}
