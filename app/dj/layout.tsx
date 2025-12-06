import { ReactNode, Suspense } from "react";
import Header from "@/components/Header";

export default async function DJLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="min-h-screen">{children}</main>
    </>
  );
}

