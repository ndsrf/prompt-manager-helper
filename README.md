# PromptEasy - AI Prompt Management Platform

A professional prompt engineering and management platform built with Next.js, tRPC, Prisma, and NextAuth.js.

## 🚀 Phase 1 Implementation Status

**Status**: ✅ Complete - Ready for database configuration

### Implemented Features

#### Backend Infrastructure
- ✅ **PostgreSQL Database** - Prisma ORM with full schema
- ✅ **Redis Cache** - Session storage and rate limiting
- ✅ **Authentication** - NextAuth.js with JWT strategy
  - Email/password authentication
  - Google OAuth integration
  - Automatic user creation on first OAuth login
  - Session management with JWT
- ✅ **API Layer** - tRPC with end-to-end type safety
- ✅ **Security** - bcrypt password hashing (12 rounds), rate limiting
- ✅ **Testing** - Jest configuration with 70%+ coverage target

#### Frontend Foundation
- ✅ **Next.js 14** - App Router with React Server Components
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Shadcn UI** - Component library configured
- ✅ **TypeScript** - Strict mode enabled
- ✅ **Form Handling** - React Hook Form + Zod validation

## 📋 Prerequisites

- Node.js 18+
- npm or pnpm
- Cloud PostgreSQL database (Neon, Supabase, Railway, etc.)
- Cloud Redis instance (Upstash, Redis Cloud, Railway, etc.)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Update the `.env` file with your cloud database credentials:

```env
# PostgreSQL Connection (replace with your cloud provider URL)
DATABASE_URL="postgresql://username:password@host:5432/prompteasy?schema=public"

# Redis Connection (replace with your cloud provider URL)
REDIS_URL="redis://username:password@host:6379"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

NODE_ENV="development"
```

#### Setting up Google OAuth

Google OAuth allows users to sign in with their Google accounts. To set it up:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`
   - Click "Create"
5. Copy the Client ID and Client Secret to your `.env` file

**Note**: Google OAuth is optional. Users can still register/login with email and password if Google OAuth is not configured.

#### Cloud Database Providers

**PostgreSQL Options:**
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL with built-in features
- [Railway](https://railway.app) - PostgreSQL hosting
- [Render](https://render.com) - PostgreSQL databases

**Redis Options:**
- [Upstash](https://upstash.com) - Serverless Redis
- [Redis Cloud](https://redis.com/cloud) - Managed Redis
- [Railway](https://railway.app) - Redis hosting

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

```bash
npx prisma db push
```

Or create a migration:

```bash
npx prisma migrate dev --name init
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
prompteasy/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth.js routes
│   │   │   └── trpc/          # tRPC API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── redis.ts           # Redis client
│   │   ├── rate-limit.ts      # Rate limiting
│   │   └── utils.ts           # Utility functions
│   ├── server/
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── trpc/
│   │       ├── trpc.ts        # tRPC setup
│   │       └── router/
│   │           ├── _app.ts    # Root router
│   │           └── auth.ts    # Auth endpoints
│   └── types/
│       └── next-auth.d.ts     # NextAuth type extensions
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🗄️ Database Management

```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# View database schema
npx prisma db pull

# Check migration status
npx prisma migrate status

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 rounds (NIST compliant)
- **Rate Limiting**: 5 attempts per 15 minutes via Redis
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **Session Security**: JWT with httpOnly cookies
- **CSRF Protection**: Built-in via NextAuth.js

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run tests
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run database migrations
```

## 🌐 API Endpoints

### tRPC Endpoints

**Base URL**: `http://localhost:3000/api/trpc`

- `auth.register` - User registration
- `auth.checkEmail` - Check if email exists
- `auth.me` - Get current user

### NextAuth Endpoints

**Base URL**: `http://localhost:3000/api/auth`

- `/signin` - Sign in page
- `/signout` - Sign out
- `/session` - Get session
- `/callback/credentials` - Login handler

## 🔧 Troubleshooting

### Database Connection Issues

1. Verify your `DATABASE_URL` is correct
2. Ensure your cloud database is accessible
3. Check firewall rules allow connections
4. Test connection: `npx prisma db pull`

### Redis Connection Issues

1. Verify your `REDIS_URL` is correct
2. Ensure Redis instance is running
3. Check authentication credentials
4. Test with: `redis-cli -u $REDIS_URL ping`

### Build Errors

1. Clear Next.js cache: `rm -rf .next`
2. Regenerate Prisma client: `npx prisma generate`
3. Clear node modules: `rm -rf node_modules && npm install`

## 📚 Next Steps

1. ✅ Configure cloud database URLs in `.env`
2. ✅ Run Prisma migrations
3. 🔄 Implement authentication UI pages
4. 🔄 Create dashboard layout
5. 🔄 Add prompt management features

## 🤝 Contributing

This project follows best practices for:
- TypeScript strict mode
- ESLint configuration
- Prettier code formatting
- Conventional commits
- Comprehensive testing

## 📄 License

MIT

---

**Built with**: Next.js 14, TypeScript, Prisma, tRPC, NextAuth.js, Tailwind CSS, Shadcn UI
