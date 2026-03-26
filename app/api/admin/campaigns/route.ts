import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Campaign from "@/models/Campaign";
import User from "@/models/User";
import City from "@/models/City";
import config from "@/config";
import { sendEmail } from "@/libs/resend";
import { campaignEmail } from "@/libs/email-templates";

export const dynamic = "force-dynamic";

// GET: List all campaigns
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectMongo();

    const campaigns = await Campaign.find()
      .populate("filters.countries", "name code")
      .populate("filters.danceStyles", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create and send a campaign
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectMongo();

    const { subject, bodyText, imageUrl, ctaLink, ctaText, countries, danceStyles } =
      await req.json();

    if (!subject || !bodyText) {
      return NextResponse.json(
        { error: "Subject and body text are required" },
        { status: 400 }
      );
    }

    // Build user query
    const userQuery: any = {
      "notificationSettings.emailNotifications": { $ne: false },
      email: { $exists: true, $ne: null },
    };

    // Filter by country: find cities in selected countries, then users in those cities
    if (countries && countries.length > 0) {
      const cities = await City.find({ country: { $in: countries } }).select("_id");
      const cityIds = cities.map((c: any) => c._id);
      userQuery.city = { $in: cityIds };
    }

    // Filter by dance style
    if (danceStyles && danceStyles.length > 0) {
      userQuery["danceStyles.danceStyle"] = { $in: danceStyles };
    }

    const recipients = await User.find(userQuery).select(
      "email name preferredLanguage"
    );

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients match the selected filters" },
        { status: 400 }
      );
    }

    // Create campaign record
    const campaign = await Campaign.create({
      subject,
      bodyText,
      imageUrl,
      ctaLink,
      ctaText,
      filters: {
        countries: countries || [],
        danceStyles: danceStyles || [],
      },
      recipientCount: recipients.length,
      status: "sent",
      sentAt: new Date(),
      sentBy: session.user.email,
    });

    // Send emails in batches (Resend supports sending to individual addresses)
    const BATCH_SIZE = 10;
    let sentCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const emailPromises = batch.map(async (recipient: any) => {
        try {
          const locale = recipient.preferredLanguage === "es" ? "es" : "en";
          const emailData = campaignEmail(
            { subject, bodyText, imageUrl, ctaLink, ctaText },
            recipient._id.toString(),
            locale
          );

          await sendEmail({
            to: recipient.email,
            subject: emailData.subject,
            text: emailData.text,
            html: emailData.html,
            headers: emailData.headers,
          });
          sentCount++;
        } catch (err: any) {
          console.error(`Failed to send to ${recipient.email}:`, err.message);
          errors.push(recipient.email);
        }
      });

      await Promise.all(emailPromises);
    }

    return NextResponse.json({
      success: true,
      campaign,
      sentCount,
      totalRecipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
