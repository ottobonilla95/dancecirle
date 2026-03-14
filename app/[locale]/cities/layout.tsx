import { Metadata } from "next";
import config from "@/config";
import { getMessages, getTranslation, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (params.locale || "en") as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  const title = mt("meta.cities.title") || "Dance Cities Worldwide | Find Dancers Near You | DanceCircle";
  const description = mt("meta.cities.description") || "Explore dance cities around the world. Find Bachata, Salsa, Kizomba dancers and communities in your city. See city rankings by dancer population.";

  return {
    title,
    description,
    keywords: "dance cities, dance community, find dancers, Bachata cities, Salsa cities, Kizomba cities, dance partners near me, dance scene",
    alternates: {
      canonical: `https://${config.domainName}/${locale}/cities`,
      languages: {
        en: `https://${config.domainName}/en/cities`,
        es: `https://${config.domainName}/es/cities`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://${config.domainName}/cities`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
