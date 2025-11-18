# Privacy Level Implementation - Change Summary

## Overview
This document describes the implementation of the new privacy level system with four access levels instead of three.

## Privacy Levels

### Before (3 levels)
1. **Private**: Only visible to the owner
2. **Shared**: Shared with specific users  
3. **Public**: Visible to all registered users in the gallery

### After (4 levels)
1. **Private**: Only visible to the owner
2. **Shared**: Shared with specific users
3. **Registered**: Visible to all registered users in the gallery (renamed from old "Public")
4. **Public**: Visible to everyone including unregistered users (NEW)

## Implementation Changes

### Backend Changes

#### 1. tRPC Routers (`src/server/api/routers/`)

**prompt.ts**
- Updated privacy enum from `['private', 'shared', 'public']` to `['private', 'shared', 'registered', 'public']`
- Changed `getPublic` from `protectedProcedure` to `publicProcedure` to allow unauthenticated access
- Updated `getPublic` query to show:
  - Only 'public' prompts to unauthenticated users
  - Both 'public' and 'registered' prompts to authenticated users
- Updated `getById` to allow access to both 'registered' and 'public' prompts

**comment.ts**
- Updated access checks to allow comments on both 'public' and 'registered' prompts

**share.ts**
- Added new `makeRegistered` procedure to set prompts to registered-only visibility
- Kept existing `makePublic` (now sets to fully public) and `makePrivate` procedures

#### 2. tRPC Configuration (`src/server/api/trpc.ts`)
- Already had `publicProcedure` available for unauthenticated access with rate limiting

### Frontend Changes

#### 1. Gallery Page (`src/app/gallery/`)

**page.tsx**
- Removed authentication requirement
- Gallery now accessible to everyone

**PublicGalleryClient.tsx**
- Added `useSession` to check authentication status
- Added `handleViewPrompt` function that:
  - Redirects unauthenticated users to login with callback URL
  - Allows authenticated users to view prompt details
- Shows "Login" button for unauthenticated users
- Shows "Dashboard" button for authenticated users
- Updated copy function to skip usage tracking for unauthenticated users

#### 2. Privacy Controls

**MetadataPanel.tsx** (`src/components/editor/`)
- Updated privacy dropdown to show all four levels:
  - Private (Lock icon)
  - Shared (Users icon)
  - Registered Users (Users icon)
  - Public (Globe icon)

**ShareDialog.tsx** (`src/components/sharing/`)
- Added `makeRegistered` mutation
- Updated privacy display to show "Registered Users" label for 'registered' privacy
- Added button to set prompt to "Registered" level
- Updated button labels for clarity (removed "Make" prefix)

#### 3. Other Pages

**library/new/page.tsx**
- Updated privacy enum in form schema

**library/[id]/page.tsx**
- Updated ShareDialog props type

### Database Changes

#### Prisma Schema (`prisma/schema.prisma`)
- Added documentation comments for privacy field values:
  ```
  // Values: 'private', 'shared', 'registered', 'public'
  // 'private': Only visible to the owner
  // 'shared': Shared with specific users
  // 'registered': Visible to all registered users in the gallery
  // 'public': Visible to everyone including unregistered users in the gallery
  ```

### Automatic Migration

**src/instrumentation.ts**
- Automatic migration that runs on application startup
- Migrates existing 'public' prompts to 'registered'
- Includes verification step
- Safe to run multiple times (idempotent)
- Uses Next.js instrumentation hook

**next.config.mjs**
- Enabled `instrumentationHook: true` in experimental features

The migration runs automatically when the server starts - no manual action required.

### Testing

#### E2E Tests (`tests/e2e/gallery.spec.ts`)

Added comprehensive tests covering:

1. **Unauthenticated Access**
   - Can access gallery page
   - See only public prompts (not registered ones)
   - Can copy prompts
   - Redirected to login when trying to view details

2. **Authenticated Access**
   - Can see both public and registered prompts
   - Can view prompt details
   - See dashboard button instead of login button

3. **Privacy Level Changes**
   - All four privacy levels are available in UI

## Security Considerations

### 1. Rate Limiting
- Public gallery endpoint uses `publicProcedure` which applies rate limiting
- Unauthenticated users: 20 requests/minute (anonymous tier)
- Authenticated users: Higher rate limits based on subscription

### 2. Access Control
- Unauthenticated users can only:
  - View public prompts in gallery
  - Copy public prompts
  - Cannot view full prompt details without login
- Authenticated users can:
  - View all public and registered prompts
  - View full details
  - Copy and track usage

### 3. Data Exposure
- Prompts marked as 'public' are intentionally exposed to everyone
- 'registered' prompts maintain the previous behavior (registered users only)
- No breaking changes to 'private' or 'shared' levels

## Migration Steps

### For Development/Staging

1. Pull latest code
2. Start the application - migration runs automatically on startup
3. Check logs for `[Privacy Migration]` messages
4. Verify prompts migrated correctly
5. Test gallery functionality

### For Production

1. **Backup database** (CRITICAL!)
2. Deploy new code
3. Migration runs automatically on first server startup
4. Check logs for `[Privacy Migration]` messages to verify success
5. Test gallery access as both authenticated and unauthenticated user
6. Monitor error logs for any issues

**Note**: The migration is idempotent and runs automatically on every server startup, but only migrates prompts if needed.

## User-Facing Changes

### Gallery Page
- Now accessible without login
- Unregistered users can browse and copy public prompts
- Clear distinction between public and registered-only content

### Privacy Settings
- Updated labels in privacy dropdown:
  - "Registered Users" instead of just "Public"
  - New "Public" option for truly public prompts
- ShareDialog shows three quick-access buttons:
  - Public (everyone)
  - Registered (registered users)
  - Private (only me)

## Backward Compatibility

- Existing 'private' prompts: No change
- Existing 'shared' prompts: No change
- Existing 'public' prompts: Become 'registered' (same behavior, new name)
- No breaking changes to API contracts (privacy still accepts string values)

## Rollback Plan

If issues arise:

1. Restore database from backup
2. Revert code deployment
3. Alternative: Run SQL to revert privacy values:
   ```sql
   UPDATE prompts SET privacy = 'public' WHERE privacy = 'registered';
   ```

Note: The rollback SQL will restore old naming but new code expects new naming.

## Future Enhancements

Potential improvements for future iterations:

1. Add privacy level icons in gallery cards
2. Add filter in gallery to show only public vs registered prompts
3. Add analytics to track public prompt views
4. Add prompt preview for unauthenticated users
5. Consider adding "unlisted" privacy level (accessible via link only)

## Known Limitations

1. Build may fail in restricted network environments due to Google Fonts fetch
2. Some test type errors exist (pre-existing, unrelated to this change)
3. Public prompts are fully exposed - ensure users understand this when setting privacy

## Files Changed

### Backend
- src/server/api/routers/prompt.ts
- src/server/api/routers/comment.ts
- src/server/api/routers/share.ts

### Frontend
- src/app/gallery/page.tsx
- src/app/gallery/PublicGalleryClient.tsx
- src/app/library/new/page.tsx
- src/app/library/[id]/page.tsx
- src/components/editor/MetadataPanel.tsx
- src/components/sharing/ShareDialog.tsx

### Database
- prisma/schema.prisma

### Migration & Config
- src/instrumentation.ts (automatic migration on startup)
- next.config.mjs (enable instrumentation hook)
- scripts/README.md (migration documentation)

### Tests
- tests/e2e/gallery.spec.ts
