import { ReactNode, Suspense } from "react";
import Header from "@/components/Header";

export default function ContinentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      {children}
    </>
  );
}

