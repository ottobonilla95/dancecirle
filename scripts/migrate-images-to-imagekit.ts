/**
 * Background Image Migration Script
 * Migrates user profile pictures from Cloudinary to ImageKit
 * 
 * Usage:
 *   npx tsx scripts/migrate-images-to-imagekit.ts
 * 
 * Features:
 *   - Migrates in batches (safe for production)
 *   - Skips already migrated images
 *   - Updates database automatically
 *   - Logs progress
 *   - Handles errors gracefully
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import User from '../models/User';
import ImageKit from 'imagekit'; // ImageKit Node.js SDK

// Configuration
const BATCH_SIZE = 10; // Images per batch
const DELAY_BETWEEN_BATCHES = 60000; // 1 minute (stay under API limits)
const DRY_RUN = false; // Set to false to actually migrate

// TEST MODE: Set a user ID to test with just one user
const TEST_USER_ID = null

const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

// Initialize ImageKit SDK
const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY!,
  privateKey: IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: IMAGEKIT_URL_ENDPOINT!,
});

interface MigrationStats {
  total: number;
  cloudinary: number;
  imagekit: number;
  migrated: number;
  failed: number;
  skipped: number;
}

/**
 * Upload image to ImageKit from URL (using official SDK)
 */
async function uploadToImageKit(imageUrl: string, userId: string): Promise<string | null> {
  try {
    console.log('  📥 Downloading image from Cloudinary...');
    
    // Download the image from Cloudinary
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('  ❌ Failed to download image from Cloudinary');
      return null;
    }
    
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');
    
    console.log('  ✅ Downloaded image:', Math.round(imageBuffer.length / 1024), 'KB');
    console.log('  📤 Uploading to ImageKit using SDK...');
    
    // Upload using ImageKit SDK (proper way!)
    const result = await imagekit.upload({
      file: base64Image, // Base64 string
      fileName: `profile-${userId}-${Date.now()}.jpg`,
      folder: '/dancecircle/profile-pics',
      useUniqueFileName: false,
    });

    console.log('  ✅ Upload successful!');
    console.log('  New URL:', result.url.substring(0, 60) + '...');
    return result.url;
  } catch (error: any) {
    console.error('  ❌ ImageKit upload failed:', error.message || error);
    return null;
  }
}

/**
 * Migrate a single user's image
 */
async function migrateUserImage(user: any): Promise<boolean> {
  if (!user.image) return false;
  
  // Skip if already on ImageKit
  if (user.image.includes('ik.imagekit.io')) {
    console.log(`✓ Skipped ${user.name} - already on ImageKit`);
    return false;
  }

  // Skip if not on Cloudinary
  if (!user.image.includes('res.cloudinary.com')) {
    console.log(`✓ Skipped ${user.name} - not on Cloudinary`);
    return false;
  }

  // QUALITY FILTER: Only migrate recent high-quality images
  // Skip if image was uploaded before the quality improvements
  const QUALITY_CUTOFF_DATE = new Date('2025-01-01'); // Adjust this date!
  if (user.updatedAt && user.updatedAt < QUALITY_CUTOFF_DATE) {
    console.log(`✓ Skipped ${user.name} - old low-quality image (will re-upload naturally)`);
    return false;
  }

  console.log(`→ Migrating ${user.name} (${user.email})...`);
  console.log(`  Old URL: ${user.image.substring(0, 80)}...`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would migrate this image`);
    return false;
  }

  const newImageUrl = await uploadToImageKit(user.image, user._id.toString());

  if (!newImageUrl) {
    console.log(`✗ Failed to migrate ${user.name}`);
    return false;
  }

  // Update database
  user.image = newImageUrl;
  await user.save();

  console.log(`✓ Migrated ${user.name}`);
  console.log(`  New URL: ${newImageUrl.substring(0, 80)}...`);
  return true;
}

/**
 * Get migration statistics
 */
async function getStats(): Promise<MigrationStats> {
  const total = await User.countDocuments({ image: { $exists: true, $ne: null } });
  const cloudinary = await User.countDocuments({ image: /^https:\/\/res\.cloudinary\.com/ });
  const imagekit = await User.countDocuments({ image: /^https:\/\/ik\.imagekit\.io/ });

  return {
    total,
    cloudinary,
    imagekit,
    migrated: 0,
    failed: 0,
    skipped: 0,
  };
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('🚀 Starting Image Migration to ImageKit\n');

  // Connect to MongoDB
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  // Check credentials
  if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_PUBLIC_KEY) {
    throw new Error('ImageKit credentials not set');
  }
  console.log('✓ ImageKit credentials found\n');

  // Get initial stats
  const initialStats = await getStats();
  console.log('📊 Initial Statistics:');
  console.log(`   Total users with images: ${initialStats.total}`);
  console.log(`   On Cloudinary: ${initialStats.cloudinary}`);
  console.log(`   On ImageKit: ${initialStats.imagekit}`);
  console.log(`   To migrate: ${initialStats.cloudinary}\n`);

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Migrate in batches
  const stats: MigrationStats = { ...initialStats };
  let batch = 1;

  while (true) {
    console.log(`\n📦 Batch ${batch} (${BATCH_SIZE} images)`);
    console.log('─'.repeat(50));

    // Get users with Cloudinary images
    let query: any = {
      image: /^https:\/\/res\.cloudinary\.com/
    };

    // TEST MODE: If TEST_USER_ID is set, only process that user
    if (TEST_USER_ID) {
      console.log(`🧪 TEST MODE: Only processing user ${TEST_USER_ID}`);
      query._id = TEST_USER_ID;
    }

    const users = await User.find(query)
      .limit(BATCH_SIZE); // Removed .lean() so we can use .save()

    if (users.length === 0) {
      console.log('\n✓ No more images to migrate!');
      break;
    }

    // Migrate batch
    for (const user of users) {
      const success = await migrateUserImage(user);
      if (success) {
        stats.migrated++;
      } else {
        stats.skipped++;
      }
    }

    console.log(`\n✓ Batch ${batch} complete`);
    console.log(`   Migrated: ${stats.migrated}`);
    console.log(`   Skipped: ${stats.skipped}`);

    // Wait before next batch (to stay under API limits)
    if (users.length === BATCH_SIZE) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      batch++;
    } else {
      break;
    }
  }

  // Final stats
  const finalStats = await getStats();
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Migration Complete!\n');
  console.log('📊 Final Statistics:');
  console.log(`   Total users with images: ${finalStats.total}`);
  console.log(`   On Cloudinary: ${finalStats.cloudinary}`);
  console.log(`   On ImageKit: ${finalStats.imagekit}`);
  console.log(`   Successfully migrated: ${stats.migrated}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log('='.repeat(50));

  await mongoose.disconnect();
}

// Run migration
migrateImages()
  .then(() => {
    console.log('\n✓ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });

