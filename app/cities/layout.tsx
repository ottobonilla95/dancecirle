import { Metadata } from "next";
import { ReactNode, Suspense } from "react";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Dance Cities Worldwide | Find Dancers by City | DanceCircle",
  description:
    "Explore dance cities around the world. Find Bachata, Salsa, Kizomba communities, dancers, teachers, and events in your city.",
  keywords:
    "dance cities, Bachata cities, Salsa cities, Kizomba cities, dance communities, dancers near me",
  alternates: {
    canonical: "/cities",
  },
  openGraph: {
    title: "Dance Cities Worldwide | DanceCircle",
    description:
      "Explore dance cities around the world. Find dancers, teachers, and events in your city.",
    url: "https://dancecircle.co/cities",
  },
};

// Layout for cities pages
export default async function CitiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      {children}
    </>
  );
}
