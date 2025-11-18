/**
 * Background Image Migration Script
 * Migrates user profile pictures from Cloudinary to ImageKit
 * 
 * Usage:
 *   npm run ts-node scripts/migrate-images-to-imagekit.ts
 * 
 * Features:
 *   - Migrates in batches (safe for production)
 *   - Skips already migrated images
 *   - Updates database automatically
 *   - Logs progress
 *   - Handles errors gracefully
 */

import mongoose from 'mongoose';
import User from '../models/User';
import crypto from 'crypto';
import FormData from 'form-data'; // Node.js FormData

// Configuration
const BATCH_SIZE = 10; // Images per batch
const DELAY_BETWEEN_BATCHES = 60000; // 1 minute (stay under API limits)
const DRY_RUN = true; // Set to false to actually migrate

const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

interface MigrationStats {
  total: number;
  cloudinary: number;
  imagekit: number;
  migrated: number;
  failed: number;
  skipped: number;
}

/**
 * Generate ImageKit authentication parameters
 */
function generateImageKitAuth() {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes
  const signature = crypto
    .createHmac('sha1', IMAGEKIT_PRIVATE_KEY!)
    .update(token + expire)
    .digest('hex');

  return { token, expire, signature, publicKey: IMAGEKIT_PUBLIC_KEY };
}

/**
 * Upload image to ImageKit from URL
 */
async function uploadToImageKit(imageUrl: string, userId: string): Promise<string | null> {
  try {
    const auth = generateImageKitAuth();
    
    // Create FormData for Node.js
    const formData = new FormData();
    formData.append('file', imageUrl); // ImageKit can fetch from URL!
    formData.append('fileName', `profile-${userId}-${Date.now()}.jpg`);
    formData.append('folder', '/dancecircle/profile-pics');
    formData.append('useUniqueFileName', 'false');
    formData.append('transformation', JSON.stringify({
      pre: 'w-800,h-800,c-at_max,fo-face',
    }));
    
    // Add auth params
    formData.append('token', auth.token);
    formData.append('signature', auth.signature);
    formData.append('expire', auth.expire.toString());
    formData.append('publicKey', auth.publicKey!);

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(IMAGEKIT_PRIVATE_KEY + ':').toString('base64')}`,
        ...formData.getHeaders(), // Important for Node.js FormData!
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ImageKit upload failed:', error);
      return null;
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
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
    const users = await User.find({
      image: /^https:\/\/res\.cloudinary\.com/
    })
      .limit(BATCH_SIZE)
      .lean();

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

