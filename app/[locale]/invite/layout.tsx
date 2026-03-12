import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import Header from "@/components/Header";

export default async function InviteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      {children}
    </>
  );
}

