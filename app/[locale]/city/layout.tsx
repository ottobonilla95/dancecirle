import { ReactNode, Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import Header from "@/components/Header";

// Layout for city pages
// Shows Header only for authenticated users
export default async function CityLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  return (
    <>
      {/* Show Header only for authenticated users */}
      {isLoggedIn && (
        <Suspense>
          <Header />
        </Suspense>
      )}
      {children}
    </>
  );
} 