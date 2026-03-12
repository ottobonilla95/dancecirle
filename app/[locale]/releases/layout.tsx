import { ReactNode, Suspense } from "react";
import Header from "@/components/Header";

export default async function ReleasesLayout({
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

