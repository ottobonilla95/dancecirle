import { ReactNode, Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import config from "@/config";
import Header from "@/components/Header";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(config.auth.loginUrl);
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

