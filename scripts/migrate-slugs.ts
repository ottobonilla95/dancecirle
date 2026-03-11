/**
 * Migration script to generate slugs for countries, continents, and dance styles.
 *
 * Usage: npx tsx scripts/migrate-slugs.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment");
  process.exit(1);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

async function migrateCollection(
  db: mongoose.mongo.Db,
  collectionName: string,
  slugFn: (doc: any) => string
) {
  const docs = await db.collection(collectionName).find({}).toArray();
  console.log(`\n${collectionName}: Found ${docs.length} documents`);

  const slugCounts: Record<string, number> = {};
  let updated = 0;

  for (const doc of docs) {
    let slug = slugFn(doc);

    // Handle duplicates
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }

    await db.collection(collectionName).updateOne(
      { _id: doc._id },
      { $set: { slug } }
    );
    updated++;
  }

  console.log(`${collectionName}: Updated ${updated} documents`);

  // Show examples
  const examples = await db
    .collection(collectionName)
    .find({ slug: { $exists: true } })
    .limit(5)
    .project({ name: 1, slug: 1 })
    .toArray();

  examples.forEach((d) => console.log(`  ${d.name} -> ${d.slug}`));
}

async function main() {
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  // Countries
  await migrateCollection(db, "countries", (doc) => generateSlug(doc.name));

  // Continents
  await migrateCollection(db, "continents", (doc) => generateSlug(doc.name));

  // Dance Styles
  await migrateCollection(db, "dancestyles", (doc) => generateSlug(doc.name));

  console.log("\nAll migrations complete!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
