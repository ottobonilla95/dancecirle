import React from "react";
import { Metadata } from "next";
import config from "@/config";
import { getMessages, getTranslation, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (params.locale || "en") as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  const title = mt("meta.countries.title") || "Dance Countries | Explore Dance Communities Worldwide | DanceCircle";
  const description = mt("meta.countries.description") || "Discover dance communities by country. Find Bachata, Salsa, Kizomba dancers and events across the globe. See which countries have the most active dance scenes.";

  return {
    title,
    description,
    keywords: "dance countries, dance community worldwide, Bachata countries, Salsa countries, Kizomba countries, international dance, dance travel",
    alternates: {
      canonical: `https://${config.domainName}/${locale}/countries`,
      languages: {
        en: `https://${config.domainName}/en/countries`,
        es: `https://${config.domainName}/es/countries`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://${config.domainName}/countries`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function CountriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
