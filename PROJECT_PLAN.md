# PromptEasy - LLM Prompt Management System
## Project Planning Document

**Version:** 1.0
**Date:** 2025-10-11
**Project Type:** Web Application + Chrome Extension
**Deployment:** LXC Container on Proxmox

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Pricing & User Tiers](#pricing--user-tiers)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [Features & Specifications](#features--specifications)
6. [User Stories](#user-stories)
7. [Database Schema](#database-schema)
8. [Implementation Phases](#implementation-phases)
9. [Deployment Strategy](#deployment-strategy)
10. [Security Considerations](#security-considerations)
11. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**PromptEasy** is a comprehensive prompt management system designed to help users create, organize, test, improve, and deploy prompts for various chat LLMs (ChatGPT, Claude, Gemini, etc.). The system consists of two main components:

1. **Web Application**: A full-featured SaaS platform for managing prompt libraries with folders, tags, versioning, sharing, and AI-powered improvement suggestions.

2. **Chrome Extension**: A browser extension that integrates with popular chat LLM interfaces, allowing users to quickly insert, edit, and improve prompts directly within the chat interface.

### Key Value Propositions
- Centralized prompt library accessible from web and browser extension
- AI-powered prompt improvement based on target LLM and context
- Version control for prompts with rollback capability
- Team collaboration through prompt sharing and organizations
- Cross-platform compatibility and export options
- Enterprise-grade organization management

---

## Pricing & User Tiers

**PromptEasy** operates on a freemium model with three tiers designed to serve individual users, professionals, and enterprise teams.

### Free Tier

**Target Audience**: Individual users and those trying the platform

**Features**:
- Up to 50 prompts
- Basic folder organization (up to 3 levels)
- Tags and search
- Chrome extension access
- Basic prompt editor
- Version history (last 5 versions per prompt)
- AI improvements (5 per month)
- Export to JSON/Markdown
- Community prompt gallery (view only)

**Price**: Free forever

---

### Pro Tier

**Target Audience**: Power users, freelancers, and professionals

**Features**:
- **Everything in Free, plus:**
- Unlimited prompts
- Unlimited folder nesting (up to 5 levels)
- Full version history
- Unlimited AI improvements
- Advanced analytics and usage tracking
- Priority support
- Export to all formats (JSON, Markdown, CSV, PDF)
- Public prompt sharing
- Collaboration with up to 5 users per prompt
- Custom tags with colors
- Prompt templates
- Testing interface with LLM integration

**Price**: $9/month or $90/year (save 17%)

---

### Enterprise Tier ⭐

**Target Audience**: Teams, agencies, and organizations

**Features**:
- **Everything in Pro, plus:**
- **Organization Management**
  - Create and manage multiple organizations
  - Invite users to organizations via email
  - User invitation system (must accept to join)
  - Users can belong to multiple organizations
  - Organization-wide shared folders
  - Centralized prompt library per organization
  - Role-based access control (Owner, Admin, Member, Viewer)
- **Advanced Collaboration**
  - Real-time co-editing (future feature)
  - Organization-level templates
  - Shared variable libraries
  - Team activity dashboard
- **Enterprise Security**
  - Okta SSO integration
  - SAML 2.0 support
  - Advanced audit logs
  - Custom data retention policies
  - IP whitelisting
- **Dedicated Support**
  - Priority email support
  - Dedicated account manager (50+ seats)
  - Custom onboarding and training
  - SLA guarantees
- **Custom Limits**
  - Unlimited organization members
  - Unlimited shared folders
  - Custom storage limits
  - Custom API rate limits

**Price**:
- $29/user/month (billed monthly, minimum 5 users)
- $290/user/year (billed annually, minimum 5 users, save 17%)
- Custom pricing for 50+ users

**Note**: Only Enterprise users can create organizations. Once created, they can invite any user (Free or Pro) to join their organization.

---

### Feature Comparison Matrix

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Prompts** | 50 | Unlimited | Unlimited |
| **Folder Levels** | 3 | 5 | 5 |
| **Version History** | Last 5 | Unlimited | Unlimited |
| **AI Improvements** | 5/month | Unlimited | Unlimited |
| **Chrome Extension** | ✓ | ✓ | ✓ |
| **Export Formats** | JSON, MD | All formats | All formats |
| **Analytics** | Basic | Advanced | Advanced + Team |
| **Collaboration** | - | Up to 5 users | Unlimited |
| **Organizations** | - | - | ✓ Create & Manage |
| **Join Organizations** | View only | ✓ Full access | ✓ Full access |
| **Okta SSO** | - | - | ✓ |
| **Audit Logs** | - | - | ✓ |
| **Priority Support** | - | Email | Email + Phone |
| **SLA** | - | - | 99.9% uptime |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
├──────────────────────────┬──────────────────────────────────┤
│   Web Application        │    Chrome Extension              │
│   (Next.js Frontend)     │    (React + Chrome APIs)         │
│   - Prompt Management    │    - Content Scripts             │
│   - Prompt Editor        │    - Popup UI                    │
│   - Testing Interface    │    - Background Service          │
└──────────────┬───────────┴───────────┬──────────────────────┘
               │                       │
               │   HTTPS/WSS          │
               │                       │
┌──────────────┴───────────────────────┴──────────────────────┐
│                      APPLICATION TIER                        │
│              Next.js + tRPC API + NextAuth.js                │
├──────────────────────────────────────────────────────────────┤
│  API Routes          │  Authentication    │  AI Service      │
│  - Prompt CRUD       │  - Email/Password  │  - OpenAI API    │
│  - Version Control   │  - Google OAuth    │  - Anthropic API │
│  - Import/Export     │  - Okta OAuth      │  - Improvement   │
│  - Sharing           │  - JWT Sessions    │    Suggestions   │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
┌──────────────┴───────────────────────┴──────────────────────┐
│                        DATA TIER                             │
├──────────────────────────┬───────────────────────────────────┤
│   PostgreSQL Database    │      Redis Cache                  │
│   - Users & Auth         │      - Sessions                   │
│   - Prompts & Versions   │      - Rate Limiting              │
│   - Tags & Folders       │      - API Cache                  │
│   - Sharing & Permissions│                                   │
└──────────────────────────┴───────────────────────────────────┘
```

### Component Breakdown

#### 1. Web Application (Frontend)
- **Framework**: Next.js 14+ with App Router
- **Purpose**: Primary interface for prompt management
- **Key Pages**:
  - `/` - Landing page
  - `/dashboard` - User dashboard with prompt overview
  - `/library` - Prompt library with folders and tags
  - `/editor/:id` - Prompt editor with testing interface
  - `/history` - Prompt history and versions
  - `/shared` - Shared prompts from other users
  - `/settings` - User settings and preferences
  - `/billing` - Subscription and billing management
  - `/organizations` - List of user's organizations
  - `/organizations/:slug` - Organization dashboard
  - `/organizations/:slug/members` - Organization member management
  - `/organizations/:slug/settings` - Organization settings
  - `/organizations/:slug/analytics` - Organization analytics
  - `/invitations/:token` - Accept organization invitation

#### 2. Chrome Extension
- **Manifest Version**: V3
- **Components**:
  - **Popup**: Quick access to prompt library
  - **Content Scripts**: Inject into LLM chat interfaces
  - **Background Service Worker**: Handle API calls and state
  - **Options Page**: Extension settings

#### 3. Backend API
- **Type**: Next.js API routes with tRPC
- **Responsibilities**:
  - User authentication and authorization
  - Subscription management and billing (Stripe)
  - CRUD operations for prompts
  - Version control management
  - Import/export functionality
  - Sharing and permissions
  - Organization management and RBAC
  - Member invitation system
  - AI service integration

#### 4. Database Layer
- **Primary Database**: PostgreSQL
  - Structured data (users, prompts, versions)
  - ACID compliance for data integrity
  - Full-text search capabilities

- **Cache Layer**: Redis
  - Session management
  - Rate limiting
  - API response caching

---

## Technology Stack

### Frontend (Web Application)

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Next.js 14+** | React framework | SSR, App Router, API routes, excellent performance |
| **TypeScript** | Type safety | Catch errors early, better DX, maintainability |
| **Tailwind CSS** | Styling | Utility-first, rapid development, consistent design |
| **Shadcn UI** | Component library | Accessible, customizable, modern design |
| **React Query (TanStack Query)** | Data fetching | Caching, synchronization, optimistic updates |
| **tRPC** | Type-safe API | End-to-end type safety, no code generation |
| **Zustand** | State management | Lightweight, simple API, perfect for global state |
| **React Hook Form** | Form handling | Performance, validation, great DX |
| **Zod** | Schema validation | Type-safe validation, works with TypeScript |
| **CodeMirror 6** | Code editor | Syntax highlighting for prompts, extensible |
| **Framer Motion** | Animations | Smooth transitions, gesture handling |

### Chrome Extension

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **React** | UI framework | Component reusability, same as web app |
| **TypeScript** | Type safety | Consistency with web app |
| **Plasmo Framework** | Extension builder | Modern dev experience, HMR, TypeScript support |
| **Chrome Extension APIs** | Browser integration | Manifest V3 compliance |
| **Tailwind CSS** | Styling | Consistency with web app |

### Backend

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Next.js API Routes** | API endpoints | Integrated with frontend, serverless-ready |
| **tRPC** | API layer | Type-safe, no REST boilerplate |
| **Prisma** | ORM | Type-safe database queries, migrations |
| **NextAuth.js** | Authentication | OAuth support, session management |
| **Bcrypt** | Password hashing | Industry standard, secure |
| **JWT** | Token management | Stateless authentication |

### Database & Infrastructure

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **PostgreSQL 15+** | Primary database | Robust, ACID compliant, full-text search |
| **Redis 7+** | Caching & sessions | Fast, reliable, widely supported |
| **Docker** | Containerization | Consistent environments, easy deployment |
| **Nginx** | Reverse proxy | SSL termination, load balancing |
| **PM2** | Process manager | Auto-restart, clustering, monitoring |

### AI & External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **OpenAI API** | Prompt improvement | GPT-4 for analysis and suggestions |
| **Anthropic API** | Prompt improvement | Claude for context-aware improvements |
| **Google OAuth** | Authentication | Social login |
| **Okta** | Enterprise auth | SSO for organizations |
| **Stripe** | Payment processing | Subscription management, billing, invoicing |

### Development Tools

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **Commitlint** | Commit message standards |
| **Jest** | Unit testing |
| **Playwright** | E2E testing |

---

## Features & Specifications

### 1. Authentication & User Management

#### Features
- Email/password registration and login
- Google OAuth integration
- Okta SSO integration
- Email verification
- Password reset flow
- Two-factor authentication (2FA) - optional
- Session management
- User profile management

#### Technical Details
- NextAuth.js for auth orchestration
- Bcrypt for password hashing (12 rounds)
- JWT tokens for API authentication
- Refresh token rotation
- Rate limiting on auth endpoints (5 attempts per 15 minutes)

---

### 2. Prompt Library

#### Features
- **Folder Organization**
  - Create/rename/delete folders
  - Nested folder structure (up to 5 levels)
  - Drag-and-drop to organize
  - Folder sharing with permissions

- **Tagging System**
  - Create custom tags
  - Multiple tags per prompt
  - Tag-based filtering
  - Tag autocomplete
  - Tag usage statistics

- **Search & Filter**
  - Full-text search across prompts
  - Filter by tags, folders, date
  - Sort by name, date, usage
  - Recent prompts
  - Favorites/starred prompts

- **Bulk Operations**
  - Multi-select prompts
  - Bulk move to folder
  - Bulk tag operations
  - Bulk export
  - Bulk delete with confirmation

#### Technical Details
- PostgreSQL full-text search with GIN indexes
- Nested set model for folder hierarchy
- Many-to-many relationship for tags
- Soft delete for recovery
- Activity logging for all operations

---

### 3. Prompt Editor

#### Features
- **Rich Text Editor**
  - Syntax highlighting for variables ({{variable}})
  - Template variable suggestions
  - Character/token counter
  - Markdown preview
  - Code block support
  - Auto-save (every 30 seconds)

- **Metadata Fields**
  - Title
  - Description
  - Target LLM (ChatGPT, Claude, Gemini, etc.)
  - Category/Tags
  - Privacy settings (private/shared/public)
  - Variables definition

- **Testing Interface**
  - Live chat interface for testing
  - Variable substitution
  - Multiple test runs
  - Save test results
  - Compare prompt versions

- **AI Improvement Engine**
  - Analyze prompt structure
  - Suggest improvements based on target LLM
  - Context-aware optimizations
  - Clarity and effectiveness scoring
  - Before/after comparison

#### Technical Details
- CodeMirror 6 for editor
- WebSocket connection for live testing
- AI analysis via OpenAI/Anthropic APIs
- Token counting using tiktoken
- Diff view for version comparison

---

### 4. Prompt Versioning

#### Features
- Automatic version creation on save
- Manual version snapshots
- Version history view
- Side-by-side diff comparison
- Restore previous versions
- Version annotations/notes
- Branch from version

#### Technical Details
- PostgreSQL JSONB for storing versions
- Diff algorithm for change detection
- Immutable version storage
- Metadata: timestamp, user, change summary

---

### 5. Prompt History & Usage Analytics

#### Features
- Complete history of all prompts used
- Usage frequency tracking
- Success/failure tracking
- Time-based analytics
- Most used prompts
- LLM-specific analytics

#### Technical Details
- Time-series data in PostgreSQL
- Aggregated statistics with materialized views
- Redis caching for hot data

---

### 6. Prompt Sharing & Collaboration

#### Features
- **Sharing Options**
  - Share with specific users
  - Generate shareable links
  - Public prompt gallery
  - Team/workspace sharing

- **Permissions**
  - View-only
  - Can edit
  - Can comment
  - Admin (full control)

- **Collaboration**
  - Comments on prompts
  - Mention users (@username)
  - Activity feed
  - Change notifications

#### Technical Details
- Row-level security in database
- UUID-based share links
- Permission inheritance from folders
- Real-time updates via WebSocket

---

### 7. Import/Export

#### Features
- **Import Formats**
  - JSON (structured)
  - Markdown files
  - CSV (bulk import)
  - Plain text
  - From URL

- **Export Formats**
  - JSON (with metadata)
  - Markdown (formatted)
  - CSV (bulk data)
  - Plain text
  - PDF (styled document)

- **Bulk Operations**
  - Export entire library
  - Export by folder/tag
  - Import with folder mapping
  - Duplicate detection

#### Technical Details
- Streaming for large exports
- Background jobs for bulk operations
- Validation and error reporting
- Schema versioning for imports

---

### 8. Chrome Extension

#### Features
- **Popup Interface**
  - Quick search prompts
  - Recent prompts
  - Favorites
  - Create new prompt
  - Extension settings

- **Content Script Features**
  - Detect LLM chat interfaces (ChatGPT, Claude, Bard, etc.)
  - Inject prompt selector button
  - Insert prompt into input field
  - Improve current prompt
  - Save current prompt to library
  - Copy prompt to clipboard
  - Variable substitution UI

- **AI Features in Extension**
  - Analyze current chat context
  - Suggest relevant prompts
  - Improve prompt before sending
  - Adapt prompt for specific LLM

- **Offline Support**
  - Cache recent prompts
  - Sync when online
  - Conflict resolution

#### Technical Details
- Content scripts for DOM manipulation
- MutationObserver for dynamic loading
- Chrome Storage API for caching
- Service Worker for background sync
- Message passing for communication

---

### 9. Organization Management (Enterprise Tier)

#### Features
- **Organization Creation & Settings**
  - Create unlimited organizations (Enterprise users only)
  - Organization name, slug, description, avatar
  - Organization-wide settings and policies
  - Transfer ownership
  - Delete organization

- **Member Management**
  - Email-based invitation system
  - Invitation must be accepted before joining
  - Users identified by email address
  - Users can belong to multiple organizations
  - Pending, active, and removed status tracking
  - Resend or revoke invitations

- **Role-Based Access Control**
  - **Owner**: Full control including ownership transfer and deletion
  - **Admin**: Manage members, all prompt operations, view analytics
  - **Member**: Create and edit own prompts, view shared prompts, comment
  - **Viewer**: Read-only access, can copy to personal library

- **Shared Folders & Prompts**
  - Organization-specific folder structure
  - Shared prompt library accessible to all members
  - Separate from personal prompt libraries
  - Permission inheritance from folders
  - Track creator and last editor for all prompts

- **Organization Analytics**
  - Team usage dashboard
  - Member activity tracking
  - Most used prompts
  - Prompt creation statistics
  - LLM usage breakdown
  - Export analytics reports

- **Organization Switcher**
  - Dropdown to switch between organizations
  - Shows all organizations user belongs to
  - Display user's role in each organization
  - Quick access to organization settings

#### Technical Details
- Row-level security for organization data
- UUID-based invitation tokens
- Email notifications for invitations and membership changes
- Permission middleware on all API endpoints
- Cascade delete policies for organization cleanup
- Activity logging for audit trails

---

## User Stories

### Authentication & Onboarding

**Epic 1: User Registration & Login**

1. **US-101**: As a new user, I want to register with my email and password so that I can create an account.
   - **Acceptance Criteria**:
     - Email validation (format check)
     - Password strength requirements (8+ chars, uppercase, lowercase, number)
     - Email verification sent
     - Account created but inactive until verified

2. **US-102**: As a user, I want to log in with my Google account so that I can access the platform quickly.
   - **Acceptance Criteria**:
     - Google OAuth button on login page
     - Redirect to Google for authentication
     - Auto-create account on first login
     - Redirect to dashboard after successful login

3. **US-103**: As an enterprise user, I want to log in with my Okta credentials so that I can use my company SSO.
   - **Acceptance Criteria**:
     - Okta SSO configuration per organization
     - Redirect to Okta login
     - Map Okta attributes to user profile
     - Support for multiple Okta tenants

4. **US-104**: As a user, I want to reset my password if I forget it so that I can regain access to my account.
   - **Acceptance Criteria**:
     - "Forgot password" link on login page
     - Email with reset link (expires in 1 hour)
     - Secure token validation
     - Set new password and log in

---

### Prompt Management

**Epic 2: Prompt Library & Organization**

5. **US-201**: As a user, I want to create folders to organize my prompts so that I can keep them structured.
   - **Acceptance Criteria**:
     - Create folder with name and description
     - Nest folders up to 5 levels deep
     - Rename and delete folders
     - Move prompts between folders

6. **US-202**: As a user, I want to add tags to my prompts so that I can categorize and find them easily.
   - **Acceptance Criteria**:
     - Add multiple tags to a prompt
     - Create new tags on the fly
     - Tag autocomplete suggestions
     - Remove tags from prompts

7. **US-203**: As a user, I want to search for prompts by keyword so that I can quickly find what I need.
   - **Acceptance Criteria**:
     - Search bar in library view
     - Full-text search across title, description, content
     - Highlight search terms in results
     - Search results sorted by relevance

8. **US-204**: As a user, I want to filter prompts by tags and folders so that I can browse specific categories.
   - **Acceptance Criteria**:
     - Filter sidebar with tag list
     - Multi-select tags (AND/OR logic)
     - Filter by folder hierarchy
     - Clear filters button

9. **US-205**: As a user, I want to star/favorite prompts so that I can quickly access my most-used prompts.
   - **Acceptance Criteria**:
     - Star icon on each prompt
     - "Favorites" section in library
     - Toggle star on/off
     - Sort by starred status

---

**Epic 3: Prompt Creation & Editing**

10. **US-301**: As a user, I want to create a new prompt with title and content so that I can save it to my library.
    - **Acceptance Criteria**:
      - "New Prompt" button in library
      - Form with title, description, content fields
      - Select target LLM
      - Assign to folder and add tags
      - Save and redirect to editor

11. **US-302**: As a user, I want to edit my prompts with a rich text editor so that I can format them properly.
    - **Acceptance Criteria**:
      - Syntax highlighting for variables
      - Markdown support
      - Line numbers
      - Auto-save every 30 seconds
      - Character and token counter

12. **US-303**: As a user, I want to use variables in my prompts (e.g., {{name}}) so that I can create reusable templates.
    - **Acceptance Criteria**:
      - Variable syntax highlighting
      - Define variables in metadata
      - Variable type (text, number, select)
      - Default values for variables
      - Variable substitution preview

13. **US-304**: As a user, I want to test my prompt with a chat interface so that I can see how it performs.
    - **Acceptance Criteria**:
      - "Test" button in editor
      - Chat interface in side panel
      - Fill in variables before testing
      - Send to selected LLM
      - Display response
      - Save test results

14. **US-305**: As a user, I want AI-powered suggestions to improve my prompt so that I can make it more effective.
    - **Acceptance Criteria**:
      - "Improve" button in editor
      - Analyze prompt structure
      - Generate improvement suggestions
      - Show before/after comparison
      - Apply suggestions with one click
      - Effectiveness score (0-100)

---

**Epic 4: Versioning & History**

15. **US-401**: As a user, I want to see the version history of my prompts so that I can track changes.
    - **Acceptance Criteria**:
      - "History" tab in editor
      - List all versions with timestamp
      - Show who made the change
      - Version annotations/notes
      - Diff view for changes

16. **US-402**: As a user, I want to restore a previous version of a prompt so that I can undo unwanted changes.
    - **Acceptance Criteria**:
      - "Restore" button on each version
      - Confirmation dialog
      - Create new version from restored content
      - Preserve current version in history

17. **US-403**: As a user, I want to create manual snapshots of my prompts so that I can mark important versions.
    - **Acceptance Criteria**:
      - "Create snapshot" button
      - Add annotation/description
      - Snapshots marked differently in history
      - Cannot be auto-deleted

---

**Epic 5: Sharing & Collaboration**

18. **US-501**: As a user, I want to share a prompt with specific users so that we can collaborate.
    - **Acceptance Criteria**:
      - "Share" button in editor
      - Enter email addresses or usernames
      - Select permission level (view/edit/admin)
      - Send notification to shared users
      - Shared users see prompt in their library

19. **US-502**: As a user, I want to generate a shareable link for a prompt so that I can share it publicly.
    - **Acceptance Criteria**:
      - "Generate link" button
      - UUID-based URL
      - Set expiration (optional)
      - Set permission (view-only/editable)
      - Copy link to clipboard

20. **US-503**: As a user, I want to comment on shared prompts so that I can give feedback.
    - **Acceptance Criteria**:
      - Comments section in editor
      - Add comment with text
      - Mention users (@username)
      - Reply to comments (threaded)
      - Notifications for mentions and replies

21. **US-504**: As a user, I want to browse public prompts from the community so that I can discover useful prompts.
    - **Acceptance Criteria**:
      - "Public Gallery" section
      - Browse by category/tag
      - Search public prompts
      - Preview before copying
      - Copy to my library

---

**Epic 6: Import & Export**

22. **US-601**: As a user, I want to export my prompts to JSON so that I can back them up.
    - **Acceptance Criteria**:
      - "Export" button in library
      - Select prompts to export
      - JSON format with all metadata
      - Download file
      - Export entire library option

23. **US-602**: As a user, I want to export prompts to Markdown so that I can use them in documentation.
    - **Acceptance Criteria**:
      - Select Markdown format in export
      - Formatted with title, description, content
      - Variables documented
      - Include metadata as frontmatter

24. **US-603**: As a user, I want to import prompts from JSON so that I can restore backups or migrate.
    - **Acceptance Criteria**:
      - "Import" button in library
      - Upload JSON file
      - Validate schema
      - Preview prompts before import
      - Handle duplicates (skip/overwrite/create new)
      - Map to folders

25. **US-604**: As a user, I want to import prompts from Markdown files so that I can use existing documentation.
    - **Acceptance Criteria**:
      - Upload single or multiple .md files
      - Parse frontmatter for metadata
      - Extract title and content
      - Auto-create folders from file structure
      - Error reporting for invalid files

---

### Chrome Extension

**Epic 7: Extension Core Features**

26. **US-701**: As a user, I want to access my prompt library from the Chrome extension popup so that I can quickly find prompts.
    - **Acceptance Criteria**:
      - Extension icon in Chrome toolbar
      - Click to open popup
      - Search bar and recent prompts
      - Click prompt to see details
      - Categories and favorites

27. **US-702**: As a user, I want to insert a prompt into a chat LLM interface so that I don't have to copy-paste.
    - **Acceptance Criteria**:
      - Detect ChatGPT, Claude, Bard interfaces
      - Inject button near input field
      - Click to open prompt selector
      - Select prompt and insert into input
      - Variables filled via modal

28. **US-703**: As a user, I want to improve the current prompt in my chat interface so that I get better results.
    - **Acceptance Criteria**:
      - "Improve" button near input field
      - Analyze current input text
      - Consider chat context (previous messages)
      - Generate improved version
      - Replace current input with improved version

29. **US-704**: As a user, I want to save the current prompt from chat interface to my library so that I can reuse it later.
    - **Acceptance Criteria**:
      - "Save to library" button
      - Capture current input text
      - Modal to add title, folder, tags
      - Save to library via API
      - Confirmation message

30. **US-705**: As a user, I want to copy a prompt to clipboard from the extension so that I can paste it anywhere.
    - **Acceptance Criteria**:
      - "Copy" button on each prompt
      - Copy prompt content with variables filled
      - Visual feedback (toast notification)
      - Paste works in any application

---

**Epic 8: Extension AI Features**

31. **US-801**: As a user, I want the extension to suggest relevant prompts based on my current chat context so that I can work more efficiently.
    - **Acceptance Criteria**:
      - Analyze current chat messages
      - Detect topic/intent
      - Show 3-5 relevant prompts
      - Ranked by relevance
      - One-click insert

32. **US-802**: As a user, I want the extension to adapt my prompt for the specific LLM I'm using so that it's optimized.
    - **Acceptance Criteria**:
      - Auto-detect LLM (ChatGPT, Claude, etc.)
      - Adjust prompt formatting
      - Add LLM-specific instructions
      - Show adapted version before inserting
      - Option to save adapted version

---

### Analytics & Insights

**Epic 9: Usage Analytics**

33. **US-901**: As a user, I want to see which prompts I use most often so that I can optimize my workflow.
    - **Acceptance Criteria**:
      - Dashboard with usage stats
      - Top 10 most-used prompts
      - Usage frequency graph (daily/weekly/monthly)
      - Filter by date range
      - Export stats to CSV

34. **US-902**: As a user, I want to track the success rate of my prompts so that I can identify what works.
    - **Acceptance Criteria**:
      - Thumbs up/down on test results
      - Success rate percentage per prompt
      - Filter by LLM
      - Identify underperforming prompts
      - Suggestions for improvement

---

### Enterprise Features

**Epic 10: Organization Management** (Enterprise Tier Only)

35. **US-1001**: As an Enterprise user, I want to create an organization so that I can manage my team's prompts.
    - **Acceptance Criteria**:
      - "Create Organization" button in dashboard (Enterprise users only)
      - Form with organization name, slug, description
      - Upload organization avatar/logo
      - Set organization settings
      - Owner automatically added as admin
      - Redirect to organization dashboard

36. **US-1002**: As an organization owner, I want to invite users to my organization via email so that they can join my team.
    - **Acceptance Criteria**:
      - "Invite Members" button in organization settings
      - Enter email addresses (comma-separated or one per line)
      - Select default role (admin, member, viewer)
      - Send invitation email with accept link
      - Track invitation status (pending, accepted, expired)
      - Resend invitation option
      - Revoke pending invitations

37. **US-1003**: As a user, I want to receive and accept invitations to organizations so that I can join teams.
    - **Acceptance Criteria**:
      - Email notification with invitation details
      - Click invitation link to accept
      - Preview organization details before accepting
      - Accept/Decline buttons
      - After accepting, organization appears in my organization list
      - Notification to organization admin upon acceptance
      - Can belong to multiple organizations

38. **US-1004**: As an organization owner/admin, I want to manage organization members so that I can control access.
    - **Acceptance Criteria**:
      - Members list with name, email, role, status
      - Search and filter members
      - Change member roles (admin, member, viewer)
      - Remove members from organization
      - View member activity (last seen, prompts created)
      - Bulk operations (change roles, remove)
      - Cannot remove organization owner

39. **US-1005**: As an organization owner, I want to create shared folders within my organization so that members can organize prompts.
    - **Acceptance Criteria**:
      - Create folder button in organization view
      - Nest folders within organization
      - Set folder permissions (who can view/edit)
      - Move folders and prompts
      - Delete folders with confirmation
      - Track folder creator and last modified

40. **US-1006**: As an organization member, I want to create prompts in shared folders so that my team can access them.
    - **Acceptance Criteria**:
      - Create prompt in organization folder
      - All organization members can view (based on permissions)
      - Track who created/modified the prompt
      - Version history with author tracking
      - Organization prompts separate from personal prompts
      - Can copy organization prompt to personal library

41. **US-1007**: As an organization member, I want to see all organizations I belong to so that I can switch between them.
    - **Acceptance Criteria**:
      - Organization switcher in navigation
      - List all organizations with name and avatar
      - Show role in each organization
      - Switch organization context
      - Separate prompt libraries per organization
      - Recent organization at top

42. **US-1008**: As an organization owner, I want to manage organization settings so that I can configure policies.
    - **Acceptance Criteria**:
      - Organization settings page
      - Update name, slug, description, avatar
      - Set default permissions for new folders
      - Configure AI improvement limits
      - Set data retention policies
      - Delete organization (with confirmation and owner-only)
      - Transfer ownership to another admin

43. **US-1009**: As an organization admin, I want to view organization analytics so that I can track team usage.
    - **Acceptance Criteria**:
      - Organization dashboard with metrics
      - Number of prompts, folders, members
      - Most active members
      - Most used prompts
      - Activity timeline
      - Usage by LLM type
      - Export analytics to CSV

44. **US-1010**: As an organization member, I want role-based permissions so that I can perform actions appropriate to my role.
    - **Acceptance Criteria**:
      - **Owner**: Full control, transfer ownership, delete org
      - **Admin**: Manage members, create/edit/delete prompts and folders, view analytics
      - **Member**: Create/edit/delete own prompts, view shared prompts, comment
      - **Viewer**: View-only access to prompts, can copy to personal library
      - Permission checks enforced on API level
      - Clear permission indicators in UI

---

## Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255), -- null for OAuth users
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    provider VARCHAR(50), -- 'email', 'google', 'okta'
    provider_id VARCHAR(255),
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    INDEX idx_email (email),
    INDEX idx_provider (provider, provider_id),
    INDEX idx_subscription (subscription_tier, subscription_status)
);

-- Subscriptions table (for billing and payment tracking)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL, -- 'free', 'pro', 'enterprise'
    status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'expired', 'trialing'
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_stripe_customer (stripe_customer_id),
    INDEX idx_stripe_subscription (stripe_subscription_id)
);

-- Organizations table (Enterprise feature)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
    description TEXT,
    avatar_url TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_owner (owner_id),
    INDEX idx_slug (slug)
);

-- Organization members table (with invitation system)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null until invitation accepted
    email VARCHAR(255) NOT NULL, -- for invitations
    role VARCHAR(20) NOT NULL, -- 'owner', 'admin', 'member', 'viewer'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'removed'
    invitation_token UUID DEFAULT gen_random_uuid(),
    invited_by UUID NOT NULL REFERENCES users(id),
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, email),
    INDEX idx_organization (organization_id),
    INDEX idx_user (user_id),
    INDEX idx_email (email),
    INDEX idx_invitation_token (invitation_token),
    INDEX idx_status (status)
);

-- Organization folders (shared folders within organizations)
CREATE TABLE organization_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES organization_folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    path TEXT, -- materialized path for hierarchy
    level INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_organization (organization_id),
    INDEX idx_parent (parent_id),
    INDEX idx_path (path)
);

-- Organization prompts (prompts owned by organization)
CREATE TABLE organization_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES organization_folders(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    target_llm VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_organization (organization_id),
    INDEX idx_folder (folder_id),
    INDEX idx_created_by (created_by)
);

-- Full-text search index for organization prompts
CREATE INDEX idx_org_prompts_fulltext ON organization_prompts
    USING gin(to_tsvector('english', title || ' ' || description || ' ' || content));

-- Folders table (hierarchical)
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    path TEXT, -- materialized path for hierarchy
    level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_folders (user_id),
    INDEX idx_parent (parent_id),
    INDEX idx_path (path)
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- hex color
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name),
    INDEX idx_user_tags (user_id)
);

-- Prompts table
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- [{name, type, default}]
    target_llm VARCHAR(50), -- 'chatgpt', 'claude', 'gemini', 'any'
    is_favorite BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    privacy VARCHAR(20) DEFAULT 'private', -- 'private', 'shared', 'public'
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_prompts (user_id),
    INDEX idx_folder (folder_id),
    INDEX idx_favorite (user_id, is_favorite),
    INDEX idx_deleted (is_deleted),
    INDEX idx_privacy (privacy)
);

-- Full-text search index
CREATE INDEX idx_prompts_fulltext ON prompts
    USING gin(to_tsvector('english', title || ' ' || description || ' ' || content));

-- Prompt tags (many-to-many)
CREATE TABLE prompt_tags (
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (prompt_id, tag_id),
    INDEX idx_prompt (prompt_id),
    INDEX idx_tag (tag_id)
);

-- Prompt versions
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    changes_summary TEXT,
    annotation TEXT, -- for manual snapshots
    is_snapshot BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prompt_versions (prompt_id, version_number DESC),
    UNIQUE (prompt_id, version_number)
);

-- Prompt sharing
CREATE TABLE prompt_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE, -- null for link shares
    share_token UUID DEFAULT gen_random_uuid(), -- for link sharing
    permission VARCHAR(20) NOT NULL, -- 'view', 'edit', 'admin'
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_shared_with (shared_with),
    INDEX idx_share_token (share_token),
    INDEX idx_prompt (prompt_id)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- for threading
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb, -- [user_ids]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prompt_comments (prompt_id),
    INDEX idx_parent (parent_id)
);

-- Usage analytics
CREATE TABLE prompt_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    llm_used VARCHAR(50),
    success BOOLEAN, -- user feedback
    context TEXT, -- chat context (truncated)
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prompt_usage (prompt_id, used_at DESC),
    INDEX idx_user_usage (user_id, used_at DESC)
);

-- Activity log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'prompt', 'folder', 'tag'
    entity_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_activity (user_id, created_at DESC),
    INDEX idx_entity (entity_type, entity_id)
);
```

---

## Implementation Phases

### Phase 1: Foundation & Infrastructure (Weeks 1-3)

**Goals**: Set up project structure, authentication, and basic infrastructure

**Tasks**:
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up PostgreSQL and Redis (Docker containers)
3. Configure Prisma ORM and create initial schema
4. Implement NextAuth.js with email/password authentication
5. Create basic UI components (layout, navigation, forms)
6. Set up tRPC for API layer
7. Implement user registration and login flows
8. Create user profile page
9. Set up testing framework (Jest + Playwright)
10. Configure CI/CD pipeline

**Deliverables**:
- Working authentication system
- Database schema implemented
- Basic UI components
- Development environment setup

---

### Phase 2: Prompt Library & Management (Weeks 4-6)

**Goals**: Build core prompt management features

**Tasks**:
1. Implement folder CRUD operations
2. Build folder tree navigation component
3. Implement tag system
4. Create prompt CRUD operations
5. Build prompt library view (list/grid)
6. Implement search functionality
7. Add filtering by tags and folders
8. Create favorites system
9. Implement bulk operations (select, move, delete)
10. Add soft delete and trash functionality

**Deliverables**:
- Fully functional prompt library
- Folder organization
- Tagging and search
- Favorites and filtering

---

### Phase 3: Prompt Editor & Testing (Weeks 7-9)

**Goals**: Build advanced editing and testing features

**Tasks**:
1. Integrate CodeMirror 6 editor
2. Implement variable syntax highlighting
3. Add variable definition UI
4. Create token counter
5. Implement auto-save functionality
6. Build testing chat interface
7. Integrate OpenAI/Anthropic APIs
8. Implement AI-powered improvement engine
9. Create diff viewer for comparisons
10. Add prompt templates

**Deliverables**:
- Rich prompt editor
- Variable support
- Testing interface
- AI improvement suggestions

---

### Phase 4: Versioning & History (Weeks 10-11)

**Goals**: Implement version control system

**Tasks**:
1. Create version tracking system
2. Implement automatic versioning on save
3. Build version history UI
4. Create diff viewer for versions
5. Implement restore functionality
6. Add manual snapshot feature
7. Create version annotations
8. Build comparison view (side-by-side)

**Deliverables**:
- Full version control system
- History viewer
- Restore functionality

---

### Phase 5: Sharing & Collaboration (Weeks 12-14)

**Goals**: Enable prompt sharing and team collaboration

**Tasks**:
1. Implement prompt sharing with users
2. Create permission system
3. Build share link generation
4. Implement comments system
5. Add mention functionality (@username)
6. Create activity feed
7. Build notification system
8. Implement public gallery
9. Add community features (likes, ratings)

**Deliverables**:
- Sharing and permissions
- Comments and collaboration
- Public gallery

---

### Phase 6: Chrome Extension (Weeks 15-18)

**Goals**: Build and integrate Chrome extension

**Tasks**:
1. Initialize Plasmo framework project
2. Build extension popup UI
3. Implement authentication in extension
4. Create prompt search and browse
5. Develop content scripts for LLM detection
6. Implement prompt insertion logic
7. Build variable substitution UI
8. Add "Save to library" feature
9. Implement AI improvement in extension
10. Add offline caching with sync
11. Build settings page
12. Test across multiple LLM interfaces (ChatGPT, Claude, Gemini)
13. Submit to Chrome Web Store

**Deliverables**:
- Fully functional Chrome extension
- Integration with web API
- Published to Chrome Web Store

---

### Phase 7: Import/Export & Advanced Features (Weeks 19-20)

**Goals**: Add import/export and polish features

**Tasks**:
1. Implement JSON export
2. Implement Markdown export
3. Add CSV export
4. Create PDF export with styling
5. Build JSON import with validation
6. Implement Markdown import
7. Add CSV bulk import
8. Create duplicate detection
9. Build import preview and mapping UI

**Deliverables**:
- Full import/export system
- Multiple format support
- Bulk operations

---

### Phase 8: Analytics & Polish (Weeks 21-22)

**Goals**: Add analytics and polish the application

**Tasks**:
1. Implement usage tracking
2. Build analytics dashboard
3. Create usage reports
4. Add success tracking
5. Implement performance optimizations
6. Conduct security audit
7. Add rate limiting
8. Implement comprehensive error handling
9. Create user documentation
10. Conduct user testing
11. Fix bugs and polish UI
12. Optimize for mobile

**Deliverables**:
- Analytics dashboard
- Polished, production-ready application
- Documentation

---

### Phase 9: OAuth Integration (Week 23)

**Goals**: Add Google and Okta authentication

**Tasks**:
1. Configure Google OAuth in NextAuth.js
2. Test Google login flow
3. Set up Okta OAuth
4. Implement multi-tenant Okta support
5. Add account linking functionality
6. Test OAuth flows end-to-end

**Deliverables**:
- Google OAuth integration
- Okta SSO integration
- Account linking

---

### Phase 10: Billing & Organization Management (Weeks 24-26)

**Goals**: Implement subscription billing and enterprise organization features

**Tasks**:
1. Integrate Stripe for payment processing
2. Implement subscription management (Free/Pro/Enterprise tiers)
3. Create billing dashboard for users
4. Implement usage limits per tier
5. Build organization creation and management
6. Implement invitation system with email notifications
7. Create organization member management UI
8. Build organization folders and shared prompts
9. Implement role-based access control (RBAC)
10. Create organization switcher UI
11. Build organization analytics dashboard
12. Implement permission middleware for all API endpoints
13. Test organization workflows end-to-end
14. Create organization onboarding flow

**Deliverables**:
- Stripe integration for subscriptions
- Full organization management system
- Role-based access control
- Organization analytics

---

### Phase 11: Deployment & Launch (Week 27)

**Goals**: Deploy to production on LXC/Proxmox

**Tasks**:
1. Set up LXC container on Proxmox
2. Configure Docker and Docker Compose
3. Set up Nginx reverse proxy with SSL
4. Configure domain and DNS
5. Set up PostgreSQL and Redis in production
6. Deploy application
7. Configure PM2 for process management
8. Set up monitoring (logs, performance)
9. Configure automated backups
10. Perform load testing
11. Create runbook for operations
12. Launch to beta users
13. Monitor and fix issues
14. Public launch

**Deliverables**:
- Production deployment on LXC
- Monitoring and backups
- Public launch

### Phase 12: Extra features (Week 28)

**Goals**: Add functionality to make it easier for users to use the application

**Tasks**:
1. Create a user profile page to select avatar, username, bio
2. Add "Custom instructions" to the profile page, to add details you want the AI to know about you and specify how you would like it to format its responses.

**Deliverables**:
- User profile page

---

## Deployment Strategy

### LXC Container Setup on Proxmox

#### Container Specifications

```
OS: Ubuntu 22.04 LTS
CPU: 4 cores (adjust based on load)
RAM: 8GB (adjust based on load)
Storage: 50GB (adjust for database growth)
Network: Bridge to host network
```

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Proxmox Host                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              LXC Container (Ubuntu 22.04)              │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │               Nginx (Reverse Proxy)              │ │ │
│  │  │         - SSL/TLS Termination                     │ │ │
│  │  │         - Load Balancing                          │ │ │
│  │  │         - Static File Serving                     │ │ │
│  │  └────────────────┬─────────────────────────────────┘ │ │
│  │                   │                                    │ │
│  │  ┌────────────────┴─────────────────────────────────┐ │ │
│  │  │     Next.js Application (PM2 Cluster Mode)       │ │ │
│  │  │     - 4 instances (adjust based on CPU cores)    │ │ │
│  │  └────────────────┬─────────────────────────────────┘ │ │
│  │                   │                                    │ │
│  │  ┌────────────────┴──────────┬─────────────────────┐ │ │
│  │  │                           │                      │ │ │
│  │  │  PostgreSQL 15            │   Redis 7           │ │ │
│  │  │  - Primary Database       │   - Cache           │ │ │
│  │  │  - Automated Backups      │   - Sessions        │ │ │
│  │  └───────────────────────────┴─────────────────────┘ │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: prompteasy-db
    restart: always
    environment:
      POSTGRES_USER: prompteasy
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: prompteasy
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prompteasy"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: prompteasy-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: prompteasy-app
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://prompteasy:${DB_PASSWORD}@postgres:5432/prompteasy
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NEXTAUTH_URL: https://prompteasy.yourdomain.com
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      OKTA_CLIENT_ID: ${OKTA_CLIENT_ID}
      OKTA_CLIENT_SECRET: ${OKTA_CLIENT_SECRET}
      OKTA_ISSUER: ${OKTA_ISSUER}
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "127.0.0.1:3000:3000"

  nginx:
    image: nginx:alpine
    container_name: prompteasy-nginx
    restart: always
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./public:/usr/share/nginx/html:ro
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

#### Nginx Configuration

```nginx
upstream nextjs_app {
    server app:3000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name prompteasy.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name prompteasy.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Client body size limit (for uploads)
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://nextjs_app/api/health;
        access_log off;
    }

    # Static files
    location /_next/static {
        proxy_pass http://nextjs_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

#### Deployment Steps

1. **Create LXC Container**
```bash
# On Proxmox host
pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.gz \
  --hostname prompteasy \
  --memory 8192 \
  --cores 4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --storage local-lvm \
  --rootfs local-lvm:50

pct start 100
pct enter 100
```

2. **Install Dependencies**
```bash
# Inside LXC container
apt update && apt upgrade -y
apt install -y curl git docker.io docker-compose-v2 ufw

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm pm2
```

3. **Configure Firewall**
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

4. **Clone and Deploy Application**
```bash
cd /opt
git clone <your-repo-url> prompteasy
cd prompteasy

# Copy environment variables
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker compose up -d

# Check logs
docker compose logs -f
```

5. **Set Up SSL with Let's Encrypt**
```bash
apt install -y certbot
certbot certonly --standalone -d prompteasy.yourdomain.com
cp /etc/letsencrypt/live/prompteasy.yourdomain.com/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/prompteasy.yourdomain.com/privkey.pem ./nginx/ssl/

# Auto-renewal cron job
echo "0 3 * * * certbot renew --quiet && docker compose restart nginx" | crontab -
```

6. **Set Up Database Backups**
```bash
# Create backup script
cat > /opt/prompteasy/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/prompteasy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec prompteasy-db pg_dump -U prompteasy prompteasy | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"
# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/prompteasy/backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/prompteasy/backup.sh" | crontab -
```

7. **Set Up Monitoring**
```bash
# Install monitoring tools
apt install -y htop iotop netstat

# Set up log rotation
cat > /etc/logrotate.d/prompteasy << EOF
/opt/prompteasy/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF
```

#### Environment Variables

Create `.env` file with the following:

```env
# Database
DB_PASSWORD=<secure_password>
DATABASE_URL=postgresql://prompteasy:<password>@localhost:5432/prompteasy

# Redis
REDIS_PASSWORD=<secure_password>
REDIS_URL=redis://:<password>@localhost:6379

# NextAuth
NEXTAUTH_URL=https://prompteasy.yourdomain.com
NEXTAUTH_SECRET=<generate_with_openssl_rand_base64_32>

# AI Services
OPENAI_API_KEY=<your_openai_key>
ANTHROPIC_API_KEY=<your_anthropic_key>

# OAuth - Google
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_secret>

# OAuth - Okta
OKTA_CLIENT_ID=<your_okta_client_id>
OKTA_CLIENT_SECRET=<your_okta_secret>
OKTA_ISSUER=https://<your-okta-domain>.okta.com

# Stripe (Payment Processing)
STRIPE_PUBLIC_KEY=<your_stripe_public_key>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>
STRIPE_PRICE_ID_PRO_MONTHLY=<stripe_price_id>
STRIPE_PRICE_ID_PRO_YEARLY=<stripe_price_id>
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=<stripe_price_id>
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=<stripe_price_id>

# App Settings
NODE_ENV=production
PORT=3000
```

#### Monitoring & Maintenance

**Health Checks**:
```bash
# Check application health
curl https://prompteasy.yourdomain.com/api/health

# Check Docker containers
docker compose ps

# View logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f redis
```

**Performance Monitoring**:
- Set up application monitoring (consider New Relic, Datadog, or self-hosted Prometheus)
- Monitor database performance
- Track API response times
- Monitor disk usage

**Backup Verification**:
```bash
# Test backup restore
gunzip -c /opt/prompteasy/backups/backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i prompteasy-db psql -U prompteasy -d prompteasy_test
```

---

## Security Considerations

### Authentication & Authorization

1. **Password Security**
   - Bcrypt with 12 rounds for hashing
   - Password strength requirements
   - Rate limiting on login attempts (5 per 15 minutes)
   - Account lockout after failed attempts

2. **Session Management**
   - JWT tokens with short expiration (15 minutes)
   - Refresh tokens with rotation
   - Secure, httpOnly cookies
   - CSRF protection

3. **OAuth Security**
   - Validate OAuth state parameter
   - Verify OAuth tokens
   - Secure token storage

### API Security

1. **Rate Limiting**
   - Per-user rate limits
   - Per-IP rate limits for public endpoints
   - Different limits for different endpoints

2. **Input Validation**
   - Zod schema validation on all inputs
   - SQL injection prevention (Prisma ORM)
   - XSS prevention (React escaping)

3. **Authorization**
   - Row-level security in database
   - Permission checks on all operations
   - Validate user owns resources

### Data Security

1. **Encryption**
   - HTTPS/TLS 1.3 for all traffic
   - Encrypted database connections
   - Encrypted backups

2. **Sensitive Data**
   - Do not log sensitive information
   - Redact in error messages
   - Secure environment variables

3. **GDPR Compliance**
   - Data export functionality
   - Account deletion
   - Privacy policy
   - Cookie consent

### Infrastructure Security

1. **Container Security**
   - Run containers as non-root user
   - Minimal base images
   - Regular security updates
   - Scan images for vulnerabilities

2. **Network Security**
   - Firewall rules (UFW)
   - Internal network for services
   - No direct database access from internet

3. **Monitoring**
   - Log all security events
   - Alert on suspicious activity
   - Regular security audits

---

## Future Enhancements

### Phase 11+: Advanced Features

1. **Team Workspaces**
   - Separate workspaces per team
   - Team member management
   - Shared prompt libraries
   - Team analytics

2. **Prompt Marketplace**
   - Buy/sell premium prompts
   - Subscription models
   - Revenue sharing
   - Quality ratings

3. **AI Training**
   - Custom fine-tuned models
   - Train on user's prompts
   - Personalized improvements
   - Learning from feedback

4. **Advanced Analytics**
   - A/B testing for prompts
   - ROI tracking
   - Engagement metrics
   - Cost tracking (API usage)

5. **Integrations**
   - Slack integration
   - Microsoft Teams
   - Notion
   - API webhooks

6. **Mobile Applications**
   - iOS app
   - Android app
   - Mobile-first design

7. **Advanced Editor Features**
   - Collaborative editing (real-time)
   - Prompt chains (multi-step)
   - Conditional logic in prompts
   - Visual prompt builder

8. **Enterprise Features**
   - SSO with SAML
   - Advanced permissions
   - Audit logs
   - Compliance reports
   - Custom deployment options

---

## Conclusion

This comprehensive plan outlines the development of **PromptEasy**, a sophisticated prompt management system for LLM users. The project is structured in 11 phases over approximately 27 weeks, with clear deliverables and milestones.

### Key Success Factors

1. **User-Centric Design**: Focus on UX/UI to make prompt management intuitive
2. **AI Integration**: Leverage AI to provide real value in prompt improvement
3. **Performance**: Fast loading, responsive UI, efficient database queries
4. **Security**: Robust authentication, authorization, and data protection
5. **Scalability**: Architecture designed to scale with user growth

### Next Steps

1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1: Foundation & Infrastructure
4. Iterate based on user feedback during development

---

**Document Version:** 1.1
**Last Updated:** 2025-10-11
**Status:** Updated with Enterprise Organization Features

### Version History
- **v1.1** (2025-10-11): Added Enterprise tier, organization management, subscription billing, and updated implementation timeline to 27 weeks
- **v1.0** (2025-10-11): Initial project plan
