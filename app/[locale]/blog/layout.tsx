import { ReactNode, Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import Header from "@/components/Header";
import PublicNavbar from "@/components/PublicNavbar";

// Layout for blog pages
// Shows full Header for authenticated users, public navbar for visitors
export default async function BlogLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  return (
    <>
      {isLoggedIn ? (
        <Suspense>
          <Header />
        </Suspense>
      ) : (
        <PublicNavbar />
      )}
      {children}
    </>
  );
}
