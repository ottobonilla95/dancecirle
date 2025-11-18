import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import config from "@/config";
import User from "@/models/User";
import { getWeeklyDigestData } from "@/utils/weekly-digest";
import { sendEmail } from "@/libs/resend";
import { generateWeeklyDigestHTML, generateWeeklyDigestText } from "@/utils/email-templates/weekly-digest";

/**
 * Admin endpoint to test weekly digest email
 * Sends the digest ONLY to the admin email for testing purposes
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    // Get admin user
    const adminUser = await User.findOne({ email: config.admin.email }).lean() as any;
    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    console.log(`📧 Testing weekly digest for admin: ${config.admin.email}`);

    // Get digest data for admin
    const digestData = await getWeeklyDigestData(adminUser._id.toString());

    // Generate email templates
    const html = generateWeeklyDigestHTML(digestData);
    const text = generateWeeklyDigestText(digestData);

    // Send test email with unsubscribe headers
    try {
      await sendEmail({
        to: config.admin.email,
        subject: "🧪 TEST - Your Weekly DanceCircle Digest",
        html,
        text,
        replyTo: config.resend.supportEmail,
        headers: {
          'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${adminUser._id.toString()}&type=weeklyDigest>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      console.log(`✅ Test digest sent successfully to ${config.admin.email}`);

      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        recipient: config.admin.email,
        digestData,
      });
    } catch (emailError) {
      console.error(`❌ Failed to send test email:`, emailError);
      return NextResponse.json(
        {
          error: "Failed to send test email",
          details: emailError instanceof Error ? emailError.message : String(emailError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test weekly digest error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

