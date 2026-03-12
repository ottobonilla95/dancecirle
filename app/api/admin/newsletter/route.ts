import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, message, testMode } = await req.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    await connectMongo();

    // Get all users with email and notifications enabled
    const users = await User.find({
      email: { $exists: true, $ne: null },
      "notificationSettings.emailNotifications": { $ne: false },
    }).select("email name _id");

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No users found with email notifications enabled",
      });
    }

    // In test mode, only send to admin
    const recipients = testMode
      ? [{ email: session.user.email, name: session.user.name, _id: session.user.id }]
      : users.map((u) => ({ email: u.email, name: u.name, _id: u._id.toString() }));

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">
            ${subject}
          </h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <div style="color: #333; line-height: 1.8; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="https://${config.domainName}/en" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Visit ${config.appName} →
            </a>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
            <p>You received this email because you have an account at ${config.appName}</p>
            <p style="margin-top: 10px; font-size: 11px;">
              <a href="https://${config.domainName}/api/unsubscribe?userId={{USER_ID}}&type=all" style="color: #999; text-decoration: underline;">Unsubscribe from all</a> | 
              <a href="https://${config.domainName}/en/settings" style="color: #667eea; text-decoration: none;">Manage preferences</a>
            </p>
          </div>
        </div>
      </div>
    `;

    // Send emails (in batches to avoid rate limits)
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((recipient) => {
          // Replace {{USER_ID}} placeholder with actual user ID
          const personalizedHtml = emailHtml.replace(/\{\{USER_ID\}\}/g, recipient._id);
          
          return sendEmail({
            to: recipient.email,
            subject: `📢 ${subject}`,
            text: `${subject}\n\n${message}\n\n---\nVisit ${config.appName} at https://${config.domainName}/en\n\nUnsubscribe: https://${config.domainName}/api/unsubscribe?userId=${recipient._id}&type=all`,
            html: personalizedHtml,
            headers: {
              'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${recipient._id}&type=all>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
        })
      );

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          sentCount++;
        } else {
          failedCount++;
        }
      });

      // Wait a bit between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      message: testMode
        ? `Test email sent to ${session.user.email}`
        : `Newsletter sent to ${sentCount} users (${failedCount} failed)`,
      stats: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
}

