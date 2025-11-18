import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getActiveUsersForDigest, getWeeklyDigestData, shouldSendDigest } from "@/utils/weekly-digest";
import { generateWeeklyDigestHTML, generateWeeklyDigestText } from "@/utils/email-templates/weekly-digest";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

// 🚫 TEMPORARY: Emails to exclude during testing (already received digest)
// TODO: Remove this list once testing is complete
const EXCLUDED_EMAILS = [
  "supinyat7677@gmail.com",
  "jaroldchristopherortiaga@gmail.com",
  "wojciechowskil@outlook.fr",
  "covaci_alexia@yahoo.com",
  "juliette.cazabat@gmail.com",
  "irinaxgeorgiana@gmail.com",
  "christina.jander@gmail.com",
  "ayesharazashoaib@gmail.com",
  "camillepouget.nc@gmail.com",
  "t.sandalova1998@gmail.com",
  "anniecartwright123@gmail.com",
  "raulmaciel346@gmail.com",
  "omar4795@gmail.com",
  "mariipilv@gmail.com",
  "perfectionista66@gmail.com",
  "jennyma3222@gmail.com",
  "alalboti@gmail.com",
  "caio.guima@outlook.com",
  "silpochova.nikolka@seznam.cz",
  "m.verges@outlook.com",
  "rafaeldavilasosa@hotmail.com",
  "clem03101997@icloud.com",
  "kratosrock@hotmail.it",
  "francoacunaaguilera@gmail.com",
  "lorenzo.kes@hotmail.it",
  "hugo.abrantes.soares@gmail.com",
  "elianamaceiras@hotmail.com",
  "michellbrunofar@gmail.com",
];

/**
 * POST /api/cron/weekly-digest
 * 
 * Sends weekly digest emails to all active users.
 * Should be called via cron every Monday morning.
 * 
 * Security: Protected by cron secret or admin auth
 */
export async function POST(req: Request) {
  try {
    // Check authorization - allow either cron secret OR admin user
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorizedCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    // Check if user is admin (for manual testing)
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.email === config.admin.email;
    
    if (!isAuthorizedCron && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access or cron secret required" },
        { status: 401 }
      );
    }

    console.log('🚀 Starting weekly digest job...');

    // Get all active users
    const activeUserIds = await getActiveUsersForDigest();
    console.log(`📋 Found ${activeUserIds.length} active users`);

    // 🔥 FIRE-AND-FORGET: Start email sending in background
    // Don't await this - return response immediately!
    sendDigestEmails(activeUserIds).catch(error => {
      console.error('💥 Background email job failed:', error);
    });

    // Return immediately - emails will send in background
    return NextResponse.json({
      success: true,
      message: 'Weekly digest job started',
      totalUsers: activeUserIds.length,
      status: 'processing',
      timestamp: new Date().toISOString(),
      note: 'Emails are being sent in the background. Check Vercel logs for progress.',
    }, { status: 202 }); // 202 = Accepted

  } catch (error: any) {
    console.error('💥 Weekly digest job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Send digest emails in background (fire-and-forget)
 */
async function sendDigestEmails(activeUserIds: string[]) {
  let emailsSent = 0;
  let emailsSkipped = 0;
  let emailsFailed = 0;
  const failures: Array<{ userId: string; error: string }> = [];

  // Process users in batches to avoid overwhelming the email service
  const BATCH_SIZE = 50;
  const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

  for (let i = 0; i < activeUserIds.length; i += BATCH_SIZE) {
    const batch = activeUserIds.slice(i, i + BATCH_SIZE);
    
    console.log(`📧 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(activeUserIds.length / BATCH_SIZE)}...`);

    // Process batch in parallel
    await Promise.all(
      batch.map(async (userId) => {
        try {
          // Get digest data
          const digestData = await getWeeklyDigestData(userId);

          if (!digestData) {
            emailsSkipped++;
            return;
          }

          // 🚫 TEMPORARY: Skip users who already received the digest during testing
          if (EXCLUDED_EMAILS.includes(digestData.user.email)) {
            emailsSkipped++;
            console.log(`⏭️ Skipped ${digestData.user.name} - already received digest (testing exclusion)`);
            return;
          }

          // Check if user has weekly digest enabled
          if (digestData.user.notificationSettings?.weeklyDigest === false) {
            emailsSkipped++;
            console.log(`⏭️ Skipped ${digestData.user.name} - weekly digest disabled in settings`);
            return;
          }

          // Check if we should send (has activity)
          if (!shouldSendDigest(digestData)) {
            emailsSkipped++;
            return;
          }

          // Generate email
          const html = generateWeeklyDigestHTML(digestData);
          const text = generateWeeklyDigestText(digestData);

          // Send email with unsubscribe headers
          await sendEmail({
            to: digestData.user.email,
            subject: `💃 Your Week on ${config.appName}`,
            html,
            text,
            headers: {
              'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${userId}&type=weeklyDigest>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });

          emailsSent++;
          console.log(`✅ Sent digest to ${digestData.user.name} (${digestData.user.email})`);
        } catch (error: any) {
          console.error(`❌ Failed to send digest to user ${userId}:`, error.message);
          emailsFailed++;
          failures.push({
            userId,
            error: error.message,
          });
        }
      })
    );

    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < activeUserIds.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const summary = {
    success: true,
    totalUsers: activeUserIds.length,
    emailsSent,
    emailsSkipped,
    emailsFailed,
    timestamp: new Date().toISOString(),
    ...(failures.length > 0 && { failures: failures.slice(0, 10) }), // Show first 10 failures
  };

  console.log('✅ Weekly digest job completed:', summary);
  return summary;
}

/**
 * GET /api/cron/weekly-digest
 * 
 * Returns info about the weekly digest endpoint (for testing)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/weekly-digest',
    method: 'POST',
    description: 'Sends weekly digest emails to all active users',
    authentication: 'Bearer token with CRON_SECRET',
    schedule: 'Every Monday at 9:00 AM',
    rateLimit: '50 emails per batch with 2s delay between batches',
  });
}

