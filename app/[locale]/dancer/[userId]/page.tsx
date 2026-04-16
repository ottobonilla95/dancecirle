import { notFound, permanentRedirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

interface Props {
  params: {
    locale: string;
    userId: string;
  };
}

export const revalidate = 3600;

// Legacy route — redirects /{locale}/dancer/{userId} → /{locale}/{username}
// for backward compatibility with QR codes, push notifications, and old links.
export default async function LegacyDancerRedirect({ params }: Props) {
  if (!isValidObjectId(params.userId)) {
    notFound();
  }

  await connectMongo();

  const user = await User.findById(params.userId).select("username").lean() as any;

  if (!user?.username) {
    notFound();
  }

  permanentRedirect(`/${params.locale}/${user.username}`);
}
