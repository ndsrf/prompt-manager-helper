/**
 * Next.js Instrumentation Hook
 * This file runs once when the server starts up.
 * Used for automatic privacy level migration.
 */

import { PrismaClient } from '@prisma/client';

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await migratePrivacyLevels();
  }
}

/**
 * Automatically migrate privacy levels from old to new naming:
 * - Old 'public' -> New 'registered' (visible to all registered users)
 * - Keep 'private' and 'shared' as is
 * - New 'public' level (visible to everyone including unregistered users) will be set manually by users
 * 
 * This migration runs automatically on server startup and is idempotent.
 */
async function migratePrivacyLevels() {
  const prisma = new PrismaClient();
  
  try {
    console.log('[Privacy Migration] Checking for prompts to migrate...');
    
    // Find all prompts with privacy='public' (old meaning: registered users only)
    const publicPromptsCount = await prisma.prompt.count({
      where: {
        privacy: 'public',
      },
    });

    if (publicPromptsCount === 0) {
      console.log('[Privacy Migration] No prompts to migrate. Skipping.');
      return;
    }

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
    console.log('[Privacy Migration] Migration completed successfully!');
  } catch (error) {
    console.error('[Privacy Migration] Error during migration:', error);
    // Don't throw - let the app continue to start even if migration fails
    // The migration is idempotent and will be retried on next startup
  } finally {
    await prisma.$disconnect();
  }
}
