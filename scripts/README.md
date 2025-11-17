# Privacy Level Migration

## Overview
This directory contains scripts to migrate the privacy levels from the old naming to the new naming convention.

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

## Running the Migration

**IMPORTANT**: This migration should be run ONCE before deploying the new code to production.

### Prerequisites
1. Ensure you have access to the production database
2. Take a database backup before running the migration
3. Install tsx if not already installed: `npm install -g tsx`

### Steps

1. **Backup your database** (critical!)

2. **Run the migration script:**
   ```bash
   npx tsx scripts/migrate-privacy-levels.ts
   ```

3. **Verify the results:**
   The script will output:
   - Number of prompts migrated
   - Verification counts for 'registered' and 'public' privacy levels

4. **Deploy the new code** after successful migration

## What the Script Does

1. Finds all prompts with `privacy='public'`
2. Updates them to `privacy='registered'`
3. Verifies the migration was successful

## Post-Migration

After migration:
- Existing "public" prompts will now be labeled as "Registered Users" in the UI
- Users can manually change prompts to the new "Public" level (visible to everyone) if desired
- The gallery page will be accessible to unauthenticated users
- Unauthenticated users will only see prompts with `privacy='public'`
- Authenticated users will see both `public` and `registered` prompts in the gallery

## Rollback

If you need to rollback:
```sql
UPDATE prompts SET privacy = 'public' WHERE privacy = 'registered';
```

**Note**: This will restore the old privacy naming but the new code expects the new naming convention.
