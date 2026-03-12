import { ReactNode, Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";

// Layout for dance style pages - Requires authentication
export default async function DanceStyleLayout({
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
