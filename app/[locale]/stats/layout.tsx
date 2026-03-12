import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import Header from "@/components/Header";

export default async function StatsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${params.locale}/`);
  }

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div className="min-h-screen bg-base-100">
        {children}
      </div>
    </>
  );
} 