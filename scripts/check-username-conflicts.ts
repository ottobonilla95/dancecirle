import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

const RESERVED_ROUTES = [
  "en", "es", "admin", "api", "dashboard", "settings", "onboarding",
  "feed", "friends", "discover", "cities", "countries", "music",
  "stats", "blog", "signin", "invite", "messages", "leaderboards",
  "city", "continent", "country",
  "dancer", "dj", "events", "organizer-events",
  "release", "releases", "profile",
  "privacy-policy", "tos", "unsubscribe-success", "dance-style",
  "auth", "sitemap.xml", "robots.txt", "manifest.json", "favicon.ico",
];

async function main() {
  await connectMongo();

  const conflicts = await User.find({
    username: { $in: RESERVED_ROUTES },
  })
    .select("_id username name email createdAt isProfileComplete")
    .lean();

  console.log(`\n🔍 Checked ${RESERVED_ROUTES.length} reserved route names`);
  console.log(`Found ${conflicts.length} users with conflicting usernames:\n`);

  if (conflicts.length === 0) {
    console.log("✅ No conflicts — safe to proceed with the migration.\n");
  } else {
    conflicts.forEach((u: any) => {
      console.log(
        `  - @${u.username} (${u.name || "no name"}) · ${u.email} · profileComplete=${u.isProfileComplete} · id=${u._id}`
      );
    });
    console.log(
      `\n⚠️  These users must be renamed before deploying the migration.`
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
