import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Countries | DanceCircle - Find Dance Communities Worldwide",
  description:
    "Browse dance communities in countries around the world. Connect with Bachata, Salsa, Kizomba dancers, find teachers, and explore popular dance styles globally.",
  keywords:
    "dance countries, dance communities worldwide, Bachata worldwide, Salsa worldwide, Kizomba worldwide, international dance",
  alternates: {
    canonical: "/countries",
  },
  openGraph: {
    title: "Countries | DanceCircle - Dance Communities Worldwide",
    description:
      "Browse dance communities in countries around the world. Connect with dancers globally.",
    url: "https://dancecircle.co/countries",
  },
};

export default function CountriesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div>{children}</div>;
}
