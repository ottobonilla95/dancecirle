/**
 * Migration script to generate slugs for all existing cities.
 * Slug format: "city-name-country-name" (e.g., "bogota-colombia")
 *
 * Usage: npx tsx scripts/migrate-city-slugs.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment");
  process.exit(1);
}

function generateSlug(cityName: string, countryName: string): string {
  return `${cityName}-${countryName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics (á -> a, ñ -> n, etc.)
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

async function main() {
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  const cities = await db.collection("cities").aggregate([
    {
      $lookup: {
        from: "countries",
        localField: "country",
        foreignField: "_id",
        as: "countryData",
      },
    },
    { $unwind: "$countryData" },
  ]).toArray();

  console.log(`Found ${cities.length} cities to migrate`);

  const slugCounts: Record<string, number> = {};
  let updated = 0;

  for (const city of cities) {
    let slug = generateSlug(city.name, city.countryData.name);

    // Handle duplicates by appending a number
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }

    await db.collection("cities").updateOne(
      { _id: city._id },
      { $set: { slug } }
    );
    updated++;

    if (updated % 100 === 0) {
      console.log(`Updated ${updated}/${cities.length}`);
    }
  }

  console.log(`Done! Updated ${updated} cities with slugs.`);

  // Show some examples
  const examples = await db.collection("cities")
    .find({ slug: { $exists: true } })
    .limit(10)
    .project({ name: 1, slug: 1 })
    .toArray();

  console.log("\nExamples:");
  examples.forEach((c) => console.log(`  ${c.name} -> ${c.slug}`));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
