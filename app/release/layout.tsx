import { ReactNode, Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import Header from "@/components/Header";

export default async function ReleaseLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Get session but don't require it - release pages are public
  const session = await getServerSession(authOptions);

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      {children}
    </>
  );
}

