import React from "react";
import { Metadata } from "next";
import config from "@/config";
import { getMessages, getTranslation, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (params.locale || "en") as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  const title = mt("meta.leaderboards.title") || "Dance Leaderboards | Top Dancers, DJs & Teachers | DanceCircle";
  const description = mt("meta.leaderboards.description") || "See the most popular dancers, top DJs, teachers, and Jack & Jill champions on DanceCircle. Discover trending dancers in the global dance community.";

  return {
    title,
    description,
    keywords: "dance leaderboards, top dancers, popular DJs, dance teachers, Jack and Jill champions, dance rankings, most liked dancers",
    alternates: {
      canonical: `https://${config.domainName}/${locale}/leaderboards`,
      languages: {
        en: `https://${config.domainName}/en/leaderboards`,
        es: `https://${config.domainName}/es/leaderboards`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://${config.domainName}/leaderboards`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function LeaderboardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
