import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";

// Import ImageKit's server-side helper
import crypto from "crypto";

export async function GET() {
  // Authenticate the user
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

    if (!privateKey || !publicKey) {
      console.error("❌ ImageKit keys not configured!");
      return NextResponse.json(
        { error: "ImageKit keys not configured" },
        { status: 500 }
      );
    }

    // Generate authentication parameters
    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes from now
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    console.log("✅ Generated auth params:");
    console.log("  Token:", token.substring(0, 8) + "...");
    console.log("  Expire:", expire);
    console.log("  Signature:", signature.substring(0, 8) + "...");

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
    });
  } catch (error) {
    console.error("❌ Error generating ImageKit auth params:", error);
    return NextResponse.json(
      { error: "Failed to generate upload credentials" },
      { status: 500 }
    );
  }
}
