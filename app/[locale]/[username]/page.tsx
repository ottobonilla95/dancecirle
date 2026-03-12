import { redirect } from "next/navigation";
import connectDB from "@/libs/mongoose";
import User from "@/models/User";

interface PageProps {
  params: {
    locale: string;
    username: string;
  };
}

export default async function UsernamePage({ params }: PageProps) {
  const { locale, username } = params;

  try {
    await connectDB();

    // Find user by username (exact match)
    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select("_id");
    
    if (user) {
      // Redirect to the full dancer profile
      redirect(`/${locale}/dancer/${user._id}`);
    } else {
      // Username not found, redirect to home with a message
      redirect(`/${locale}/?error=user-not-found`);
    }
  } catch (error: any) {
    // Check if it's a Next.js redirect (which is expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw to allow Next.js to handle the redirect
    }

    console.error("Error finding user:", error);
    redirect(`/${locale}/?error=server-error`);
  }
}
