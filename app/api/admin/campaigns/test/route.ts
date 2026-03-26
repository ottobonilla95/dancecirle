import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import config from "@/config";
import { sendEmail } from "@/libs/resend";
import { campaignEmail } from "@/libs/email-templates";

export const dynamic = "force-dynamic";

// POST: Send a test email to a specific address
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { testEmail, subject, bodyText, imageUrl, ctaLink, ctaText } =
      await req.json();

    if (!testEmail || !subject || !bodyText) {
      return NextResponse.json(
        { error: "Test email, subject, and body text are required" },
        { status: 400 }
      );
    }

    const emailData = campaignEmail(
      { subject, bodyText, imageUrl, ctaLink, ctaText },
      "",
      "en"
    );

    await sendEmail({
      to: testEmail,
      subject: `[TEST] ${emailData.subject}`,
      text: emailData.text,
      html: emailData.html,
    });

    return NextResponse.json({ success: true, sentTo: testEmail });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
