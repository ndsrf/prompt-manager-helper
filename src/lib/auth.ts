import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { checkLoginRateLimit } from './rate-limit';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Rate limit login attempts by email
        // Use email as identifier to prevent brute force attacks on specific accounts
        const rateLimitResult = await checkLoginRateLimit(credentials.email.toLowerCase());

        if (!rateLimitResult.success) {
          const resetDate = new Date(rateLimitResult.reset * 1000);
          const minutesUntilReset = Math.ceil((rateLimitResult.reset * 1000 - Date.now()) / 60000);
          throw new Error(
            `Too many login attempts. Please try again in ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}.`
          );
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('User not found');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow OAuth redirects to Vercel preview deployments
      // This enables OAuth to work on preview deployments without additional Google Console configuration

      // If the URL is relative, use it
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // If the URL is from the same origin, allow it
      if (url.startsWith(baseUrl)) return url;

      // Allow Vercel preview deployments (*.vercel.app)
      const urlObj = new URL(url);
      if (urlObj.hostname.endsWith('.vercel.app')) {
        return url;
      }

      // Default to baseUrl for any other cases
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser) {
          // Update existing user with Google info if not already set
          if (!existingUser.provider || existingUser.provider === 'email') {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                provider: 'google',
                providerId: account.providerAccountId,
                avatarUrl: user.image,
                emailVerified: true,
                lastLogin: new Date(),
              },
            });
          } else {
            // Just update last login
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLogin: new Date() },
            });
          }
          // Store the existing user ID for later use
          user.id = existingUser.id;
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              provider: 'google',
              providerId: account.providerAccountId,
              avatarUrl: user.image,
              emailVerified: true,
              lastLogin: new Date(),
            },
          });
          user.id = newUser.id;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
