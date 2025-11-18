/**
 * Next.js Instrumentation Hook
 * This file runs once when the server starts up.
 * Used for automatic privacy level migration.
 */

import { PrismaClient } from '@prisma/client';

const MIGRATION_VERSION = 'privacy-levels-v1';

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await migratePrivacyLevels();
  }
}

/**
 * Automatically migrate privacy levels from old to new naming - RUNS ONLY ONCE:
 * - Old 'public' -> New 'registered' (visible to all registered users)
 * - Keep 'private' and 'shared' as is
 * - New 'public' level (visible to everyone including unregistered users) will be set manually by users
 * 
 * This migration runs automatically on server startup but only executes once.
 * A database record is created after successful migration to prevent re-running.
 */
async function migratePrivacyLevels() {
  const prisma = new PrismaClient();
  
  try {
    // Ensure schema_migrations table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        applied_at TIMESTAMP(6) DEFAULT NOW()
      )
    `);
    
    // Check if migration has already been completed
    let existingMigration;
    try {
      existingMigration = await prisma.schemaMigration.findUnique({
        where: { version: MIGRATION_VERSION },
      });
    } catch (error) {
      // Table might not exist yet, continue with migration
      existingMigration = null;
    }

    if (existingMigration) {
      console.log('[Privacy Migration] Migration already completed. Skipping.');
      return;
    }
    
    console.log('[Privacy Migration] Starting one-time migration...');
    
    // Find all prompts with privacy='public' (old meaning: registered users only)
    const publicPromptsCount = await prisma.prompt.count({
      where: {
        privacy: 'public',
      },
    });

    if (publicPromptsCount === 0) {
      console.log('[Privacy Migration] No prompts to migrate.');
    } else {
      console.log(`[Privacy Migration] Found ${publicPromptsCount} prompts with privacy='public' to migrate`);

      // Update all 'public' prompts to 'registered'
      const result = await prisma.prompt.updateMany({
        where: {
          privacy: 'public',
        },
        data: {
          privacy: 'registered',
        },
      });

      console.log(`[Privacy Migration] Successfully migrated ${result.count} prompts from 'public' to 'registered'`);
      
      // Verify the migration
      const verifyRegistered = await prisma.prompt.count({
        where: { privacy: 'registered' },
      });
      
      const verifyPublic = await prisma.prompt.count({
        where: { privacy: 'public' },
      });

      console.log(`[Privacy Migration] Verification: ${verifyRegistered} registered, ${verifyPublic} public`);
    }
    
    // Record migration as completed in database
    await prisma.schemaMigration.create({
      data: {
        version: MIGRATION_VERSION,
        description: 'Migrate privacy levels: rename public to registered for existing prompts',
      },
    });
    
    console.log('[Privacy Migration] Migration completed successfully! Will not run again.');
    
  } catch (error) {
    console.error('[Privacy Migration] Error during migration:', error);
    console.error('[Privacy Migration] Migration will be retried on next startup.');
    // Don't create migration record on error - allow retry on next startup
  } finally {
    await prisma.$disconnect();
  }
}
