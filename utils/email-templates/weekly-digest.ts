import { WeeklyDigestData } from "../weekly-digest";
import config from "@/config";

/**
 * Generate unsubscribe links for weekly digest
 */
function getWeeklyDigestUnsubscribeFooter(userId: string): string {
  const unsubscribeUrl = `https://${config.domainName}/api/unsubscribe?userId=${userId}&type=weeklyDigest`;
  const unsubscribeAllUrl = `https://${config.domainName}/api/unsubscribe?userId=${userId}&type=all`;
  const settingsUrl = `https://${config.domainName}/settings`;
  
  return `<a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe from weekly digest</a> | <a href="${unsubscribeAllUrl}" style="color: #999; text-decoration: underline;">Unsubscribe from all</a> | <a href="${settingsUrl}" style="color: #667eea;">Manage preferences</a>`;
}

export function generateWeeklyDigestHTML(data: WeeklyDigestData): string {
  const { user, profileActivity, leaderboardChanges, friendActivity, tripActivity } = data;

  // Determine what sections to show
  const hasProfileActivity = profileActivity.views > 0 || profileActivity.newLikes > 0;
  const hasLeaderboardChanges = Object.values(leaderboardChanges).some(
    (change: any) => change?.improved || change?.isNew || change?.droppedOut
  );
  const hasFriendActivity = 
    friendActivity.friendsWithUpcomingTrips > 0;
  const hasTripActivity = tripActivity.upcomingTripOverlaps > 0;

  // Generate leaderboard section HTML
  let leaderboardHTML = '';
  if (hasLeaderboardChanges) {
    const leaderboardItems: string[] = [];

    // Check each leaderboard
    if (leaderboardChanges.mostLiked?.improved || leaderboardChanges.mostLiked?.isNew) {
      const change = leaderboardChanges.mostLiked;
      const emoji = change.isNew ? '🆕' : '🚀';
      const text = change.isNew 
        ? `You're now on the Most Liked leaderboard! (#${change.current})`
        : `Most Liked: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          ${!change.isNew ? `<div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 10px;">Keep it up! You're climbing.</div>` : ''}
          <a href="https://${config.domainName}/leaderboards?category=mostLiked" style="display: inline-block; background: white; color: #667eea; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardChanges.jjChampions?.improved || leaderboardChanges.jjChampions?.isNew) {
      const change = leaderboardChanges.jjChampions;
      const emoji = change.isNew ? '🆕' : '🏆';
      const text = change.isNew 
        ? `You're now on the J&J Champions leaderboard! (#${change.current})`
        : `J&J Champions: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          ${!change.isNew ? `<div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 10px;">Amazing progress!</div>` : ''}
          <a href="https://${config.domainName}/leaderboards?category=jjChampions" style="display: inline-block; background: white; color: #f5576c; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardChanges.jjPodium?.improved || leaderboardChanges.jjPodium?.isNew) {
      const change = leaderboardChanges.jjPodium;
      const emoji = change.isNew ? '🆕' : '🥉';
      const text = change.isNew 
        ? `You're now on the J&J Podium leaderboard! (#${change.current})`
        : `J&J Podium: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          <a href="https://${config.domainName}/leaderboards?category=jjPodium" style="display: inline-block; background: white; color: #fa709a; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardChanges.jjParticipation?.improved || leaderboardChanges.jjParticipation?.isNew) {
      const change = leaderboardChanges.jjParticipation;
      const emoji = change.isNew ? '🆕' : '🎭';
      const text = change.isNew 
        ? `You're now on the J&J Participation leaderboard! (#${change.current})`
        : `J&J Participation: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          <a href="https://${config.domainName}/leaderboards?category=jjParticipation" style="display: inline-block; background: #d299c2; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardChanges.mostLikedTeachers?.improved || leaderboardChanges.mostLikedTeachers?.isNew) {
      const change = leaderboardChanges.mostLikedTeachers;
      const emoji = change.isNew ? '🆕' : '👨‍🏫';
      const text = change.isNew 
        ? `You're now on the Most Liked Teachers leaderboard! (#${change.current})`
        : `Most Liked Teachers: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          <a href="https://${config.domainName}/leaderboards?category=mostLikedTeachers" style="display: inline-block; background: #a8edea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardChanges.mostLikedDJs?.improved || leaderboardChanges.mostLikedDJs?.isNew) {
      const change = leaderboardChanges.mostLikedDJs;
      const emoji = change.isNew ? '🆕' : '🎧';
      const text = change.isNew 
        ? `You're now on the Most Liked DJs leaderboard! (#${change.current})`
        : `Most Liked DJs: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          <a href="https://${config.domainName}/leaderboards?category=mostLikedDJs" style="display: inline-block; background: #ff9a9e; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardChanges.mostLikedPhotographers?.improved || leaderboardChanges.mostLikedPhotographers?.isNew) {
      const change = leaderboardChanges.mostLikedPhotographers;
      const emoji = change.isNew ? '🆕' : '📸';
      const text = change.isNew 
        ? `You're now on the Most Liked Photographers leaderboard! (#${change.current})`
        : `Most Liked Photographers: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          <a href="https://${config.domainName}/leaderboards?category=mostLikedPhotographers" style="display: inline-block; background: #ffecd2; color: #333; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardChanges.mostLikedProducers?.improved || leaderboardChanges.mostLikedProducers?.isNew) {
      const change = leaderboardChanges.mostLikedProducers;
      const emoji = change.isNew ? '🆕' : '🎹';
      const text = change.isNew 
        ? `You're now on the Most Liked Producers leaderboard! (#${change.current})`
        : `Most Liked Producers: #${change.current} (↑${Math.abs(change.change)})`;
      leaderboardItems.push(`
        <div style="padding: 15px; background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); border-radius: 8px; margin-bottom: 10px;">
          <div style="color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${emoji} ${text}</div>
          <a href="https://${config.domainName}/leaderboards?category=mostLikedProducers" style="display: inline-block; background: #84fab0; color: #333; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
            View Leaderboard →
          </a>
        </div>
      `);
    }

    if (leaderboardItems.length > 0) {
      leaderboardHTML = `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; font-size: 20px; margin-bottom: 15px; padding-bottom: 10px;">
            📊 Your Leaderboard Stats
          </h2>
          ${leaderboardItems.join('')}
        </div>
      `;
    }
  }

  // Generate profile activity section
  let profileActivityHTML = '';
  if (hasProfileActivity) {
    const activityItems: string[] = [];
    
    if (profileActivity.views > 0) {
      activityItems.push(`<div style="margin-bottom: 10px; font-size: 16px;">• <strong>${profileActivity.views}</strong> profile view${profileActivity.views > 1 ? 's' : ''} from <strong>${profileActivity.uniqueViewers}</strong> dancer${profileActivity.uniqueViewers > 1 ? 's' : ''}</div>`);
    }
    
    if (profileActivity.newLikes > 0) {
      activityItems.push(`<div style="font-size: 16px;">• <strong>${profileActivity.newLikes}</strong> new like${profileActivity.newLikes > 1 ? 's' : ''} ❤️</div>`);
    }

    // Show follower count for featured professionals
    if (profileActivity.isFeaturedProfessional && profileActivity.followersCount > 0) {
      activityItems.push(`<div style="font-size: 16px; margin-top: 10px;">• <strong>${profileActivity.followersCount}</strong> follower${profileActivity.followersCount > 1 ? 's' : ''} ⭐</div>`);
    }

    if (activityItems.length > 0) {
      profileActivityHTML = `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; font-size: 20px; margin-bottom: 15px; padding-bottom: 10px;">
            👀 Profile Activity
          </h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${activityItems.join('')}
          </div>
        </div>
      `;
    }
  }

  // Generate friend activity section
  let friendActivityHTML = '';
  if (hasFriendActivity) {
    friendActivityHTML = `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 20px; margin-bottom: 15px; padding-bottom: 10px;">
          👥 Friend Activity
        </h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="font-size: 16px; margin-bottom: 15px;">• <strong>${friendActivity.friendsWithUpcomingTrips}</strong> friend${friendActivity.friendsWithUpcomingTrips > 1 ? 's have' : ' has'} upcoming trips ✈️</div>
          <a href="https://${config.domainName}/friends/trips" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 10px;">
            See All Trips
          </a>
        </div>
      </div>
    `;
  }

  // Generate trip activity section
  let tripActivityHTML = '';
  if (hasTripActivity) {
    const overlapsText = tripActivity.friendsInSameCities.map(overlap => 
      `<div style="margin-bottom: 8px;">• <strong>${overlap.friendName}</strong> in <strong>${overlap.cityName}</strong> (${overlap.dates})</div>`
    ).join('');

    tripActivityHTML = `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 20px; margin-bottom: 15px; padding-bottom: 10px;">
          ✈️ Trip Overlaps
        </h2>
        <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); padding: 20px; border-radius: 8px;">
          <div style="font-size: 16px; margin-bottom: 15px; font-weight: bold; color: #333;">
            🎉 You overlap with ${tripActivity.upcomingTripOverlaps} friend${tripActivity.upcomingTripOverlaps > 1 ? 's' : ''}!
          </div>
          <div style="font-size: 15px; color: #333;">
            ${overlapsText}
          </div>
        </div>
      </div>
    `;
  }

  const baseUrl = `https://${config.domainName}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const profileUrl = user.username 
    ? `${baseUrl}/${user.username}`
    : `${baseUrl}/profile`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 10px; }
          .button:hover { background: #5568d3; }
          .footer { background: #f8f9fa; text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">💃 Your Week on ${config.appName} 🕺</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Hey ${user.name}! Here's what happened this week.</p>
          </div>
          
          <div class="content">
            ${leaderboardHTML}
            ${profileActivityHTML}
            ${friendActivityHTML}
            ${tripActivityHTML}

            <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
              <a href="${dashboardUrl}" class="button">View Your Dashboard</a>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;">Keep dancing! 💃🕺</p>
            <p style="margin: 0;">
              <a href="${profileUrl}" style="color: #667eea; text-decoration: none;">View Your Profile</a> • 
              <a href="${baseUrl}/leaderboards" style="color: #667eea; text-decoration: none;">Leaderboards</a> • 
              <a href="${baseUrl}/settings" style="color: #667eea; text-decoration: none;">Email Settings</a>
            </p>
            <p style="margin: 15px 0 0 0; font-size: 11px; color: #999;">
              This is your weekly digest from ${config.appName}. You're receiving this because you're an active member of our dance community.
            </p>
            <p style="margin: 15px 0 0 0; font-size: 11px;">
              ${getWeeklyDigestUnsubscribeFooter(user._id)}
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateWeeklyDigestText(data: WeeklyDigestData): string {
  const { user, profileActivity, leaderboardChanges, friendActivity, tripActivity } = data;

  let text = `Your Week on ${config.appName}\n`;
  text += `================================\n\n`;
  text += `Hey ${user.name}! Here's what happened this week:\n\n`;

  // Leaderboard changes
  const leaderboardItems: string[] = [];
  if (leaderboardChanges.mostLiked?.improved || leaderboardChanges.mostLiked?.isNew) {
    const change = leaderboardChanges.mostLiked;
    leaderboardItems.push(change.isNew 
      ? `• You're now on the Most Liked leaderboard! (#${change.current})`
      : `• Most Liked: #${change.current} (up ${Math.abs(change.change)} spots!)`
    );
  }
  if (leaderboardChanges.jjChampions?.improved || leaderboardChanges.jjChampions?.isNew) {
    const change = leaderboardChanges.jjChampions;
    leaderboardItems.push(change.isNew 
      ? `• You're now on the J&J Champions leaderboard! (#${change.current})`
      : `• J&J Champions: #${change.current} (up ${Math.abs(change.change)} spots!)`
    );
  }
  if (leaderboardChanges.jjPodium?.improved || leaderboardChanges.jjPodium?.isNew) {
    const change = leaderboardChanges.jjPodium;
    leaderboardItems.push(change.isNew 
      ? `• You're now on the J&J Podium leaderboard! (#${change.current})`
      : `• J&J Podium: #${change.current} (up ${Math.abs(change.change)} spots!)`
    );
  }
  if (leaderboardChanges.jjParticipation?.improved || leaderboardChanges.jjParticipation?.isNew) {
    const change = leaderboardChanges.jjParticipation;
    leaderboardItems.push(change.isNew 
      ? `• You're now on the J&J Participation leaderboard! (#${change.current})`
      : `• J&J Participation: #${change.current} (up ${Math.abs(change.change)} spots!)`
    );
  }

  if (leaderboardItems.length > 0) {
    text += `LEADERBOARD STATS\n`;
    text += `----------------\n`;
    text += leaderboardItems.join('\n') + '\n\n';
  }

  // Profile activity
  const hasAnyProfileActivity = profileActivity.views > 0 || profileActivity.newLikes > 0 || 
    (profileActivity.isFeaturedProfessional && profileActivity.followersCount > 0);
  if (hasAnyProfileActivity) {
    text += `PROFILE ACTIVITY\n`;
    text += `----------------\n`;
    if (profileActivity.views > 0) {
      text += `• ${profileActivity.views} profile view${profileActivity.views > 1 ? 's' : ''} from ${profileActivity.uniqueViewers} dancer${profileActivity.uniqueViewers > 1 ? 's' : ''}\n`;
    }
    if (profileActivity.newLikes > 0) {
      text += `• ${profileActivity.newLikes} new like${profileActivity.newLikes > 1 ? 's' : ''}\n`;
    }
    if (profileActivity.isFeaturedProfessional && profileActivity.followersCount > 0) {
      text += `• ${profileActivity.followersCount} follower${profileActivity.followersCount > 1 ? 's' : ''} ⭐\n`;
    }
    text += '\n';
  }

  // Friend activity
  if (friendActivity.friendsWithUpcomingTrips > 0) {
    text += `FRIEND ACTIVITY\n`;
    text += `----------------\n`;
    text += `• ${friendActivity.friendsWithUpcomingTrips} friend${friendActivity.friendsWithUpcomingTrips > 1 ? 's have' : ' has'} upcoming trips\n`;
    text += `\nSee all trips: https://${config.domainName}/friends/trips\n`;
    text += '\n';
  }

  // Trip overlaps
  if (tripActivity.upcomingTripOverlaps > 0) {
    text += `TRIP OVERLAPS\n`;
    text += `----------------\n`;
    text += `You overlap with ${tripActivity.upcomingTripOverlaps} friend${tripActivity.upcomingTripOverlaps > 1 ? 's' : ''}!\n`;
    tripActivity.friendsInSameCities.forEach(overlap => {
      text += `• ${overlap.friendName} in ${overlap.cityName} (${overlap.dates})\n`;
    });
    text += '\n';
  }

  const baseUrl = `https://${config.domainName}`;
  text += `\nView your dashboard: ${baseUrl}/dashboard\n`;
  text += `\nKeep dancing! 💃🕺\n`;

  return text;
}

