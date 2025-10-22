import { prisma } from './prisma';
import crypto from 'crypto';

// Generate a secure random token
export function generateExtensionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Create an extension token for a user
export async function createExtensionToken(
  userId: string,
  name?: string,
  expiresInDays: number = 90 // Default 90 days
) {
  const token = generateExtensionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const extensionToken = await prisma.extensionToken.create({
    data: {
      userId,
      token,
      name: name || 'Chrome Extension',
      expiresAt,
    },
  });

  return extensionToken;
}

// Validate and get user from extension token
export async function validateExtensionToken(token: string) {
  const extensionToken = await prisma.extensionToken.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!extensionToken) {
    return null;
  }

  // Check if token is expired
  if (extensionToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.extensionToken.delete({
      where: { id: extensionToken.id },
    });
    return null;
  }

  // Update last used timestamp
  await prisma.extensionToken.update({
    where: { id: extensionToken.id },
    data: { lastUsed: new Date() },
  });

  return extensionToken.user;
}

// Revoke an extension token
export async function revokeExtensionToken(tokenId: string, userId: string) {
  const token = await prisma.extensionToken.findFirst({
    where: {
      id: tokenId,
      userId,
    },
  });

  if (!token) {
    throw new Error('Token not found or does not belong to user');
  }

  await prisma.extensionToken.delete({
    where: { id: tokenId },
  });
}

// Get all extension tokens for a user
export async function getUserExtensionTokens(userId: string) {
  return await prisma.extensionToken.findMany({
    where: {
      userId,
      expiresAt: {
        gte: new Date(), // Only return non-expired tokens
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      lastUsed: true,
      createdAt: true,
      expiresAt: true,
      // Don't return the actual token for security
    },
  });
}

// Clean up expired tokens (run periodically)
export async function cleanupExpiredTokens() {
  const result = await prisma.extensionToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
