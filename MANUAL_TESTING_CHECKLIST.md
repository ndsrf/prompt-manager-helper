# Manual Testing Checklist - Privacy Levels Implementation

## Prerequisites
- Application running locally or in test environment
- At least one test user account
- Database migrated with `npx tsx scripts/migrate-privacy-levels.ts`

## Test Cases

### 1. Unauthenticated User - Gallery Access

#### 1.1 Access Gallery Page
- [ ] Open browser in incognito/private mode
- [ ] Navigate to `/gallery`
- [ ] ✅ **Expected**: Page loads successfully without redirect to login
- [ ] ✅ **Expected**: See "Public Gallery" heading
- [ ] ✅ **Expected**: See "Login" button in header
- [ ] ❌ **Expected**: No "Dashboard" or "Home" button visible

#### 1.2 View Public Prompts Only
- [ ] As authenticated user, create two prompts:
  - One with privacy = "Public" (truly public)
  - One with privacy = "Registered Users"
- [ ] Log out / Open incognito window
- [ ] Navigate to `/gallery`
- [ ] ✅ **Expected**: See the "Public" prompt in the list
- [ ] ❌ **Expected**: Do NOT see the "Registered Users" prompt
- [ ] ✅ **Expected**: Can see prompt title, description, preview
- [ ] ✅ **Expected**: Can see tags and metadata

#### 1.3 Copy Public Prompt
- [ ] Find a public prompt in gallery
- [ ] Hover over the prompt card
- [ ] Click the "Copy" button (clipboard icon)
- [ ] ✅ **Expected**: Toast notification "Copied to clipboard"
- [ ] ✅ **Expected**: Prompt content is in clipboard (test by pasting)
- [ ] ℹ️ **Note**: Usage tracking is skipped for unauthenticated users

#### 1.4 View Prompt Details - Login Required
- [ ] Find a public prompt in gallery
- [ ] Hover over the prompt card
- [ ] Click the "View" button
- [ ] ✅ **Expected**: Toast notification "Login required"
- [ ] ✅ **Expected**: Redirected to `/auth/login` page
- [ ] ✅ **Expected**: URL includes callback parameter to return to the prompt

### 2. Authenticated User - Gallery Access

#### 2.1 Login and Access Gallery
- [ ] Log in with test user
- [ ] Navigate to `/gallery`
- [ ] ✅ **Expected**: See "Public Gallery" heading
- [ ] ✅ **Expected**: See "Home" or "Dashboard" button in header
- [ ] ❌ **Expected**: No "Login" button visible

#### 2.2 View All Public and Registered Prompts
- [ ] Ensure database has prompts with both "Public" and "Registered" privacy
- [ ] Navigate to `/gallery` while logged in
- [ ] ✅ **Expected**: See all prompts with privacy = "Public"
- [ ] ✅ **Expected**: See all prompts with privacy = "Registered Users"
- [ ] ❌ **Expected**: Do NOT see prompts with privacy = "Private" (unless owned by you)

#### 2.3 View Prompt Details
- [ ] Find any public or registered prompt in gallery
- [ ] Hover over the prompt card
- [ ] Click the "View" button
- [ ] ✅ **Expected**: Navigate to `/editor/{promptId}` page
- [ ] ✅ **Expected**: Can see full prompt details
- [ ] ✅ **Expected**: No login prompt

#### 2.4 Copy and Track Usage
- [ ] Find a prompt in gallery
- [ ] Click the "Copy" button
- [ ] ✅ **Expected**: Toast notification "Copied to clipboard"
- [ ] ✅ **Expected**: Prompt content in clipboard
- [ ] ✅ **Expected**: Usage is tracked in analytics (check if analytics is working)

### 3. Privacy Level Management

#### 3.1 View All Privacy Options
- [ ] Create or open a prompt you own
- [ ] Navigate to the prompt editor page
- [ ] Open the "Metadata" panel
- [ ] Find the "Privacy" dropdown
- [ ] Click to expand privacy options
- [ ] ✅ **Expected**: See 4 options:
  - Private (with Lock icon)
  - Shared (with Users icon)
  - Registered Users (with Users icon)
  - Public (with Globe icon)

#### 3.2 Change Privacy to Registered Users
- [ ] Select "Registered Users" from dropdown
- [ ] ✅ **Expected**: Toast notification "Updated"
- [ ] ✅ **Expected**: Privacy saved successfully
- [ ] Log out or use incognito window
- [ ] Navigate to `/gallery`
- [ ] ❌ **Expected**: This prompt should NOT appear (unauthenticated)
- [ ] Log in and navigate to `/gallery`
- [ ] ✅ **Expected**: This prompt should appear (authenticated)

#### 3.3 Change Privacy to Public
- [ ] Select "Public" from dropdown
- [ ] ✅ **Expected**: Toast notification "Updated"
- [ ] Log out or use incognito window
- [ ] Navigate to `/gallery`
- [ ] ✅ **Expected**: This prompt should appear (unauthenticated)
- [ ] ✅ **Expected**: Can copy the prompt

#### 3.4 Test ShareDialog Privacy Controls
- [ ] Open a prompt you own
- [ ] Click the "Share" button
- [ ] ✅ **Expected**: See current privacy status displayed
- [ ] ✅ **Expected**: See three buttons:
  - "Public" (Globe icon)
  - "Registered" (Users icon)
  - "Private" (Lock icon)
- [ ] Click "Public" button
- [ ] ✅ **Expected**: Toast "Prompt is now public"
- [ ] ✅ **Expected**: Description mentions "including unregistered users"
- [ ] Click "Registered" button
- [ ] ✅ **Expected**: Toast "Prompt visible to registered users"
- [ ] ✅ **Expected**: Description mentions "registered user can view"
- [ ] Click "Private" button
- [ ] ✅ **Expected**: Toast "Prompt is now private"
- [ ] ✅ **Expected**: All shares removed

### 4. Data Migration Verification

#### 4.1 Check Migrated Prompts
- [ ] Before migration: Query database for prompts with `privacy = 'public'`
- [ ] Run migration: `npx tsx scripts/migrate-privacy-levels.ts`
- [ ] ✅ **Expected**: Script output shows number of prompts migrated
- [ ] After migration: Query database
- [ ] ✅ **Expected**: All old 'public' prompts now have `privacy = 'registered'`
- [ ] ✅ **Expected**: No prompts with old 'public' value remain
- [ ] Navigate to `/gallery` while logged in
- [ ] ✅ **Expected**: All migrated prompts visible to authenticated users
- [ ] Log out
- [ ] ✅ **Expected**: Migrated prompts NOT visible to unauthenticated users

### 5. Access Control & Security

#### 5.1 Private Prompts Not in Gallery
- [ ] Create a prompt with privacy = "Private"
- [ ] Navigate to `/gallery` (logged in as the owner)
- [ ] ❌ **Expected**: Your private prompt should NOT appear
- [ ] ℹ️ **Note**: Private prompts only in dashboard/library, not gallery

#### 5.2 Shared Prompts Access
- [ ] Create a prompt with privacy = "Shared"
- [ ] Share it with a specific user
- [ ] Navigate to `/gallery` (as the shared-with user)
- [ ] ❌ **Expected**: Shared prompt should NOT appear in gallery
- [ ] ✅ **Expected**: Shared prompt accessible via direct link or share token

#### 5.3 Comment Access
- [ ] Create a "Public" prompt with comments enabled
- [ ] Log out
- [ ] Try to access prompt comments endpoint as unauthenticated user
- [ ] ❌ **Expected**: Commenting requires authentication
- [ ] Log in as different user
- [ ] Navigate to the public prompt
- [ ] ✅ **Expected**: Can view comments
- [ ] ✅ **Expected**: Can add comments

### 6. Edge Cases

#### 6.1 Empty Gallery
- [ ] Ensure no prompts with privacy = "Public" exist
- [ ] Navigate to `/gallery` (logged out)
- [ ] ✅ **Expected**: See "No public prompts found" message
- [ ] ✅ **Expected**: No errors or crashes

#### 6.2 Search and Filter
- [ ] Create prompts with "Public" privacy
- [ ] Navigate to `/gallery`
- [ ] Use search box to search for prompt
- [ ] ✅ **Expected**: Search works for public prompts
- [ ] Use LLM filter dropdown
- [ ] ✅ **Expected**: Filter works correctly
- [ ] Use sort options
- [ ] ✅ **Expected**: Sorting works correctly

#### 6.3 Privacy Change While Viewing
- [ ] Open a prompt in the editor
- [ ] In another tab/browser, change the prompt's privacy
- [ ] Refresh the editor page
- [ ] ✅ **Expected**: Updated privacy reflected correctly
- [ ] ✅ **Expected**: No stale data displayed

## Test Results Summary

### Date: ___________
### Tester: ___________
### Environment: ___________

| Test Case | Result | Notes |
|-----------|--------|-------|
| 1.1 - Unauthenticated Gallery Access | ☐ Pass ☐ Fail | |
| 1.2 - Public Prompts Only | ☐ Pass ☐ Fail | |
| 1.3 - Copy Public Prompt | ☐ Pass ☐ Fail | |
| 1.4 - View Requires Login | ☐ Pass ☐ Fail | |
| 2.1 - Authenticated Gallery Access | ☐ Pass ☐ Fail | |
| 2.2 - All Public+Registered | ☐ Pass ☐ Fail | |
| 2.3 - View Prompt Details | ☐ Pass ☐ Fail | |
| 2.4 - Copy with Tracking | ☐ Pass ☐ Fail | |
| 3.1 - All Privacy Options | ☐ Pass ☐ Fail | |
| 3.2 - Registered Users Privacy | ☐ Pass ☐ Fail | |
| 3.3 - Public Privacy | ☐ Pass ☐ Fail | |
| 3.4 - ShareDialog Controls | ☐ Pass ☐ Fail | |
| 4.1 - Data Migration | ☐ Pass ☐ Fail | |
| 5.1 - Private Prompts | ☐ Pass ☐ Fail | |
| 5.2 - Shared Prompts | ☐ Pass ☐ Fail | |
| 5.3 - Comment Access | ☐ Pass ☐ Fail | |
| 6.1 - Empty Gallery | ☐ Pass ☐ Fail | |
| 6.2 - Search and Filter | ☐ Pass ☐ Fail | |
| 6.3 - Privacy Change While Viewing | ☐ Pass ☐ Fail | |

### Issues Found:
1. 
2. 
3. 

### Notes:
