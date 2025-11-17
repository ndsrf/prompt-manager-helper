/**
 * Migration script to update privacy levels from old to new naming:
 * - Old 'public' -> New 'registered' (visible to all registered users)
 * - Keep 'private' and 'shared' as is
 * - New 'public' level (visible to everyone including unregistered users) will be set manually by users
 * 
 * This should be run ONCE before deploying the new code to production.
 * 
 * Usage: npx tsx scripts/migrate-privacy-levels.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting privacy level migration...');
  
  try {
    // Find all prompts with privacy='public' (old meaning: registered users only)
    const publicPrompts = await prisma.prompt.findMany({
      where: {
        privacy: 'public',
      },
      select: {
        id: true,
        title: true,
        privacy: true,
      },
    });

    console.log(`Found ${publicPrompts.length} prompts with privacy='public' to migrate`);

    if (publicPrompts.length === 0) {
      console.log('No prompts to migrate. Migration complete!');
      return;
    }

    // Update all 'public' prompts to 'registered'
    const result = await prisma.prompt.updateMany({
      where: {
        privacy: 'public',
      },
      data: {
        privacy: 'registered',
      },
    });

    console.log(`Successfully migrated ${result.count} prompts from 'public' to 'registered'`);
    
    // Verify the migration
    const verifyRegistered = await prisma.prompt.count({
      where: { privacy: 'registered' },
    });
    
    const verifyPublic = await prisma.prompt.count({
      where: { privacy: 'public' },
    });

    console.log(`\nVerification:`);
    console.log(`- Prompts with privacy='registered': ${verifyRegistered}`);
    console.log(`- Prompts with privacy='public': ${verifyPublic}`);
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
