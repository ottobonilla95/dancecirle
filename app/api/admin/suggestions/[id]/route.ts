import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Suggestion from "@/models/Suggestion";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();
    const { status, adminNotes } = body;

    const suggestion = await Suggestion.findById(params.id);

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const oldStatus = suggestion.status;

    // Update suggestion
    suggestion.status = status || suggestion.status;
    suggestion.adminNotes = adminNotes !== undefined ? adminNotes : suggestion.adminNotes;

    if (status === "completed" && oldStatus !== "completed") {
      suggestion.completedAt = new Date();
    }

    await suggestion.save();

    // Send notification email if status changed to completed
    if (status === "completed" && oldStatus !== "completed") {
      try {
        const categoryEmoji: { [key: string]: string } = {
          feature: "✨",
          improvement: "🚀",
          bug: "🐛",
          other: "💭",
        };

        const emailSubject = `${categoryEmoji[suggestion.category] || "💡"} Your suggestion has been completed!`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">
                🎉 Great News!
              </h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #333; font-size: 18px;">
                  Your suggestion has been implemented! 🚀
                </h2>
                
                <p style="color: #666; line-height: 1.6;">
                  Hi ${suggestion.userName},
                </p>
                
                <p style="color: #666; line-height: 1.6;">
                  We're excited to let you know that your suggestion has been completed and is now live on ${config.appName}!
                </p>
              </div>

              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px;">Your Original Suggestion:</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                  <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${suggestion.suggestion}</p>
                </div>
              </div>

              ${adminNotes ? `
              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px;">Note from our team:</h3>
                <p style="margin: 0; color: #666; line-height: 1.6;">${adminNotes}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 20px 0;">
                <a href="https://${config.domainName}/en" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Check it out! →
                </a>
              </div>

              <div style="margin-top: 20px; padding: 20px; background: #e0f2fe; border-radius: 6px;">
                <p style="margin: 0; color: #0369a1; font-size: 14px; line-height: 1.6;">
                  Thank you for helping us improve ${config.appName}! Your feedback is invaluable to us. 💙
                </p>
              </div>

              <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>Keep the great ideas coming!</p>
              </div>
            </div>
          </div>
        `;

        await sendEmail({
          to: suggestion.userEmail,
          subject: emailSubject,
          text: `Your suggestion has been completed!\n\n${suggestion.suggestion}\n\n${adminNotes ? `Note: ${adminNotes}\n\n` : ''}Check it out at https://${config.domainName}/en`,
          html: emailHtml,
        });

        suggestion.notifiedAt = new Date();
        await suggestion.save();
      } catch (emailError) {
        console.error("Failed to send completion email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    console.error("Error updating suggestion:", error);
    return NextResponse.json(
      { error: "Failed to update suggestion" },
      { status: 500 }
    );
  }
}

