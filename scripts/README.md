# Privacy Level Migration

## Overview
This directory contains documentation about the automatic privacy level migration that occurs on application startup.

## Migration Details

### Old Privacy Levels (before migration):
- `private`: Only visible to the owner
- `shared`: Shared with specific users
- `public`: Visible to all **registered** users in the gallery

### New Privacy Levels (after migration):
- `private`: Only visible to the owner
- `shared`: Shared with specific users
- `registered`: Visible to all **registered** users in the gallery (renamed from old "public")
- `public`: Visible to **everyone** including unregistered users in the gallery (new level)

## Automatic Migration

**The migration runs automatically ONCE when the application first starts.**

The migration logic is implemented in `src/instrumentation.ts`, which uses Next.js's instrumentation hook to run code on server startup.

### What Happens on First Startup

1. The application checks if migration has already been completed (via `.privacy-migration-completed` flag file)
2. If not completed, it finds all prompts with `privacy='public'` (old meaning)
3. Updates all such prompts to `privacy='registered'`
4. Creates a flag file to mark migration as complete
5. Migration is logged to the console

**On subsequent startups:**
- The flag file exists, so migration is skipped entirely
- Console logs: "Migration already completed. Skipping."
- New prompts with `privacy='public'` (new meaning) are NOT migrated

### Migration Code

The migration is in `src/instrumentation.ts`:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await migratePrivacyLevels();
  }
}
```

### Migration Tracking

After successful migration, a record is created in the `schema_migrations` database table:
- Version: `privacy-levels-v1`
- Description: Migrate privacy levels: rename public to registered for existing prompts
- Applied timestamp

This database record:
- Prevents the migration from running again
- Persists across deployments
- Can be manually deleted from the database to force re-run if needed

### Console Output

**First startup (migration runs):**
```
[Privacy Migration] Starting one-time migration...
[Privacy Migration] Found X prompts with privacy='public' to migrate
[Privacy Migration] Successfully migrated X prompts from 'public' to 'registered'
[Privacy Migration] Verification: X registered, 0 public
[Privacy Migration] Migration completed successfully! Will not run again.
```

Or if no prompts need migration:
```
[Privacy Migration] Starting one-time migration...
[Privacy Migration] No prompts to migrate.
[Privacy Migration] Migration completed successfully! Will not run again.
```

**Subsequent startups:**
```
[Privacy Migration] Migration already completed. Skipping.
```

## Post-Migration

After migration:
- Existing "public" prompts are now labeled as "Registered Users" in the UI
- Users can manually change prompts to the new "Public" level (visible to everyone) if desired
- The gallery page is accessible to unauthenticated users
- Unauthenticated users only see prompts with `privacy='public'`
- Authenticated users see both `public` and `registered` prompts in the gallery

## Troubleshooting

### Migration Doesn't Run

If the migration doesn't run on startup:

1. **Check Next.js config** - Ensure `next.config.mjs` has:
   ```javascript
   experimental: {
     instrumentationHook: true,
   }
   ```

2. **Check environment** - The migration only runs in Node.js runtime:
   ```typescript
   if (process.env.NEXT_RUNTIME === 'nodejs')
   ```

3. **Check logs** - Look for `[Privacy Migration]` prefixed messages in server logs

### Manual Migration (If Needed)

If for some reason you need to run the migration manually:

```typescript
// Run in a Node.js REPL or script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update the prompts
await prisma.prompt.updateMany({
  where: { privacy: 'public' },
  data: { privacy: 'registered' },
});

// Mark migration as complete
await prisma.schemaMigration.create({
  data: {
    version: 'privacy-levels-v1',
    description: 'Migrate privacy levels: rename public to registered for existing prompts',
  },
});

await prisma.$disconnect();
```

Or via SQL:
```sql
-- Update the prompts
UPDATE prompts SET privacy = 'registered' WHERE privacy = 'public';

-- Mark migration as complete
INSERT INTO schema_migrations (id, version, description, applied_at)
VALUES (gen_random_uuid(), 'privacy-levels-v1', 'Migrate privacy levels: rename public to registered for existing prompts', NOW());
```

### Force Re-run Migration

To force the migration to run again:

```sql
DELETE FROM schema_migrations WHERE version = 'privacy-levels-v1';
```

## Rollback

If you need to rollback (revert to old naming):

```sql
-- Revert the prompts
UPDATE prompts SET privacy = 'public' WHERE privacy = 'registered';

-- Remove migration record
DELETE FROM schema_migrations WHERE version = 'privacy-levels-v1';
```

**Note**: This will restore the old privacy naming, but the new code expects the new naming convention. Only rollback if you're also reverting the code changes.

